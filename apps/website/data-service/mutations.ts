import { Room } from "@/types/room";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function createRoom({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const request = await fetchWithAuth(`${baseUrl}/rooms`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = (await request.json()) as { id: string };

  return response;
}

export async function fetchRooms({ cursor }: { cursor?: string }) {
  const url = new URL(baseUrl + "/rooms");

  if (cursor) {
    url.searchParams.append("cursor", cursor);
  }

  const request = await fetchWithAuth(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = (await request.json()) as {
    data: Room[];
    cursor?: string;
    hasNextPage: boolean;
  };

  return response;
}

export async function logout() {
  const request = await fetchWithAuth(`${baseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = await request.json();
  return response;
}

export async function deleteAccount() {
  const request = await fetchWithAuth(`${baseUrl}/accounts/me`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = await request.json();
  return response;
}

export async function updateAccountInfo({ name }: { name: string }) {
  const request = await fetchWithAuth(`${baseUrl}/accounts/me`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = await request.json();
  return response;
}

export async function getAccountInfo() {
  const request = await fetchWithAuth(`${baseUrl}/accounts/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = (await request.json()) as {
    name: string;
    id: string;
    email: string;
    picture: string | null;
    created_at: Date;
  };

  return response;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retries = 0
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if ((response.status === 403 || response.status === 401) && retries < 1) {
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: "GET",
      credentials: "include",
    });

    if (refreshRes.ok) {
      return fetchWithAuth(url, options, retries + 1);
    }
  }

  return response;
}
