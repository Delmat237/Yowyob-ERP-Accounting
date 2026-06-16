"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => void;
}

/**
 * Connects to the backend SSE stream and receives real-time notifications.
 * Automatically shows toast popups and maintains a local notification list.
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');
    const organizationId = localStorage.getItem('organization_id');

    if (!token || !organizationId) return;

    // Close any previous connection
    eventSourceRef.current?.close();

    // Build SSE URL with auth params (EventSource doesn't support custom headers).
    // The backend OrganizationWebFilter requires the `organizationId` query param
    // (it cannot read an X-Organization-Id header from EventSource); notifications
    // are keyed by organization, so this is also the SSE sink key.
    const url = new URL(`${apiBase}/api/accounting/notifications/stream`);
    url.searchParams.set('token', token);
    url.searchParams.set('organizationId', organizationId);

    const es = new EventSource(url.toString(), { withCredentials: false });

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notif: AppNotification = JSON.parse(e.data);
        setNotifications(prev => [notif, ...prev]);

        // Show toast popup based on notification type
        const toastFn =
          notif.type === 'BROUILLARD' ? toast.info :
          notif.type === 'ERROR'      ? toast.error :
          toast.message;

        toastFn(notif.title, {
          description: notif.message,
          duration: 6000,
          action: notif.referenceId
            ? { label: 'Voir', onClick: () => window.location.href = `/accounting/semi-auto-entries` }
            : undefined,
        });
      } catch (err) {
        console.error('Failed to parse SSE notification', err);
      }
    });

    es.onerror = () => {
      // Auto-reconnect after 5s on error
      es.close();
      setTimeout(connect, 5000);
    };

    eventSourceRef.current = es;
  }, [apiBase]);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const organizationId = localStorage.getItem('organization_id');
      const tenantId = localStorage.getItem('tenant_id');
      await fetch(`${apiBase}/api/accounting/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Organization-Id': organizationId ?? '',
          'X-Tenant-Id': tenantId ?? '',
        },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, [apiBase]);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, markAsRead, clearAll };
}
