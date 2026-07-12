import { DashboardNav } from "@/components/dashboard-nav";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NullVoidIcon } from "@/components/null-void-icon";

const headerStyle = {
  backgroundColor: "color-mix(in oklab, var(--background) 80%, transparent)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto min-h-screen flex flex-col">
        <header
          className="sticky top-0 z-50 border-b border-border flex items-center justify-between px-6 py-5"
          style={headerStyle}
        >
          <div className="flex items-center gap-2 text-foreground">
            <NullVoidIcon className="h-5 w-5" />
            <p className="font-semibold tracking-[-0.02em]">Null Void</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <div className="md:hidden border-b border-border">
          <DashboardNav mobile />
        </div>

        <div className="flex flex-1">
          <aside className="hidden md:flex w-52 shrink-0 border-r border-border flex-col">
            <DashboardNav />
          </aside>

          <main className="flex-1 min-w-0 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
