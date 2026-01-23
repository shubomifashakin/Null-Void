export type Role = "ADMIN" | "MEMBER";

export interface Room {
  role: Role;
  id: string;
  name: string;
  joinedAt: Date;
  createdAt: Date;
  description: string;
}
