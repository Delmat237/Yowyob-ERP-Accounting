"use client";

import { useMemo } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bell, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

    const sorted = useMemo(() => {
        return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [notifications]);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {unreadCount > 0
                            ? `${unreadCount} notification(s) non lue(s)`
                            : "Toutes les notifications sont lues."}
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={clearAll}
                    disabled={sorted.length === 0}
                >
                    <Trash2 className="h-4 w-4" />
                    Tout effacer
                </Button>
            </div>

            {sorted.length === 0 ? (
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Aucune notification.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sorted.map((n) => (
                        <Card
                            key={n.id}
                            className={cn(
                                "border-gray-100 shadow-sm",
                                !n.isRead && "border-l-4 border-l-blue-500",
                            )}
                        >
                            <CardHeader className="flex flex-row items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <Bell className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{n.title}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {!n.isRead ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => void markAsRead(n.id)}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Marquer comme lu
                                    </Button>
                                ) : null}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{n.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

