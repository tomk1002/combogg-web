"use client";

import { useState, useRef } from "react";
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 로컬 preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);

    try {
      // 1. presigned URL 발급
      const presignRes = await fetch("/api/uploads/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "avatars", filename: file.name }),
      });
      if (!presignRes.ok) throw new Error("presigned URL 발급 실패");
      const { uploadUrl, path } = await presignRes.json() as { uploadUrl: string; path: string };

      // 2. Supabase Storage에 직접 업로드
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("파일 업로드 실패");

      // 3. public URL 조립
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;

      // 4. 서버에 avatarUrl 저장
      const patchRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      if (!patchRes.ok) throw new Error("프로필 업데이트 실패");

      setAvatarUploading(false);
    } catch {
      setAvatarPreview(null);
      setAvatarUploading(false);
    }

    // input 초기화 (동일 파일 재선택 허용)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentAvatar = avatarPreview ?? user.avatarUrl;

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-5">프로필</h2>
      <div className="flex flex-col gap-5">
        {/* Avatar + email */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-raised border border-border">
          <label className="cursor-pointer relative group shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border group-hover:border-gold/50 transition-colors">
              {currentAvatar ? (
                <Image src={currentAvatar} alt="avatar" width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <span className="w-full h-full bg-gold/20 flex items-center justify-center text-2xl font-black text-gold">
                  {(user.nickname ?? user.email ?? "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {/* hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {avatarUploading ? (
                <svg className="animate-spin text-white" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
          <div>
            <p className="font-bold">{user.nickname ?? "(닉네임 없음)"}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
            <p className="text-[11px] text-text-muted mt-0.5">클릭하여 아바타 변경</p>
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
