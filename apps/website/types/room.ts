import type { Role as UserRole } from "@null-void/shared";

export type Role = UserRole;
export interface Room {
  role: Role;
  id: string;
  name: string;
  joinedAt: Date;
  createdAt: Date;
  description: string;
}
