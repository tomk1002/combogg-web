"use client";

import { useState } from "react";
import Image from "next/image";

interface UserData {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  riotGameName: string | null;
  riotTagLine: string | null;
  riotSummonerIconId: number | null;
}

interface Props {
  user: UserData;
}

export default function SettingsContent({ user }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ProfileSection user={user} />
      <div className="h-px bg-border" />
      <RiotSection user={user} />
    </div>
  );
}

// ── Profile Section ───────────────────────────────────────────
function ProfileSection({ user }: { user: UserData }) {
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    if (!nickname.trim() || nickname.trim() === user.nickname) return;
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "저장에 실패했습니다");
      setStatus("error");
    }
  };

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-5">프로필</h2>
      <div className="flex flex-col gap-5">
        {/* Avatar + email (read-only) */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-raised border border-border">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="avatar" width={48} height={48} className="rounded-full" />
          ) : (
            <span className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-xl font-black text-gold">
              {(user.nickname ?? user.email ?? "?")[0]?.toUpperCase()}
            </span>
          )}
          <div>
            <p className="font-bold">{user.nickname ?? "(닉네임 없음)"}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">닉네임</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setStatus("idle"); }}
              minLength={2}
              maxLength={24}
              placeholder="2~24자"
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
            />
            <button
              onClick={handleSave}
              disabled={status === "saving" || !nickname.trim() || nickname.trim() === user.nickname}
              className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {status === "saving" ? "저장 중..." : status === "saved" ? "저장됨 ✓" : "저장"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-hard">{errorMsg}</p>}
          <p className="text-xs text-text-muted">닉네임은 플랫폼 전체에서 고유해야 합니다.</p>
        </div>
      </div>
    </section>
  );
}

// ── Riot Section ──────────────────────────────────────────────
function RiotSection({ user }: { user: UserData }) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [linked, setLinked] = useState<{
    gameName: string;
    tagLine: string;
    summonerIconId: number | null;
  } | null>(
    user.riotGameName
      ? { gameName: user.riotGameName, tagLine: user.riotTagLine ?? "", summonerIconId: user.riotSummonerIconId }
      : null
  );
  const [status, setStatus] = useState<"idle" | "linking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLink = async () => {
    const g = gameName.trim();
    const t = tagLine.trim();
    if (!g || !t) return;
    setStatus("linking");
    setErrorMsg("");

    const res = await fetch("/api/users/me/riot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: g, tagLine: t }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setLinked({ gameName: data.gameName, tagLine: data.tagLine, summonerIconId: data.summonerIconId });
      setGameName("");
      setTagLine("");
      setStatus("idle");
    } else {
      setErrorMsg(data.error ?? "연동에 실패했습니다");
      setStatus("error");
    }
  };

  const handleUnlink = async () => {
    const res = await fetch("/api/users/me/riot", { method: "DELETE" });
    if (res.ok) setLinked(null);
  };

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-1">라이엇 계정</h2>
      <p className="text-xs text-text-muted mb-5">Riot ID를 연동하면 프로필에 인게임 이름이 표시됩니다.</p>

      {linked ? (
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-border">
          <div className="flex items-center gap-3">
            {linked.summonerIconId && (
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/profileicon/${linked.summonerIconId}.png`}
                alt="소환사 아이콘"
                width={40}
                height={40}
                className="rounded-full border border-border"
              />
            )}
            <div>
              <p className="font-bold text-sm">{linked.gameName}<span className="text-text-muted font-mono">#{linked.tagLine}</span></p>
              <p className="text-xs text-easy mt-0.5">연동됨</p>
            </div>
          </div>
          <button
            onClick={handleUnlink}
            className="text-xs text-text-muted hover:text-hard transition-colors font-semibold"
          >
            연동 해제
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-1 rounded-lg border border-border bg-surface-overlay overflow-hidden focus-within:border-[rgba(255,255,255,0.3)] transition-colors">
              <input
                type="text"
                value={gameName}
                onChange={(e) => { setGameName(e.target.value); setStatus("idle"); }}
                placeholder="게임명"
                className="flex-1 h-10 px-3 bg-transparent text-sm focus:outline-none"
              />
              <span className="flex items-center px-2 text-text-muted font-mono text-sm select-none">#</span>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => { setTagLine(e.target.value); setStatus("idle"); }}
                placeholder="KR1"
                className="w-20 h-10 pr-3 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleLink}
              disabled={status === "linking" || !gameName.trim() || !tagLine.trim()}
              className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {status === "linking" ? "확인 중..." : "연동하기"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-hard">{errorMsg}</p>}
          <p className="text-xs text-text-muted">예시: <span className="font-mono">Faker#KR1</span></p>
        </div>
      )}
    </section>
  );
}
