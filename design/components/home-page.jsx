/* global React, COMBOS, LOL_CHAMPS,
   ComboCardStandard, ComboCardCompact, ComboCardHero, ComboCardSpec,
   SiteHeader, ChampChip, DifficultyPips, KeyCap, KeySequence */

const { useState, useMemo, useEffect } = React;

// ─── HERO BANNER ────────────────────────────────────────────────────────
const HeroBanner = ({ navigate, featuredCombo }) => {
  const [hover, setHover] = useState(false);

  return (
    <section
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #1A1D24 0%, #2C313D 60%, #1A1D24 100%)",
        overflow: "hidden",
        borderBottom: "1px solid #0F1115",
      }}
    >
      {/* Background dot grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      {/* Gold glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,134,11,0.18) 0%, transparent 60%)",
          right: -150,
          top: -200,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "56px 32px 64px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        {/* Left — copy */}
        <div style={{ color: "#FFFFFF" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px 5px 8px",
              background: "rgba(184,134,11,0.16)",
              border: "1px solid rgba(184,134,11,0.40)",
              borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: "#E8C679",
              letterSpacing: 1.2,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#E8C679",
                boxShadow: "0 0 8px #E8C679",
                animation: "blinkLive 1.4s infinite",
              }}
            />
            v1.0 BETA · 콤보 공유 플랫폼
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 64,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: -2.4,
              color: "#FFFFFF",
            }}
          >
            완벽한 콤보,<br />
            <span
              style={{
                background: "linear-gradient(135deg, #E8C679 0%, #B8860B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              한 번의 클릭
            </span>으로.
          </h1>

          <p
            style={{
              margin: "20px 0 0",
              fontSize: 17,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 520,
            }}
          >
            전 세계 플레이어가 공유한 콤보를 다운로드하고, 데스크톱 앱에서<br />바로 연습하세요. 직접 만든 콤보도 1분만에 업로드할 수 있습니다.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {[
              { n: "12,847", l: "공유된 콤보" },
              { n: "3,201", l: "활성 플레이어" },
              { n: "48", l: "지원 게임·캐릭터" },
            ].map((s) => (
              <div key={s.l}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: -0.8,
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginTop: 6, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            <button
              onClick={() => navigate("/upload")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 20px",
                borderRadius: 9,
                background: "linear-gradient(135deg, #E8C679 0%, #B8860B 100%)",
                color: "#1A1D24",
                border: 0,
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "inherit",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(184,134,11,0.40), inset 0 1px 0 rgba(255,255,255,0.30)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14V2m0 0L4 6m4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              내 콤보 공유하기
            </button>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 20px",
                borderRadius: 9,
                background: "rgba(255,255,255,0.08)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="4.5" cy="4.5" r="0.5" fill="currentColor"/>
                <circle cx="6.5" cy="4.5" r="0.5" fill="currentColor"/>
              </svg>
              데스크톱 앱 다운로드
            </button>
          </div>
        </div>

        {/* Right — featured combo preview */}
        {featuredCombo && (
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => navigate(`/combo/${featuredCombo.id}`)}
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,198,121,0.15)",
              transform: hover ? "translateY(-4px)" : "translateY(0)",
              transition: "transform 0.3s",
              background: "#0F1115",
            }}
          >
            {/* Top label */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 3,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 999,
                background: "rgba(232,198,121,0.96)",
                color: "#1A1D24",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.8,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 0l1.4 3.2L10 4 7 6.4 8 10 5 8 2 10l1-3.6L0 4l3.6-.8L5 0z"/>
              </svg>
              SPOTLIGHT
            </div>

            {/* Combo "video" thumbnail mockup */}
            <div
              style={{
                position: "relative",
                aspectRatio: "16/10",
                background: `linear-gradient(135deg, ${featuredCombo.bg1}, ${featuredCombo.bg2})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Champ silhouette */}
              <div
                style={{
                  fontSize: 200,
                  fontFamily: "Georgia, serif",
                  fontWeight: 800,
                  color: "rgba(0,0,0,0.30)",
                  lineHeight: 1,
                  fontStyle: "italic",
                  letterSpacing: -8,
                  userSelect: "none",
                }}
              >
                {featuredCombo.champion[0]}
              </div>

              {/* Play button */}
              <div
                style={{
                  position: "absolute",
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.96)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  transform: hover ? "scale(1.1)" : "scale(1)",
                  transition: "transform 0.3s",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="#1A1D24">
                  <path d="M9 6l14 8-14 8z" />
                </svg>
              </div>

              {/* Duration badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.72)",
                  color: "#FFFFFF",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                0:04
              </div>
            </div>

            {/* Bottom info */}
            <div
              style={{
                padding: 20,
                background: "linear-gradient(180deg, #1A1D24 0%, #14171C 100%)",
                color: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 8px 3px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.08)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: featuredCombo.champColor }} />
                  {featuredCombo.champion}
                </span>
                <DifficultyPips level={featuredCombo.difficulty} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
                  ↓ {featuredCombo.downloads.toLocaleString()}
                </span>
              </div>

              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: -0.4 }}>
                {featuredCombo.title}
              </h3>

              {/* Input sequence preview */}
              <div style={{ marginTop: 14 }}>
                <KeySequence keys={(featuredCombo.keys || []).slice(0, 7)} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── CHAMPION QUICK NAV ─────────────────────────────────────────────────
const ChampionRail = ({ champion, setChampion, scrollTo }) => {
  const champs = ["전체", ...Object.keys(LOL_CHAMPS)];

  return (
    <div
      style={{
        position: "sticky",
        top: 69,
        zIndex: 30,
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #EEEEEE",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#9E9E9E",
            letterSpacing: 1.2,
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
            paddingRight: 8,
          }}
        >
          CHAMPION
        </span>
        {champs.map((c) => {
          const active = champion === c;
          const cdata = LOL_CHAMPS[c];
          return (
            <button
              key={c}
              onClick={() => {
                setChampion(c);
                scrollTo?.();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 30,
                padding: c === "전체" ? "0 12px" : "0 12px 0 8px",
                borderRadius: 999,
                background: active ? "#1A1D24" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#424242",
                border: active ? "1px solid #1A1D24" : "1px solid #E0E0E0",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cdata && (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: cdata.color,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
                  }}
                />
              )}
              {c}
            </button>
          );
        })}
        <button
          style={{
            height: 30,
            padding: "0 12px",
            borderRadius: 999,
            background: "transparent",
            color: "#757575",
            border: "1px dashed #BDBDBD",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          +156
        </button>
      </div>
    </div>
  );
};

// ─── SECTION HEADER ─────────────────────────────────────────────────────
const SectionHeader = ({ kicker, title, subtitle, action, accent }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 24 }}>
    <div>
      {kicker && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 800,
            color: accent || "#B8860B",
            letterSpacing: 1.5,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 2,
              background: accent || "#B8860B",
              borderRadius: 1,
            }}
          />
          {kicker}
        </div>
      )}
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#212121", letterSpacing: -0.7 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#757575", maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); action.onClick?.(); }}
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1A1D24",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
          paddingBottom: 6,
        }}
      >
        {action.label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    )}
  </div>
);

// ─── CHAMPION TILE (for "Browse by Champion" section) ──────────────────
const ChampionTile = ({ name, data, count, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        height: 140,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #EEEEEE",
        background: hover
          ? `linear-gradient(135deg, ${data.color}14 0%, ${data.color}08 100%)`
          : "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        fontFamily: "inherit",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.2s, background 0.2s",
        boxShadow: hover ? "0 8px 20px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {/* Big italic letter */}
      <span
        style={{
          position: "absolute",
          right: -10,
          bottom: -30,
          fontSize: 140,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontWeight: 800,
          color: data.color,
          opacity: hover ? 0.18 : 0.10,
          lineHeight: 1,
          letterSpacing: -8,
          pointerEvents: "none",
          transition: "opacity 0.2s",
        }}
      >
        {name[0]}
      </span>

      <div style={{ position: "relative" }}>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: data.color,
            marginBottom: 12,
            boxShadow: `0 0 0 3px ${data.color}26`,
          }}
        />
        <div style={{ fontSize: 17, fontWeight: 800, color: "#212121", letterSpacing: -0.3, marginBottom: 4 }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: "#9E9E9E", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
          {count} combos
        </div>
      </div>
    </button>
  );
};

// ─── DIFFICULTY CARD (for difficulty section) ──────────────────────────
const DifficultyCard = ({ level, label, desc, count, color, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${hover ? color : "#EEEEEE"}`,
        background: "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "border-color 0.2s, transform 0.2s",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover ? `0 8px 20px ${color}24` : "none",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <DifficultyPips level={level} />
        <svg width="18" height="18" viewBox="0 0 18 18" style={{ color: hover ? color : "#BDBDBD", transform: hover ? "translateX(2px)" : "translateX(0)", transition: "all 0.2s" }}>
          <path d="M5 5l5 4-5 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 5l5 4-5 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#212121", letterSpacing: -0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#757575", marginTop: 4, lineHeight: 1.5 }}>
        {desc}
      </div>
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px dashed #EEEEEE",
          fontSize: 11,
          color: "#9E9E9E",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        <strong style={{ color: "#212121", fontSize: 13 }}>{count}</strong> 콤보
      </div>
    </button>
  );
};

// ─── GRID HELPER ────────────────────────────────────────────────────────
const ComboGrid = ({ combos, cardVariant, onCardClick }) => {
  const Variant =
    cardVariant === "B" ? ComboCardCompact :
    cardVariant === "C" ? ComboCardHero :
    cardVariant === "D" ? ComboCardSpec :
    ComboCardStandard;
  const minCol =
    cardVariant === "B" ? 480 :
    cardVariant === "C" ? 380 :
    cardVariant === "D" ? 340 :
    300;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`, gap: 20 }}>
      {combos.map((c) => (
        <Variant key={c.id} data={c} onClick={onCardClick} />
      ))}
    </div>
  );
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────
const HomePage = ({ navigate, currentPath, user, cardVariant = "A" }) => {
  const [champion, setChampion] = useState("전체");

  const trending = useMemo(() => {
    const list = champion === "전체" ? COMBOS : COMBOS.filter((c) => c.champion === champion);
    return [...list].sort((a, b) => b.likes + b.downloads / 5 - (a.likes + a.downloads / 5)).slice(0, 4);
  }, [champion]);

  const newest = useMemo(() => {
    const list = champion === "전체" ? COMBOS : COMBOS.filter((c) => c.champion === champion);
    return [...list].reverse().slice(0, 4);
  }, [champion]);

  const featuredCombo = useMemo(() => {
    const top = [...COMBOS].sort((a, b) => b.downloads - a.downloads)[0];
    return {
      ...top,
      bg1: "#3D2817",
      bg2: "#1A0E04",
      champColor: LOL_CHAMPS[top.champion]?.color || "#B8860B",
    };
  }, []);

  const onCardClick = (combo) => navigate(`/combo/${combo.id}`);

  // For "browse by champion" section
  const championCounts = useMemo(() => {
    return Object.entries(LOL_CHAMPS).map(([name, data]) => ({
      name,
      data,
      count: COMBOS.filter((c) => c.champion === name).length,
    })).sort((a, b) => b.count - a.count);
  }, []);

  // Difficulty breakdown
  const diffCounts = useMemo(() => {
    return [1, 2, 3].map((lvl) => ({
      level: lvl,
      count: COMBOS.filter((c) => c.difficulty === lvl).length,
    }));
  }, []);

  const scrollToTrending = () => {
    document.getElementById("trending-section")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", fontFamily: "var(--font-family-base)" }}>
      <SiteHeader navigate={navigate} currentPath={currentPath} user={user} />

      {/* HERO */}
      <HeroBanner navigate={navigate} featuredCombo={featuredCombo} />

      {/* CHAMPION RAIL (sticky filter) */}
      <ChampionRail champion={champion} setChampion={setChampion} />

      {/* TRENDING SECTION */}
      <section id="trending-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 0" }}>
        <SectionHeader
          kicker="🔥 TRENDING NOW"
          accent="#E04E2C"
          title={champion === "전체" ? "이번 주 가장 많이 다운로드된 콤보" : `${champion} — 트렌딩`}
          subtitle="플레이어들이 지금 연습하고 있는 콤보들."
          action={{ label: "전체 보기" }}
        />
        <ComboGrid combos={trending} cardVariant={cardVariant} onCardClick={onCardClick} />
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 32px" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, #E0E0E0 50%, transparent 100%)" }} />
      </div>

      {/* BROWSE BY CHAMPION */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 0" }}>
        <SectionHeader
          kicker="◆ BROWSE BY CHAMPION"
          accent="#1976D2"
          title="챔피언별 콤보"
          subtitle="플레이하는 챔피언을 선택하면 가장 인기 있는 콤보부터 보여드립니다."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {championCounts.slice(0, 6).map((c) => (
            <ChampionTile
              key={c.name}
              name={c.name}
              data={c.data}
              count={c.count}
              onClick={() => { setChampion(c.name); scrollToTrending(); }}
            />
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 32px" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, #E0E0E0 50%, transparent 100%)" }} />
      </div>

      {/* DIFFICULTY SECTION */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 0" }}>
        <SectionHeader
          kicker="◈ BY SKILL LEVEL"
          accent="#43A047"
          title="실력에 맞는 콤보 찾기"
          subtitle="처음 배우는 사람부터 프로 지망생까지, 단계별로 분류된 콤보."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <DifficultyCard
            level={1}
            label="입문 · Beginner"
            desc="기본 스킬 콤보. 오늘 배우면 오늘 사용할 수 있습니다."
            count={diffCounts.find((d) => d.level === 1)?.count || 0}
            color="#43A047"
            onClick={scrollToTrending}
          />
          <DifficultyCard
            level={2}
            label="중급 · Intermediate"
            desc="플래시·아이템 연계 등 정확한 타이밍이 필요합니다."
            count={diffCounts.find((d) => d.level === 2)?.count || 0}
            color="#FB8C00"
            onClick={scrollToTrending}
          />
          <DifficultyCard
            level={3}
            label="고급 · Advanced"
            desc="프레임 단위 입력. 충분한 연습이 필요합니다."
            count={diffCounts.find((d) => d.level === 3)?.count || 0}
            color="#E04E2C"
            onClick={scrollToTrending}
          />
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 32px" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, #E0E0E0 50%, transparent 100%)" }} />
      </div>

      {/* NEWEST */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 0" }}>
        <SectionHeader
          kicker="✦ FRESHLY UPLOADED"
          accent="#5E35B1"
          title="새로 올라온 콤보"
          subtitle="가장 최근에 공유된 콤보들을 가장 먼저 만나보세요."
          action={{ label: "전체 보기" }}
        />
        <ComboGrid combos={newest} cardVariant={cardVariant} onCardClick={onCardClick} />
      </section>

      {/* CTA STRIP */}
      <section style={{ maxWidth: 1280, margin: "72px auto 0", padding: "0 32px 80px" }}>
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #1A1D24 0%, #2C313D 100%)",
            borderRadius: 16,
            padding: "48px 56px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 40,
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(232,198,121,0.08) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", color: "#FFFFFF" }}>
            <div
              style={{
                display: "inline-block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 800,
                color: "#E8C679",
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              ─── SHARE YOUR COMBO
            </div>
            <h3 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15 }}>
              당신만의 콤보가 있나요?<br />지금 바로 공유해보세요.
            </h3>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: "rgba(255,255,255,0.66)", maxWidth: 540 }}>
              데스크톱 앱에서 녹화한 .combo 파일을 업로드하면 끝.
              제목, 설명, 난이도만 입력하면 1분 안에 게시됩니다.
            </p>
          </div>
          <button
            onClick={() => navigate("/upload")}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 52,
              padding: "0 24px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #E8C679 0%, #B8860B 100%)",
              color: "#1A1D24",
              border: 0,
              fontSize: 15,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(184,134,11,0.40), inset 0 1px 0 rgba(255,255,255,0.30)",
              flexShrink: 0,
            }}
          >
            업로드 시작하기
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
};

window.HomePage = HomePage;
