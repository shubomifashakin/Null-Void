import { UserMenu } from "./user-menu";

export default function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-bold cursor-default">Null Void</p>
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
