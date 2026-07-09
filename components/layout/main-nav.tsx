/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarLink } from "@/config/navigation";
import { useLoadingStore } from "@/hooks/use-loading-store";
import { useAuth } from "@/hooks/use-auth";

interface MainNavProps {
  links: SidebarLink[];
}

export function MainNav({ links }: MainNavProps) {
  const pathname = usePathname();
  const { startLoading } = useLoadingStore();
  const { accountingRole } = useAuth();

  const visibleLinks = links.filter((link) => {
    if (!link.allowedRoles || link.allowedRoles.length === 0) return true;
    if (!accountingRole) return false;
    return link.allowedRoles.includes(accountingRole);
  });

  return (
    <nav className="grid gap-1 p-2">
      {visibleLinks.map((link, index) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={index}
            href={link.href}
            prefetch={false}
            onClick={() => {
              const isCurrent =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              if (!isCurrent) {
                startLoading();
              }
            }}
            className={cn(
              "flex items-start gap-3 rounded-r-full rounded-l-none px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200/50",
              isActive
                ? "bg-blue-100 text-blue-800 font-semibold hover:bg-blue-100"
                : "hover:bg-gray-200"
            )}
          >
            <link.icon
              className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                isActive ? "text-blue-700" : "text-gray-600"
              )}
            />
            <span className="min-w-0 flex-1 leading-snug line-clamp-2">
              {link.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
