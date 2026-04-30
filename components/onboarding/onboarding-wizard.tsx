"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSummonerSpellIconUrl } from "@/lib/games/lol/ddragon";

interface Props {
  currentNickname: string | null;
  currentEmail: string | null;
}

type RiotLinked = {
  gameName: string;
  tagLine: string;
  summonerIconId: number | null;
  tier: string | null;
  rank: string | null;
};

export default function OnboardingWizard({ currentNickname, currentEmail }: Props) {
  const { update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ── Step 1: Nickname ─────────────────────────────────────────
  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [nickCheck, setNickCheck] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickError, setNickError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const trimmed = nickname.trim();
    if (trimmed === currentNickname) { setNickCheck("ok"); return; }
    if (trimmed.length < 2) { setNickCheck("idle"); return; }
    if (trimmed.length > 24) { setNickCheck("invalid"); return; }

    setNickCheck("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/users/check-nickname?nickname=${encodeURIComponent(trimmed)}`);
      const { available } = await res.json().catch(() => ({ available: false }));
      setNickCheck(available ? "ok" : "taken");
    }, 400);
  }, [nickname, currentNickname]);

  const handleNicknameNext = async () => {
    const trimmed = nickname.trim();
    setNickSaving(true);
    setNickError("");
    if (trimmed !== currentNickname) {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNickError((data as { error?: string }).error ?? "저장에 실패했습니다");
        setNickSaving(false);
        return;
      }
    }
    setNickSaving(false);
    setStep(2);
  };

  // ── Step 2: Riot linking ──────────────────────────────────────
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [riotStatus, setRiotStatus] = useState<"idle" | "linking" | "error">("idle");
  const [riotError, setRiotError] = useState("");
  const [linkedRiot, setLinkedRiot] = useState<RiotLinked | null>(null);

  const handleRiotLink = async () => {
    const g = gameName.trim(); const t = tagLine.trim();
    if (!g || !t) return;
    setRiotStatus("linking"); setRiotError("");
    const res = await fetch("/api/users/me/riot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: g, tagLine: t }),
    });
    const data = await res.json().catch(() => ({})) as RiotLinked & { error?: string };
    if (res.ok) {
      setLinkedRiot({ gameName: data.gameName, tagLine: data.tagLine, summonerIconId: data.summonerIconId ?? null, tier: data.tier ?? null, rank: data.rank ?? null });
      setRiotStatus("idle");
    } else {
      setRiotError(data.error ?? "연동에 실패했습니다");
      setRiotStatus("error");
    }
  };

  // ── Completion ────────────────────────────────────────────────
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await fetch("/api/users/me/onboarding", { method: "POST" });
    await update();
    router.push("/");
  };

  const canProceedStep1 = nickname.trim().length >= 2 && nickname.trim().length <= 24 && (nickCheck === "ok");

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="w-9 h-9 rounded-[10px] bg-surface-raised flex items-center justify-center text-[12px] font-black font-mono shadow-[0_2px_4px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.10)]">
            ⌥▷
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            combo<span className="text-gold">.gg</span>
          </span>
        </Link>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 justify-center mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-gold" : s < step ? "w-4 bg-gold/50" : "w-4 bg-surface-overlay"
            }`}
          />
        ))}
        <span className="text-[11px] text-text-muted ml-2">{step} / 2</span>
      </div>

      {/* Card */}
      <div className="bg-surface-raised border border-border rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.24)]">
        {step === 1 && (
          <Step1
            nickname={nickname}
            setNickname={setNickname}
            nickCheck={nickCheck}
            nickError={nickError}
            saving={nickSaving}
            canProceed={canProceedStep1}
            onNext={handleNicknameNext}
          />
        )}
        {step === 2 && (
          <Step2
            gameName={gameName}
            setGameName={setGameName}
            tagLine={tagLine}
            setTagLine={setTagLine}
            riotStatus={riotStatus}
            riotError={riotError}
            linkedRiot={linkedRiot}
            onLink={handleRiotLink}
            onBack={() => setStep(1)}
            onComplete={handleComplete}
            completing={completing}
          />
        )}
      </div>
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────

interface Step1Props {
  nickname: string;
  setNickname: (v: string) => void;
  nickCheck: "idle" | "checking" | "ok" | "taken" | "invalid";
  nickError: string;
  saving: boolean;
  canProceed: boolean;
  onNext: () => void;
}

function Step1({ nickname, setNickname, nickCheck, nickError, saving, canProceed, onNext }: Step1Props) {
  const checkMessage = {
    idle: null,
    checking: <span className="text-text-muted">확인 중...</span>,
    ok: <span className="text-easy">✓ 사용 가능한 닉네임입니다</span>,
    taken: <span className="text-hard">이미 사용 중인 닉네임입니다</span>,
    invalid: <span className="text-hard">2~24자로 입력해 주세요</span>,
  }[nickCheck];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-black tracking-tight mb-1">닉네임을 설정하세요</h1>
        <p className="text-sm text-text-secondary">플랫폼에서 사용할 이름입니다. 나중에 변경할 수 있습니다.</p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canProceed && onNext()}
          placeholder="닉네임 입력"
          maxLength={24}
          autoFocus
          className="w-full h-12 px-4 rounded-xl border border-border bg-surface-overlay text-base focus:outline-none focus:border-gold/60 transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs">{checkMessage}</p>
          {nickError && <p className="text-xs text-hard">{nickError}</p>}
          <span className="text-[11px] text-text-muted ml-auto">{nickname.length}/24</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed || saving}
        className="w-full h-12 rounded-xl bg-gold text-white font-bold text-sm hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "저장 중..." : "계속하기 →"}
      </button>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────

interface Step2Props {
  gameName: string;
  setGameName: (v: string) => void;
  tagLine: string;
  setTagLine: (v: string) => void;
  riotStatus: "idle" | "linking" | "error";
  riotError: string;
  linkedRiot: RiotLinked | null;
  onLink: () => void;
  onBack: () => void;
  onComplete: () => void;
  completing: boolean;
}

const PATCH = "15.1.1";

const TIER_LABEL: Record<string, string> = {
  IRON: "아이언", BRONZE: "브론즈", SILVER: "실버", GOLD: "골드",
  PLATINUM: "플래티넘", EMERALD: "에메랄드", DIAMOND: "다이아",
  MASTER: "마스터", GRANDMASTER: "그랜드마스터", CHALLENGER: "챌린저",
};

function Step2({ gameName, setGameName, tagLine, setTagLine, riotStatus, riotError, linkedRiot, onLink, onBack, onComplete, completing }: Step2Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-black tracking-tight mb-1">라이엇 계정 연동</h1>
        <p className="text-sm text-text-secondary">
          연동하면 프로필에 티어·주요 챔피언이 표시됩니다. 선택 사항이며 나중에 설정에서도 할 수 있습니다.
        </p>
      </div>

      {linkedRiot ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-overlay border border-border">
          {linkedRiot.summonerIconId && (
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${PATCH}/img/profileicon/${linkedRiot.summonerIconId}.png`}
              alt="소환사 아이콘" width={44} height={44} className="rounded-full border border-border shrink-0"
            />
          )}
          <div>
            <p className="font-bold text-sm">
              {linkedRiot.gameName}<span className="text-text-muted font-mono">#{linkedRiot.tagLine}</span>
            </p>
            {linkedRiot.tier && (
              <p className="text-xs text-text-muted mt-0.5">
                {TIER_LABEL[linkedRiot.tier] ?? linkedRiot.tier}{linkedRiot.rank ? ` ${linkedRiot.rank}` : ""}
              </p>
            )}
          </div>
          <span className="ml-auto text-xs font-semibold text-easy">연동됨 ✓</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-1 rounded-xl border border-border bg-surface-overlay overflow-hidden focus-within:border-gold/40 transition-colors">
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="게임명"
                className="flex-1 h-12 px-4 bg-transparent text-sm focus:outline-none"
              />
              <span className="flex items-center px-2 text-text-muted font-mono text-sm select-none">#</span>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLink()}
                placeholder="KR1"
                className="w-20 h-12 pr-3 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onLink}
              disabled={riotStatus === "linking" || !gameName.trim() || !tagLine.trim()}
              className="h-12 px-4 rounded-xl bg-gold text-white text-sm font-bold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {riotStatus === "linking" ? "확인 중..." : "연동"}
            </button>
          </div>
          {riotError && <p className="text-xs text-hard">{riotError}</p>}
          <p className="text-xs text-text-muted">예시: <span className="font-mono">Faker#KR1</span></p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-4 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={completing}
          className="flex-1 h-11 rounded-xl bg-gold text-white font-bold text-sm hover:bg-gold-light disabled:opacity-40 transition-colors"
        >
          {completing ? "완료 중..." : linkedRiot ? "시작하기 →" : "나중에 →"}
        </button>
      </div>
    </div>
  );
}
