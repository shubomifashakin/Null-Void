import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNav } from "@/components/dashboard-nav";

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
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-52 shrink-0 border-r border-border flex-col">
        <div className="px-5 py-6">
          <p className="font-semibold tracking-[-0.02em] text-foreground">
            Null Void
          </p>
        </div>

        <DashboardNav />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-50 border-b border-border flex items-center justify-between md:justify-end px-6 md:px-10 py-5"
          style={headerStyle}
        >
          <p className="font-semibold tracking-[-0.02em] md:hidden">
            Null Void
          </p>
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <UserMenu />
          </div>
        </header>

        <div className="md:hidden">
          <DashboardNav mobile />
        </div>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
