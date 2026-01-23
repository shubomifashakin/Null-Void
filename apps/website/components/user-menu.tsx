"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { logout, getAccountInfo } from "@/data-service/mutations";

//FIXME: correclty implement
export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const { data, status, error } = useQuery({
    staleTime: Infinity,
    queryFn: getAccountInfo,
    queryKey: ["account-info"],
  });

  const { mutate, isPending } = useMutation({
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
        toast.error("Too many request");
      }

      toast.error("Something went wrong");
    },
  });

  function handleLogout() {
    mutate();
  }

  function handleNavigateToSettings() {
    router.push("/settings");
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors">
          {status === "success" && (
            <>
              <div className="rounded-full w-8 h-8 overflow-hidden relative">
                <Image
                  fill
                  src={data?.picture || ""}
                  alt={data?.name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">
                {data?.name}
              </span>
            </>
          )}

          {status === "pending" && <LoaderCircle className="animate-spin" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold text-foreground">{data?.name}</p>
          <p className="text-xs text-muted-foreground">{data?.email}</p>
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
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
