import { UserMenu } from "./user-menu";

export default function DashboardHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        backgroundColor:
          "color-mix(in oklab, var(--background) 80%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground tracking-[-0.02em] cursor-default">
            Null Void
          </p>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
