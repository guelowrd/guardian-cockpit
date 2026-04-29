"use client";
import Image from "next/image";
import { NavItem } from "./NavItem";
import {
  LayoutDashboard,
  ScrollText,
  Users,
  ArrowLeftRight,
  ShieldCheck,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-zinc-900 px-3 py-6">
        <div className="mb-8 flex items-center gap-2 px-3">
          <Image src="/orangerobot.png" alt="Guardian" width={20} height={20} className="shrink-0" />
          <span className="text-sm font-semibold text-white">Guardian Dashboard</span>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItem href="/overview" label="Overview" icon={<LayoutDashboard className="h-4 w-4" />} />
          <NavItem href="/logs" label="Logs" icon={<ScrollText className="h-4 w-4" />} />
          <NavItem href="/accounts" label="Accounts" icon={<Users className="h-4 w-4" />} />
          <NavItem href="/transactions" label="Transactions" icon={<ArrowLeftRight className="h-4 w-4" />} />
          <NavItem href="/compliance" label="Compliance" icon={<ShieldCheck className="h-4 w-4" />} />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
