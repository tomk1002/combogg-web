import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function authorDisplayName(author: {
  nickname: string | null;
  riotGameName?: string | null;
  riotTagLine?: string | null;
}): string {
  if (author.riotGameName && author.riotTagLine) {
    return `${author.riotGameName}#${author.riotTagLine}`;
  }
  return author.nickname ?? "unknown";
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}
