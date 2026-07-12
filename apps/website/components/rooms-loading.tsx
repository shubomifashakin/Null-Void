"use client";

import { Loader2 } from "lucide-react";

export default function RoomLoading() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Setting up room</p>
          <p className="text-xs text-muted-foreground">
            Connecting and loading members...
          </p>
        </div>
      </div>
    </div>
  );
}
