"use client";

import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
    const { unreadCount } = useNotifications();

    return (
        <Button variant="ghost" size="icon" className="relative group" asChild>
            <Link href="/notifications" aria-label="Voir les notifications">
                <Bell className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                    </span>
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Link>
        </Button>
    );
}
