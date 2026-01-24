import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import * as jose from "jose";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
const spki = process.env.JWT_PUBLIC_KEY!.replace(/\n/g, "");

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

  const response = await fetch(backendUrl + "auth/refresh", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!$|_next/static|_next/image|favicon.ico).*)"],
};
