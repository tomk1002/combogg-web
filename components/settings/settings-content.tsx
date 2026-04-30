"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

interface MasteryEntry {
  championId: number;
  championName: string;
  championIconUrl: string | null;
  points: number;
  level: number;
}

interface UserData {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  oauthProvider: string | null;
  createdAt: Date;
  riotGameName: string | null;
  riotTagLine: string | null;
  riotSummonerIconId: number | null;
  riotTier: string | null;
  riotRank: string | null;
  riotLP: number | null;
  riotTopMasteries: unknown;
}

const TIER_STYLE: Record<string, string> = {
  IRON: "text-[#a0a0a0] border-[#a0a0a0]/40 bg-[#a0a0a0]/10",
  BRONZE: "text-[#b87333] border-[#b87333]/40 bg-[#b87333]/10",
  SILVER: "text-[#c0c0c0] border-[#c0c0c0]/40 bg-[#c0c0c0]/10",
  GOLD: "text-gold border-gold/40 bg-gold/10",
  PLATINUM: "text-[#00b4b4] border-[#00b4b4]/40 bg-[#00b4b4]/10",
  EMERALD: "text-[#50c878] border-[#50c878]/40 bg-[#50c878]/10",
  DIAMOND: "text-[#6495ed] border-[#6495ed]/40 bg-[#6495ed]/10",
  MASTER: "text-[#9b59b6] border-[#9b59b6]/40 bg-[#9b59b6]/10",
  GRANDMASTER: "text-[#e74c3c] border-[#e74c3c]/40 bg-[#e74c3c]/10",
  CHALLENGER: "text-[#f1c40f] border-[#f1c40f]/40 bg-[#f1c40f]/10",
};

interface Props {
  user: UserData;
}

export default function SettingsContent({ user }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ProfileSection user={user} />
      <div className="h-px bg-border" />
      <RiotSection user={user} />
      <div className="h-px bg-border" />
      <AccountSection user={user} />
      <div className="h-px bg-border" />
      <DangerSection user={user} />
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

  const initLinked = user.riotGameName ? {
    gameName: user.riotGameName,
    tagLine: user.riotTagLine ?? "",
    summonerIconId: user.riotSummonerIconId,
    tier: user.riotTier,
    rank: user.riotRank,
    lp: user.riotLP,
    topMasteries: (user.riotTopMasteries as MasteryEntry[] | null) ?? [],
  } : null;

  const [linked, setLinked] = useState(initLinked);
  const [status, setStatus] = useState<"idle" | "linking" | "refreshing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLink = async () => {
    const g = gameName.trim(); const t = tagLine.trim();
    if (!g || !t) return;
    setStatus("linking"); setErrorMsg("");
    const res = await fetch("/api/users/me/riot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: g, tagLine: t }),
    });
    const data = await res.json().catch(() => ({})) as typeof linked & { error?: string };
    if (res.ok) {
      setLinked({ gameName: data!.gameName, tagLine: data!.tagLine, summonerIconId: data!.summonerIconId ?? null, tier: data!.tier ?? null, rank: data!.rank ?? null, lp: data!.lp ?? null, topMasteries: data!.topMasteries ?? [] });
      setGameName(""); setTagLine(""); setStatus("idle");
    } else {
      setErrorMsg((data as { error?: string }).error ?? "연동에 실패했습니다"); setStatus("error");
    }
  };

  const handleRefresh = async () => {
    setStatus("refreshing");
    const res = await fetch("/api/users/me/riot", { method: "PUT" });
    const data = await res.json().catch(() => ({})) as typeof linked & { error?: string };
    if (res.ok) {
      setLinked(prev => prev ? { ...prev, summonerIconId: data!.summonerIconId ?? prev.summonerIconId, tier: data!.tier ?? null, rank: data!.rank ?? null, lp: data!.lp ?? null, topMasteries: data!.topMasteries ?? [] } : prev);
    }
    setStatus("idle");
  };

  const handleUnlink = async () => {
    const res = await fetch("/api/users/me/riot", { method: "DELETE" });
    if (res.ok) setLinked(null);
  };

  const tierStyle = linked?.tier ? (TIER_STYLE[linked.tier] ?? TIER_STYLE.GOLD) : "";

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-1">라이엇 계정</h2>
      <p className="text-xs text-text-muted mb-5">Riot ID를 연동하면 프로필에 소환사 정보가 표시됩니다.</p>

      {linked ? (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-raised border border-border">
          {/* 헤더 행 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {linked.summonerIconId && (
                <Image src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/profileicon/${linked.summonerIconId}.png`}
                  alt="소환사 아이콘" width={40} height={40} className="rounded-full border border-border" />
              )}
              <div>
                <p className="font-bold text-sm">{linked.gameName}<span className="text-text-muted font-mono">#{linked.tagLine}</span></p>
                <p className="text-xs text-easy mt-0.5">연동됨</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRefresh} disabled={status === "refreshing"}
                className="text-xs text-text-secondary hover:text-text border border-border rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40">
                {status === "refreshing" ? "새로고침 중..." : "↻ 새로고침"}
              </button>
              <button onClick={handleUnlink} className="text-xs text-text-muted hover:text-hard transition-colors font-semibold px-1">
                연동 해제
              </button>
            </div>
          </div>

          {/* 티어 */}
          {linked.tier && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${tierStyle}`}>
                {linked.tier} {linked.rank}
              </span>
              {linked.lp !== null && (
                <span className="text-xs text-text-muted font-mono">{linked.lp} LP</span>
              )}
            </div>
          )}

          {/* 챔피언 숙련도 */}
          {linked.topMasteries.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted mb-2 font-semibold uppercase tracking-wide">주요 챔피언</p>
              <div className="flex gap-2">
                {linked.topMasteries.map((m) => (
                  <div key={m.championId} className="flex flex-col items-center gap-1">
                    {m.championIconUrl ? (
                      <Image src={m.championIconUrl} alt={m.championName} width={44} height={44} className="rounded-lg border border-border" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-surface-overlay border border-border flex items-center justify-center text-xs text-text-muted">
                        {m.championName[0]}
                      </div>
                    )}
                    <span className="text-[10px] text-text-secondary font-semibold">{m.championName}</span>
                    <span className="text-[10px] font-mono text-text-muted">Lv.{m.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-1 rounded-lg border border-border bg-surface-overlay overflow-hidden focus-within:border-[rgba(255,255,255,0.3)] transition-colors">
              <input type="text" value={gameName} onChange={(e) => { setGameName(e.target.value); setStatus("idle"); }}
                placeholder="게임명" className="flex-1 h-10 px-3 bg-transparent text-sm focus:outline-none" />
              <span className="flex items-center px-2 text-text-muted font-mono text-sm select-none">#</span>
              <input type="text" value={tagLine} onChange={(e) => { setTagLine(e.target.value); setStatus("idle"); }}
                placeholder="KR1" className="w-20 h-10 pr-3 bg-transparent text-sm focus:outline-none" />
            </div>
            <button onClick={handleLink} disabled={status === "linking" || !gameName.trim() || !tagLine.trim()}
              className="h-10 px-4 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
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

// ── Account Section ───────────────────────────────────────────
function AccountSection({ user }: { user: UserData }) {
  const providerLabel = user.oauthProvider === "google" ? "Google"
    : user.oauthProvider === "discord" ? "Discord"
    : user.oauthProvider ?? "알 수 없음";

  const providerIcon = user.oauthProvider === "google" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ) : user.oauthProvider === "discord" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  ) : null;

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-1">연결된 계정</h2>
      <p className="text-xs text-text-muted mb-5">로그인에 사용 중인 소셜 계정입니다.</p>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-raised border border-border">
        <div className="w-9 h-9 rounded-full bg-surface-overlay border border-border flex items-center justify-center shrink-0">
          {providerIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{providerLabel}</p>
          {user.email && <p className="text-xs text-text-muted truncate">{user.email}</p>}
        </div>
        <span className="text-[10px] font-semibold text-easy border border-easy/30 bg-easy/10 px-2 py-0.5 rounded-full">
          연결됨
        </span>
      </div>

      <p className="text-xs text-text-muted mt-3">
        가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
      </p>
    </section>
  );
}

// ── Danger Section ────────────────────────────────────────────
function DangerSection({ user }: { user: UserData }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirm === (user.nickname ?? "");

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "삭제에 실패했습니다");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
      setDeleting(false);
    }
  };

  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest text-hard mb-1">위험 구역</h2>
      <p className="text-xs text-text-muted mb-5">이 구역의 작업은 되돌릴 수 없습니다.</p>

      <div className="rounded-xl border border-hard/30 bg-hard/5 p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-text">계정 삭제</p>
          <p className="text-xs text-text-muted mt-0.5">
            계정을 삭제하면 업로드한 모든 콤보, 댓글, 저장 목록이 영구 삭제됩니다.
          </p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="self-start h-9 px-4 rounded-lg border border-hard/40 text-hard text-sm font-semibold hover:bg-hard/10 transition-colors cursor-pointer"
          >
            계정 삭제
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-secondary">
              확인을 위해 닉네임 <span className="font-mono font-bold text-text">{user.nickname}</span>을 입력하세요.
            </p>
            <input
              type="text"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              placeholder={user.nickname ?? ""}
              className="h-10 px-3 rounded-lg border border-hard/40 bg-surface-overlay text-sm focus:outline-none focus:border-hard/70 transition-colors"
            />
            {error && <p className="text-xs text-hard">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setConfirm(""); setError(""); }}
                className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="h-9 px-4 rounded-lg bg-hard text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                {deleting ? "삭제 중..." : "영구 삭제"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
