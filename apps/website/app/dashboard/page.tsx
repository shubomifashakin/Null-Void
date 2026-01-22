"use client";

import { useState } from "react";

import RoomsList from "@/components/rooms-list";
import InvitesList from "@/components/invites-list";
import DashboardHeader from "@/components/dashboard-header";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"rooms" | "invites">("rooms");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        user={{
          name: "Fashakin Olashubomi",
          email: "nelsonstretch34@gmail.com",
          image: "",
          id: "1234",
        }}
        onSettingsClick={() => {}}
        onLogout={() => {}}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border mb-8">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "rooms"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Rooms
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "invites"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invites
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "rooms" && <RoomsList />}
        {activeTab === "invites" && <InvitesList />}
      </main>
    </div>
  );
}
