import { UserMenu } from "./user-menu";

export default function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                NV
              </span>
            </div>
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
