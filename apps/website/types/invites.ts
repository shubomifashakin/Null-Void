import { Role } from "./room";

export type InviteStatus = "PENDING";

export interface Invites {
  id: string;
  role: Role;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  roomName: string;
  invitersName: string;
  invitersPicture: string | null;
}
