import { Room } from "@/types/room";

const baseUrl = process.env.BACKEND_URL!;

export async function createRoom({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  console.log(
    "Creating room with name:",
    name,
    "and description:",
    description
  );
  const request = await fetch(`${baseUrl}/rooms`, {
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
  const url = new URL(`${baseUrl}/rooms`);

  if (cursor) {
    url.searchParams.append("cursor", cursor);
  }

  const request = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message);
  }

  const response = (await request.json()) as {
    rooms: Room[];
    cursor?: string;
    hasNextPage: boolean;
  };

  return response;
}

export async function logout() {
  const request = await fetch(`${baseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!request.ok) {
    const error = (await request.json()) as { message: string };
    throw new Error(error.message);
  }

  const response = await request.json();
  return response;
}
