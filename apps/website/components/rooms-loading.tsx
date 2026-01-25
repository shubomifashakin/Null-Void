"use client";

export default function RoomLoading() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-transparent border-b-primary/50 rounded-full animate-spin-reverse" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Please wait while we setup the room...
          </h2>
          <p className="text-sm text-muted-foreground">
            Connecting to room and loading members...
          </p>
        </div>

        <div className="flex gap-2">
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
