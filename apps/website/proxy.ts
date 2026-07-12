import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import * as jose from "jose";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
const spki = Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64!, "base64").toString(
  "utf-8",
);

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token");

  const alg = "RS256";
  const publicKey = await jose.importSPKI(spki, alg);

  const { payload } = await jose
    .jwtVerify(accessToken?.value || "", publicKey)
    .catch(() => {
      return { payload: false };
    });

  if (payload) return NextResponse.next();

  const refreshToken = request.cookies.get("refresh_token");

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = await fetch(backendUrl + "/auth/refresh", {
    method: "GET",
    headers: {
      Cookie: `refresh_token=${refreshToken.value}`,
    },
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cookies = response.headers.getSetCookie();

  if (!cookies.length) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const nextResponse = NextResponse.next();

  for (const cookie of cookies) {
    const [nameValue, ...attributes] = cookie.split(";");
    const [name, value] = nameValue.split("=");

    let maxAge: number | undefined;
    let path = "/";
    let httpOnly = false;
    let secure = false;
    let sameSite: "strict" | "lax" | "none" = "lax";
    let domain: string | undefined;

    for (const attr of attributes) {
      const [key, val] = attr.trim().split("=");
      const lowerKey = key.toLowerCase();

      if (lowerKey === "max-age") maxAge = parseInt(val);
      if (lowerKey === "path") path = val;
      if (lowerKey === "httponly") httpOnly = true;
      if (lowerKey === "secure") secure = true;
      if (lowerKey === "samesite")
        sameSite = val.toLowerCase() as "strict" | "lax" | "none";
      if (lowerKey === "domain") domain = val;
    }

    nextResponse.cookies.set(name, value, {
      maxAge,
      path,
      httpOnly,
      secure,
      sameSite,
      domain,
    });
  }

  return nextResponse;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
