"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
