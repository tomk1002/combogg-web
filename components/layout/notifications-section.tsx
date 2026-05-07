"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n-client";
import { timeAgo } from "@/lib/utils";
import type { NotificationDTO, NotificationTypeDTO } from "@/lib/api/types";

interface Props {
  items: NotificationDTO[];
  unreadCount: number;
  loading: boolean;
  onItemClick?: () => void;
}

export default function NotificationsSection({ items, unreadCount, loading, onItemClick }: Props) {
  const { t } = useLang();

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          {t.notif_title}
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto scrollbar-none">
        {loading && items.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-text-muted">…</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-text-muted">{t.notif_empty}</div>
        ) : (
          items.map((n) => <NotificationRow key={n.id} n={n} t={t} onClick={onItemClick} />)
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  n,
  t,
  onClick,
}: {
  n: NotificationDTO;
  t: ReturnType<typeof useLang>["t"];
  onClick?: () => void;
}) {
  const action = actionLabel(n.type, t);
  const actorName = n.actor.nickname || t.notif_actor_anon;
  const isUnread = n.readAt === null;
  return (
    <Link
      href={`/combos/${n.combo.id}`}
      onClick={onClick}
      className={`flex items-start gap-2.5 px-4 py-2.5 hover:bg-surface-overlay transition-colors ${isUnread ? "bg-gold/5" : ""}`}
    >
      {n.actor.avatarUrl ? (
        <Image
          src={n.actor.avatarUrl}
          alt={actorName}
          width={24}
          height={24}
          className="rounded-full shrink-0 mt-0.5"
        />
      ) : (
        <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0 mt-0.5">
          {actorName[0]?.toUpperCase()}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug text-text">
          <span className="font-bold">{actorName}</span>
          <span className="text-text-secondary">{action}</span>
        </p>
        <p className="text-[11px] text-text-muted truncate mt-0.5">
          {n.combo.title} · {timeAgo(n.createdAt)}
        </p>
      </div>
      {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5" aria-hidden />}
    </Link>
  );
}

function actionLabel(type: NotificationTypeDTO, t: ReturnType<typeof useLang>["t"]): string {
  switch (type) {
    case "like":    return t.notif_action_like;
    case "save":    return t.notif_action_save;
    case "comment": return t.notif_action_comment;
    case "share":   return t.notif_action_share;
  }
}
