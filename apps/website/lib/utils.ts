import { Role } from "@null-void/shared";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleColor(role: Role) {
  switch (role) {
    case "ADMIN":
      return "bg-primary/10 text-primary";

    case "EDITOR":
      return "bg-blue-500/10 text-blue-600";

    case "VIEWER":
      return "bg-yellow-500/10 text-yellow-600";

    default:
      return "bg-muted text-muted-foreground";
  }
}
