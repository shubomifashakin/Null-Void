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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-150 ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-1 mb-8 p-1 bg-muted rounded-lg w-fit">
          <TabButton
            active={activeTab === "rooms"}
            onClick={() => setActiveTab("rooms")}
          >
            My Rooms
          </TabButton>

          <TabButton
            active={activeTab === "invites"}
            onClick={() => setActiveTab("invites")}
          >
            Invites
          </TabButton>
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
