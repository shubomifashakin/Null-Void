"use client";

import { useState } from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  user: { id: string; name: string; email: string; image: string };
  onSettingsClick: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  user,
  onSettingsClick,
  onLogout,
}: DashboardHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                NV
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Null-Void</h1>
          </div>

          {/* User Menu */}
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
                <p className="text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  onSettingsClick();
                  setIsOpen(false);
                }}
                className="cursor-pointer"
              >
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
