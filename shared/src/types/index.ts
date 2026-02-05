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

export type Role = "ADMIN" | "VIEWER" | "EDITOR";

export type RoomInfoPayload = {
  name: string;
  description: string;
};

export type UserInfoPayload = {
  name: string;
  role: Role;
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

export interface Points {
  x: number;
  y: number;
}

export interface FillStyle {
  color: string;
  opacity: number;
}

export interface DrawEventBase {
  type: "line" | "circle" | "polygon";
  strokeColor: string;
  strokeWidth: number;
  timestamp: string;
  id: string;
}

export interface LineEvent extends DrawEventBase {
  type: "line";
  from: Points;
  to: Points;
}

export interface CircleEvent extends DrawEventBase {
  type: "circle";
  radius: number;
  center: Points;
  fillStyle?: FillStyle;
}

export interface PolygonEvent extends DrawEventBase {
  type: "polygon";
  points: Points[];
  fillStyle?: FillStyle;
}

export type DrawEvent = LineEvent | CircleEvent | PolygonEvent;
