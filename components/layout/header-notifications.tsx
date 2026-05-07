"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import NotificationsSection from "@/components/layout/notifications-section";
import type { NotificationDTO, NotificationListDTO } from "@/lib/api/types";

const POLL_INTERVAL_MS = 30_000;

// 헤더용 알림 dropdown.
// - 종 아이콘 + unread 배지
// - 클릭 시 dropdown 펼쳐짐 (NotificationsSection 재사용)
// - 30 초 폴링, 열렸다 닫힐 때 mark-read
export default function HeaderNotifications() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [notifs, setNotifs] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastOpenRef = useRef(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationListDTO;
      setNotifs(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 마운트 + 폴링
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, fetchNotifications]);

  // dropdown 열릴 때 즉시 갱신, 닫힐 때 mark-read
  useEffect(() => {
    if (!user) return;
    if (open && !lastOpenRef.current) {
      fetchNotifications();
    }
    if (!open && lastOpenRef.current && unreadCount > 0) {
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
        .then(() => {
          setUnreadCount(0);
          setNotifs((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
        })
        .catch(() => {});
    }
    lastOpenRef.current = open;
  }, [open, unreadCount, user, fetchNotifications]);

  // 미로그인 / 로딩 상태에서는 렌더하지 않음 — 호출부에서 status/세션 체크 후 사용.
  if (status === "loading" || !user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="알림"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-[7px] text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1l-2-2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 20a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread`}
            className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-gold text-[10px] font-bold text-white border-2 border-surface"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-80 bg-surface-raised border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <NotificationsSection
            items={notifs}
            unreadCount={unreadCount}
            loading={loading}
            onItemClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
