"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { logout, getAccountInfo } from "@/data-service/mutations";

export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const { data, status, refetch } = useQuery({
    staleTime: Infinity,
    queryFn: getAccountInfo,
    queryKey: ["account-info"],
  });

  const { mutate: logoutUser, isPending } = useMutation({
    mutationFn: logout,
    mutationKey: ["logout"],
    onSuccess: () => {
      router.push("/");
    },

    onError: (error) => {
      if (error.cause === 401) {
        return router.push("/");
      }

      if (error.cause === 404) {
        return router.push("/404");
      }

      if (error.cause === 429) {
        return toast.error("Too many requests");
      }

      toast.error("Something went wrong");
    },
  });

  function handleLogout() {
    logoutUser();
  }

  function handleNavigateToSettings() {
    router.push("/settings");
  }

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="relative group">
        <button
          title="Click to retry"
          onClick={() => refetch()}
          className="flex items-center cursor-pointer gap-2 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-destructive" />

          <span className="text-sm text-destructive">Error loading user</span>
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center cursor-pointer gap-3 p-2 rounded-lg hover:bg-background transition-colors">
          <div className="rounded-full w-8 h-8 overflow-hidden relative">
            <Image
              fill
              src={
                data?.picture ||
                "https://avatars.githubusercontent.com/u/12345?v=4"
              }
              alt={data?.name || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">
            {data?.name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold text-foreground">{data?.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {data?.email}
          </p>
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
          disabled={isPending}
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
