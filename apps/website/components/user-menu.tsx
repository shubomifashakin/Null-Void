"use client";

import { useState } from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const user = {
    name: "Fashakin Olashubomi",
    email: "nelsonstretch34@gmail.com",
    image: "",
    id: "1234",
  };

  //FIXME: USE MUTATION
  function handleLogout() {}

  function handleNavigateToSettings() {
    router.push("/settings");
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors">
          <Image
            src={user.image}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium text-foreground hidden sm:inline">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleNavigateToSettings}
        >
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
