"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/server/actions/notifications";

type NotifData = { link?: string; orderId?: string; orderNumber?: string } | null;

export type Notification = {
  id: string;
  title: string;
  body: string | null;
  data: NotifData;
  read_at: string | null;
  created_at: string;
};

type Props = {
  notifications: Notification[];
  unreadCount: number;
};

function relativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function NotificationsBell({ notifications: initial, unreadCount: initialCount }: Props) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(initial);
  const [unread, setUnread] = useState(initialCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function markRead(id: string) {
    const notif = notifs.find(n => n.id === id);
    if (!notif || notif.read_at) return;
    startTransition(async () => {
      await markNotificationReadAction({ notificationId: id });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread(prev => Math.max(0, prev - 1));
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction({});
      setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnread(0);
    });
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative size-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition text-neutral-600"
        aria-label={`Notificaciones${unread > 0 ? ` · ${unread} sin leer` : ""}`}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none pointer-events-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-neutral-200 shadow-elevated z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-heading-sm font-semibold text-neutral-900">
              Notificaciones
            </span>
            {unread > 0 && (
              <button
                onClick={markAll}
                disabled={isPending}
                className="text-body-xs text-primary-600 hover:text-primary-700 font-medium transition disabled:opacity-50"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="size-8 text-neutral-200 mb-2" />
                <p className="text-body-sm text-neutral-400">Sin notificaciones</p>
                <p className="text-body-xs text-neutral-300 mt-0.5">
                  Te avisaremos cuando haya novedades
                </p>
              </div>
            ) : (
              notifs.map(notif => {
                const isUnread = !notif.read_at;
                const link = notif.data?.link;

                const inner = (
                  <div className={`flex items-start gap-2.5 px-4 py-3 ${isUnread ? "bg-primary-50/50" : ""}`}>
                    <div className="mt-1.5 shrink-0">
                      {isUnread
                        ? <span className="size-2 block bg-primary-500 rounded-full" />
                        : <span className="size-2 block" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-body-sm leading-snug ${isUnread ? "font-semibold text-neutral-900" : "font-medium text-neutral-700"}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-body-xs text-neutral-500 mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-body-xs text-neutral-400 mt-1">
                        {relativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                );

                if (link) {
                  return (
                    <Link
                      key={notif.id}
                      href={link}
                      className="block hover:bg-neutral-50 transition"
                      onClick={() => { markRead(notif.id); setOpen(false); }}
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    className="hover:bg-neutral-50 transition cursor-default"
                    onClick={() => markRead(notif.id)}
                  >
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
