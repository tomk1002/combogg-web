/* global React, COMBOS, ITEMS, LOL_CHAMPS,
   SiteHeader, KeyCap, KeySequence, ItemSlot,
   ComboCardStandard, Avatar, ChampChip, DifficultyPips,
   HeartIcon, DownloadIcon, ShareIcon, PlayIcon, formatNum, Thumbnail */

const { useState, useEffect } = React;

// Big preview window — animated combo demo
const ComboPreview = ({ data }) => {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= data.keys.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [playing, data.keys.length]);

  const replay = () => {
    setStep(-1);
    setTimeout(() => {
      setStep(0);
      setPlaying(true);
    }, 100);
  };

  const c = data.championColor;

  return (
    <div
      style={{
        background: "#10131A",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #1F242E",
        position: "relative",
      }}
    >
      {/* Arena scene */}
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          background: `radial-gradient(ellipse at 50% 60%, ${c}30 0%, #1B2028 55%, #10131A 100%)`,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`d-lane-${data.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a4a30" />
              <stop offset="1" stopColor="#1a2418" />
            </linearGradient>
          </defs>
          <path d="M0,140 L120,60 L320,40 L320,180 L0,180 Z" fill={`url(#d-lane-${data.id})`} opacity="0.55" />
          <path d="M0,150 L130,70 L320,50" stroke="#3d5a2c" strokeWidth="1" fill="none" opacity="0.4" />
          {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
            <line key={i} x1="0" y1={180 * y + 30} x2="320" y2={180 * y + 30} stroke="#fff" strokeOpacity="0.04" />
          ))}
        </svg>

        {/* champion */}
        <div
          style={{
            position: "absolute",
            left: playing && step > 0 ? "62%" : "30%",
            top: "55%",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: c,
            boxShadow: `0 0 24px 6px ${c}AA, inset 0 0 0 3px rgba(255,255,255,0.4)`,
            transition: "left 1.6s cubic-bezier(.6,.05,.3,1)",
            transform: "translate(-50%,-50%)",
            zIndex: 3,
          }}
        />
        {/* enemy */}
        <div
          style={{
            position: "absolute",
            left: "72%",
            top: "48%",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#8B1A1A",
            boxShadow: "0 0 12px 3px rgba(139,26,26,0.5), inset 0 0 0 3px rgba(255,255,255,0.25)",
            opacity: playing && step >= data.keys.length - 1 ? 0.2 : 0.85,
            transform: "translate(-50%,-50%)",
            transition: "opacity 0.4s",
            zIndex: 2,
          }}
        />
        {/* effect ring on each step */}
        {playing && step > 0 && (
          <div
            key={step}
            style={{
              position: "absolute",
              left: "72%",
              top: "48%",
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: `2px solid ${c}`,
              transform: "translate(-50%,-50%)",
              animation: "hitRing 0.5s ease-out forwards",
              opacity: 0,
              pointerEvents: "none",
              zIndex: 4,
            }}
          />
        )}

        {/* Champion overlay top-left */}
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 8, zIndex: 6 }}>
          <ChampChip name={data.champion} color={c} dark />
          <DifficultyPips level={data.difficulty} dark />
        </div>

        {/* Duration pill */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "5px 10px",
            background: "rgba(0,0,0,0.7)",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 6,
            letterSpacing: 0.5,
            zIndex: 6,
          }}
        >
          {data.duration}
        </div>

        {/* Center play */}
        {!playing && (
          <button
            onClick={replay}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              border: "1.5px solid rgba(255,255,255,0.7)",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 4,
              zIndex: 10,
            }}
          >
            <PlayIcon size={26} />
          </button>
        )}
      </div>

      {/* Step strip — current key highlighted */}
      <div
        style={{
          padding: "14px 20px 16px",
          background: "#0B0E14",
          display: "flex",
          alignItems: "center",
          gap: 14,
          borderTop: "1px solid #1F242E",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 800,
            color: "#9E9E9E",
            letterSpacing: 1.5,
            flexShrink: 0,
          }}
        >
          INPUT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {data.keys.map((k, i) => {
            const active = playing && i === step;
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    transform: active ? "scale(1.18)" : "scale(1)",
                    filter: active ? "brightness(1.3)" : "brightness(1)",
                    transition: "transform 0.15s, filter 0.15s",
                  }}
                >
                  {k.item ? (
                    <ItemSlot item={k.item} slot={k.label} size="md" />
                  ) : (
                    <KeyCap label={k.label} size="md" variant={k.variant} state={active ? "pressed" : undefined} />
                  )}
                </div>
                {i < data.keys.length - 1 && (
                  <span style={{ color: "#5A6270", fontSize: 14 }}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={replay}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            height: 28,
            padding: "0 12px",
            borderRadius: 6,
            background: "transparent",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.20)",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ↻ 다시 재생
        </button>
      </div>
    </div>
  );
};

// Comments (mock)
const MOCK_COMMENTS = [
  { id: "c1", author: "MidLanerKR", color: "#1565C0", text: "스킬가속 25 못 맞추면 마지막 Q 안 들어감. 룬에서 신비한 유성 + 마나순환 띠 추천.", time: "2시간 전", likes: 24 },
  { id: "c2", author: "ChallengerMain", color: "#B8860B", text: "9렙 기준이라고 적혀있는데 실전에선 11렙부터 안정적임. 6렙 R 활용하려면 Hexflash 필수.", time: "5시간 전", likes: 18 },
  { id: "c3", author: "BronzeUntilDeath", color: "#5E35B1", text: "따라하기 어려워요... 캔슬 타이밍 영상 좀 더 자세히 부탁드려요 🙏", time: "1일 전", likes: 7 },
];

const Comments = ({ combo }) => {
  const [text, setText] = useState("");
  return (
    <section>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#212121", margin: "0 0 16px" }}>
        댓글 <span style={{ color: "#9E9E9E", fontWeight: 600 }}>{MOCK_COMMENTS.length}</span>
      </h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Avatar name="You" color="#5E35B1" size={36} />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="이 콤보에 대해 의견을 남겨주세요..."
            style={{
              width: "100%",
              minHeight: 60,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #E0E0E0",
              background: "#FAFAFA",
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              disabled={!text.trim()}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 7,
                background: text.trim() ? "#1A1D24" : "#E0E0E0",
                color: text.trim() ? "#FFFFFF" : "#9E9E9E",
                border: 0,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: text.trim() ? "pointer" : "not-allowed",
              }}
            >
              댓글 작성
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MOCK_COMMENTS.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 12 }}>
            <Avatar name={c.author} color={c.color} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#212121" }}>{c.author}</span>
                <span style={{ fontSize: 11, color: "#9E9E9E" }}>{c.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#424242" }}>{c.text}</p>
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                <button style={{ background: "transparent", border: 0, padding: 0, fontSize: 11, fontWeight: 600, color: "#757575", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                  <HeartIcon size={11} /> {c.likes}
                </button>
                <button style={{ background: "transparent", border: 0, padding: 0, fontSize: 11, fontWeight: 600, color: "#757575", cursor: "pointer", fontFamily: "inherit" }}>
                  답글
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── DETAIL PAGE ────────────────────────────────────────────────────────
const ComboDetailPage = ({ combo, navigate, currentPath, user }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(combo.likes);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
  };

  const similar = COMBOS.filter((c) => c.id !== combo.id && c.champion === combo.champion).slice(0, 3);
  const allSimilar = similar.length >= 3 ? similar : [...similar, ...COMBOS.filter((c) => c.id !== combo.id && !similar.includes(c)).slice(0, 3 - similar.length)];

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", fontFamily: "var(--font-family-base)" }}>
      <SiteHeader navigate={navigate} currentPath={currentPath} user={user} />

      {/* Breadcrumb */}
      <div style={{ borderBottom: "1px solid #EEEEEE", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 32px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#757575" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }} style={{ color: "#757575", textDecoration: "none", fontWeight: 600 }}>홈</a>
          <span>/</span>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#757575", textDecoration: "none", fontWeight: 600 }}>League of Legends</a>
          <span>/</span>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#757575", textDecoration: "none", fontWeight: 600 }}>{combo.champion}</a>
          <span>/</span>
          <span style={{ color: "#212121", fontWeight: 700 }}>{combo.title}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        {/* LEFT — main */}
        <div>
          {/* Title + meta */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ChampChip name={combo.champion} color={combo.championColor} />
              <DifficultyPips level={combo.difficulty} />
              {combo.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#616161", padding: "3px 8px", background: "#F5F5F5", borderRadius: 4 }}>
                  #{t}
                </span>
              ))}
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#212121", letterSpacing: -0.5, lineHeight: 1.2 }}>
              {combo.title}
            </h1>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#757575" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/u/${combo.author}`); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#212121", textDecoration: "none", fontWeight: 700 }}>
                <Avatar name={combo.author} color={combo.authorColor} size={22} />
                {combo.author}
              </a>
              <span>·</span>
              <span>{combo.timeAgo}</span>
              <span>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                조회 {formatNum(combo.views)}
              </span>
            </div>
          </div>

          <ComboPreview data={combo} />

          {/* Author note */}
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#212121", margin: "0 0 12px" }}>작성자 노트</h2>
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 10, padding: 20 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#424242" }}>
                {combo.note || `${combo.champion}의 핵심 콤보입니다. ${combo.tags.includes("한타") ? "한타 진입 시" : combo.tags.includes("암살") ? "암살 진입 시" : combo.tags.includes("라인전") ? "라인전 견제용으로" : "교전 시"} 사용하며, 마지막 스킬까지 끊김 없이 연계되는 것이 핵심입니다.`}
              </p>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.7, color: "#424242" }}>
                {combo.requirements?.skillHaste !== "—"
                  ? `스킬가속 ${combo.requirements.skillHaste}이 안 맞으면 마지막 입력이 들어가지 않을 수 있습니다.`
                  : "기본 스킬가속으로도 안정적으로 들어갑니다."}
                {combo.requirements?.items?.length ? ` 권장 아이템: ${combo.requirements.items.join(", ")}.` : ""}
              </p>
            </div>
          </section>

          {/* Requirements & Build */}
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#212121", margin: "0 0 12px" }}>제약 사항 & 권장 빌드</h2>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #EEEEEE",
                borderRadius: 10,
                padding: 20,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 0,
              }}
            >
              <SpecCell label="레벨" value={combo.requirements?.level || "—"} />
              <SpecCell label="스킬가속" value={combo.requirements?.skillHaste || "—"} divider />
              <SpecCell label="공격속도" value="—" divider />
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderTop: 0, borderRadius: "0 0 10px 10px", padding: 20, marginTop: -10 }}>
              <div style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 700, letterSpacing: 1, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                권장 아이템
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(combo.requirements?.items || []).map((it) => (
                  <span key={it} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F5F5F5", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#424242" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: combo.championColor }} />
                    {it}
                  </span>
                ))}
                {!combo.requirements?.items?.length && (
                  <span style={{ fontSize: 12, color: "#9E9E9E" }}>특별한 아이템 요구사항 없음</span>
                )}
              </div>
            </div>
          </section>

          {/* Comments */}
          <section style={{ marginTop: 32 }}>
            <Comments combo={combo} />
          </section>
        </div>

        {/* RIGHT — sticky sidebar */}
        <aside>
          <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Action card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 10, padding: 20 }}>
              <button
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 8,
                  background: "#1A1D24",
                  color: "#FFFFFF",
                  border: 0,
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                <DownloadIcon size={16} />
                .tut 파일 다운로드
              </button>
              <div style={{ marginTop: 8, fontSize: 11, color: "#9E9E9E", fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }}>
                {combo.filename} · {formatNum(combo.downloads)} 다운로드
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  onClick={toggleLike}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 7,
                    background: liked ? "#FCE4EC" : "#FFFFFF",
                    color: liked ? "#C2185B" : "#424242",
                    border: liked ? "1px solid #F8BBD0" : "1px solid #E0E0E0",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <HeartIcon filled={liked} size={13} />
                  {formatNum(likes)}
                </button>
                <button
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 7,
                    background: "#FFFFFF",
                    color: "#424242",
                    border: "1px solid #E0E0E0",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ShareIcon size={13} />
                  공유
                </button>
              </div>
            </div>

            {/* Author card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar name={combo.author} color={combo.authorColor} size={48} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#212121" }}>{combo.author}</div>
                  <div style={{ fontSize: 11, color: "#757575", marginTop: 2 }}>
                    {COMBOS.filter((c) => c.author === combo.author).length}개 콤보 · {LOL_CHAMPS[combo.champion]?.color ? "주력 " + combo.champion : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/u/${combo.author}`)}
                style={{
                  width: "100%",
                  height: 34,
                  borderRadius: 7,
                  background: "#FFFFFF",
                  color: "#212121",
                  border: "1px solid #E0E0E0",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                프로필 보기
              </button>
            </div>

            {/* Similar combos */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#212121", margin: "0 0 14px", letterSpacing: -0.1 }}>
                비슷한 콤보
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allSimilar.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/combo/${s.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 0,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ width: 56, height: 40, borderRadius: 4, background: s.championColor, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(0,0,0,0.30))" }} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#212121", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: "#757575", marginTop: 3 }}>
                        {s.author} · ♥ {formatNum(s.likes)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

const SpecCell = ({ label, value, divider }) => (
  <div style={{ padding: "0 14px", borderLeft: divider ? "1px solid #EEEEEE" : "none" }}>
    <div style={{ fontSize: 10, color: "#9E9E9E", fontWeight: 700, letterSpacing: 1, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: "#212121", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
  </div>
);

window.ComboDetailPage = ComboDetailPage;
