"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Mail, User } from "lucide-react";

const navItems = [
  { label: "Rooms", href: "/dashboard", icon: LayoutGrid },
  { label: "Invites", href: "/dashboard/invites", icon: Mail },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex border-b border-border px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
