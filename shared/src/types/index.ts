export type FnResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: Error };

export function makeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error === "object" && "message" in error) {
    const err = new Error(String(error.message));
    if ("name" in error && error.name) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      err.name = String(error.name);
    }
    if ("stack" in error && error.stack) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      err.stack = String(error.stack);
    }
    return err;
  }

  return new Error(String(error));
}

export type UndoDrawPayload = {
  id: string;
  code: number;
};

export type RoomInfoPayload = {
  name: string;
  description: string;
};

export type UserInfoPayload = {
  name: string;
  role: "ADMIN" | "VIEWER" | "EDITOR";
  userId: string;
  picture: string | null;
  joinedAt: Date;
};

export type UserJoinedPayload = UserInfoPayload;

export type UserListPayload = {
  users: UserInfoPayload[];
};

export type RoomReadyPayload = {
  ready: boolean;
  timestamp: number;
  roomId: string;
};

export type RoomErrorPayload = {
  message: string;
  code: number;
};

export type UserDisconnectedPayload = {
  userId: string;
};

export type RoomNotificationPayload = {
  message: string;
};

export type UserPromotedPayload = {
  role: "ADMIN" | "VIEWER" | "EDITOR";
  userId: string;
};

export type UserMovePayload = {
  userId: string;
  x: number;
  y: number;
  timestamp: string;
  isPenDown: boolean;
};
