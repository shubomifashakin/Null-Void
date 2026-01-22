export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface Room {
  role: Role;
  id: string;
  name: string;
  joinedAt: Date;
  createdAt: Date;
  description: string;
}
