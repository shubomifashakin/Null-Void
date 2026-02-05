"use client";

import { Activity, Suspense } from "react";

import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";

import RoomsList from "@/components/rooms-list";
import InvitesList from "@/components/invites-list";
import DashboardHeader from "@/components/dashboard-header";

export default function Page() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "rooms";

  function setActiveTab(tab: "rooms" | "invites") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);

    const newUrl = new URL(pathname, window.location.href);
    newUrl.search = params.toString();

    router.push(newUrl.toString());
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 border-b border-border mb-8">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 cursor-pointer py-2 font-medium text-sm transition-colors ${
              activeTab === "rooms"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Rooms
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`px-4 cursor-pointer py-2 font-medium text-sm transition-colors ${
              activeTab === "invites"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invites
          </button>
        </div>

        <Activity mode={activeTab === "rooms" ? "visible" : "hidden"}>
          <RoomsList />
        </Activity>

        <Activity mode={activeTab === "invites" ? "visible" : "hidden"}>
          <InvitesList />
        </Activity>
      </main>
    </div>
  );
}
