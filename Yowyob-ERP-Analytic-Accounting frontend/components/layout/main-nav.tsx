"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarLink } from "@/config/navigation";

export function MainNav({ links }: { links: SidebarLink[] }) {
    const pathname = usePathname();
    return (
        <nav className="flex flex-col gap-1">
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                            isActive
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                    >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
                        <span className="truncate">{link.title}</span>
                        {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
