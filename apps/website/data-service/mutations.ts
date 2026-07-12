import { Room } from "@/types/room";
import { Invites, InviteStatus } from "@/types/invites";
import { AccountInfo } from "@/types/accountInfo";
import { Role } from "@null-void/shared";

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function createRoom({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const request = await fetchWithAuth(`${backendUrl}/rooms`, {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      description: description.trim(),
    }),
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
  const url = new URL(backendUrl + "/rooms");

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
  const request = await fetchWithAuth(`${backendUrl}/auth/logout`, {
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
  const request = await fetchWithAuth(`${backendUrl}/accounts/me`, {
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
  const request = await fetchWithAuth(`${backendUrl}/accounts/me`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ name: name.trim() }),
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
  const request = await fetchWithAuth(`${backendUrl}/accounts/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message, { cause: request.status });
  }

  const response = (await request.json()) as AccountInfo;

  return response;
}

export async function getInvites({ cursor }: { cursor?: string }) {
  const url = new URL(backendUrl + "/accounts/invites");

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
    data: Invites[];
    cursor?: string;
    hasNextPage: boolean;
  };

  return response;
}

export async function updateInviteStatus({
  inviteId,
  status,
}: {
  inviteId: string;
  status: "ACCEPTED" | "REJECTED";
}) {
  const response = await fetchWithAuth(
    `${backendUrl}/accounts/invites/${inviteId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message: string };
    throw new Error(error.message, { cause: response.status });
  }

  const data = (await response.json()) as {
    message: string;
  };

  return data;
}

export async function sendInvite({
  role,
  email,
  roomId,
}: {
  role: Role;
  email: string;
  roomId: string;
}) {
  const response = await fetchWithAuth(
    `${backendUrl}/rooms/${roomId}/invites`,
    {
      method: "POST",
      body: JSON.stringify({ email, role }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message: string };
    throw new Error(error.message, { cause: response.status });
  }

  const data = (await response.json()) as {
    message: string;
  };

  return data;
}

export async function revokeInvite({
  roomId,
  inviteId,
}: {
  inviteId: string;
  roomId: string;
}) {
  const response = await fetchWithAuth(
    `${backendUrl}/rooms/${roomId}/invites/${inviteId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message: string };
    throw new Error(error.message, { cause: response.status });
  }

  const data = (await response.json()) as {
    message: string;
  };

  return data;
}

export async function getRoomInvites({
  cursor,
  roomId,
}: {
  cursor?: string;
  roomId: string;
}) {
  const url = new URL(backendUrl + `/rooms/${roomId}/invites`);

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
    data: {
      id: string;
      role: Role;
      email: string;
      status: InviteStatus;
      expiresAt: Date;
      invitersName: string;
      invitersId: string;
      createdAt: Date;
    }[];
    cursor?: string;
    hasNextPage: boolean;
  };

  return response;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retries = 0,
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if ((response.status === 403 || response.status === 401) && retries < 1) {
    const refreshRes = await fetch(`${backendUrl}/auth/refresh`, {
      method: "GET",
      credentials: "include",
    });

    if (refreshRes.ok) {
      return fetchWithAuth(url, options, retries + 1);
    }
  }

  return response;
}
