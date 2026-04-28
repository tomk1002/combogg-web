/* global React, KeySequence */
// Combo Card — 4 variants
// All variants share data shape:
//   { id, title, author, authorAvatar, champion, championColor, difficulty,
//     thumbnail, gif, likes, downloads, views, keys[], duration, tags[] }

const { useState } = React;

// Difficulty pip indicator (3 dots)
const DifficultyPips = ({ level, dark = false }) => {
  // level: 1=easy, 2=med, 3=hard
  const colors = {
    1: "#4CAF50",
    2: "#FFA726",
    3: "#F44336",
  };
  const labels = { 1: "쉬움", 2: "보통", 3: "어려움" };
  const c = colors[level];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: i <= level ? c : dark ? "rgba(255,255,255,0.16)" : "#E0E0E0",
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.75)" : "#616161",
          letterSpacing: 0.2,
        }}
      >
        {labels[level]}
      </span>
    </span>
  );
};

// Champion / character chip with color dot
const ChampChip = ({ name, color = "#2196F3", dark = false }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px 3px 6px",
      borderRadius: 999,
      background: dark ? "rgba(255,255,255,0.08)" : "#F5F5F5",
      fontSize: 11,
      fontWeight: 600,
      color: dark ? "rgba(255,255,255,0.9)" : "#424242",
      lineHeight: 1.2,
    }}
  >
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: color,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}
    />
    {name}
  </span>
);

// Avatar (initial or color)
const Avatar = ({ name, color, size = 24 }) => {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color || "#9E9E9E",
        color: "#FFFFFF",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
};

// Inline icons (small SVG to avoid file deps for missing ones)
const HeartIcon = ({ filled, size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 13.5s-5-3.2-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 13 6.5c0 3.8-5 7-5 7Z"
      fill={filled ? color || "#C2185B" : "none"}
      stroke={filled ? color || "#C2185B" : "currentColor"}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);
const DownloadIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ShareIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="m6 7 4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const PlayIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M5 3.5v11l9-5.5-9-5.5Z" fill="currentColor" />
  </svg>
);
const ViewIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const FileIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M3 1.5h4l2 2v7h-6v-9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M7 1.5v2h2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const formatNum = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

// Animated thumbnail simulating gameplay GIF on hover
const Thumbnail = ({ data, hovered, dark = false, aspect = "16/9" }) => {
  // Procedurally render a stylized "MOBA arena" preview using gradients + animated dots.
  // The author's champion color tints the scene.
  const c = data.championColor || "#475569";
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: aspect,
        width: "100%",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 60%, ${c}26 0%, #1B2028 55%, #10131A 100%)`,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      {/* "lane" diagonal terrain */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 320 180"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={`lane-${data.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a4a30" />
            <stop offset="1" stopColor="#1a2418" />
          </linearGradient>
        </defs>
        <path d="M0,140 L120,60 L320,40 L320,180 L0,180 Z" fill={`url(#lane-${data.id})`} opacity="0.55" />
        <path d="M0,150 L130,70 L320,50" stroke="#3d5a2c" strokeWidth="1" fill="none" opacity="0.4" />
        {/* grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <line key={i} x1="0" y1={180 * y + 30} x2="320" y2={180 * y + 30} stroke="#fff" strokeOpacity="0.04" />
        ))}
      </svg>

      {/* Champion (player) */}
      <div
        style={{
          position: "absolute",
          left: hovered ? "62%" : "30%",
          top: "55%",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: c,
          boxShadow: `0 0 16px 4px ${c}88, inset 0 0 0 2px rgba(255,255,255,0.4)`,
          transition: "left 1.6s cubic-bezier(.6,.05,.3,1)",
          transform: "translate(-50%, -50%)",
          zIndex: 3,
        }}
      />
      {/* Enemy */}
      <div
        style={{
          position: "absolute",
          left: "72%",
          top: "48%",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#8B1A1A",
          boxShadow: "0 0 8px 2px rgba(139,26,26,0.5), inset 0 0 0 2px rgba(255,255,255,0.25)",
          opacity: hovered ? 0.3 : 0.85,
          transform: hovered ? "translate(-50%,-50%) scale(0.6)" : "translate(-50%,-50%) scale(1)",
          transition: "all 0.4s 1.2s ease",
        }}
      />
      {/* Spell flash */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: "72%",
            top: "48%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c}cc 0%, transparent 70%)`,
            transform: "translate(-50%,-50%)",
            animation: "comboFlash 0.6s 0.9s ease-out forwards",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Hit indicators (no damage numbers — those vary by build) */}
      {hovered && (
        <>
          <div
            style={{
              position: "absolute",
              left: "72%",
              top: "48%",
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.85)",
              transform: "translate(-50%,-50%)",
              animation: "hitRing 0.5s 1s ease-out forwards",
              opacity: 0,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "72%",
              top: "48%",
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.65)",
              transform: "translate(-50%,-50%)",
              animation: "hitRing 0.5s 1.5s ease-out forwards",
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Top-left badges (champion, difficulty) overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          zIndex: 5,
        }}
      >
        <ChampChip name={data.champion} color={c} dark />
        <DifficultyPips level={data.difficulty} dark />
      </div>

      {/* Duration pill bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          padding: "3px 7px",
          background: "rgba(0,0,0,0.7)",
          color: "#FFFFFF",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          borderRadius: 4,
          letterSpacing: 0.5,
          zIndex: 5,
        }}
      >
        {data.duration}
      </div>

      {/* Play indicator */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          opacity: hovered ? 0 : 0.85,
          transition: "opacity 0.2s",
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 3,
            border: "1.5px solid rgba(255,255,255,0.7)",
          }}
        >
          <PlayIcon size={18} />
        </div>
      </div>

      {/* "PREVIEW" caption when hovered — neutral, not red */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 7px",
            background: "rgba(255,255,255,0.95)",
            color: "#1A1D24",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1,
            borderRadius: 3,
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: "#1A1D24",
              animation: "blinkLive 1s infinite",
            }}
          />
          PREVIEW
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// VARIANT A — Standard (KPP default)
// Clean white card, thumbnail top, info below, key sequence at the bottom.
// ─────────────────────────────────────────────────────────────────────────
const ComboCardStandard = ({ data, onLike, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(data.liked || false);
  const [likes, setLikes] = useState(data.likes);

  const handleLike = (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    onLike?.(next);
  };

  return (
    <article
      onClick={() => onClick?.(data)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 320,
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow: hovered
          ? "0 8px 24px 0 rgba(0,0,0,0.12), 0 0 0 1px #E0E0E0"
          : "0 1px 3px 0 rgba(0,0,0,0.06), 0 0 0 1px #EEEEEE",
        cursor: "pointer",
        transition: "box-shadow 0.18s, transform 0.18s",
        transform: hovered ? "translateY(-2px)" : "none",
        overflow: "hidden",
        fontFamily: "var(--font-family-base)",
      }}
    >
      <Thumbnail data={data} hovered={hovered} />

      <div style={{ padding: 16 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#212121",
            lineHeight: 1.35,
            letterSpacing: -0.1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {data.title}
        </h3>

        {/* Key sequence */}
        <div style={{ marginTop: 12 }}>
          <KeySequence keys={data.keys} size="sm" />
        </div>

        {/* Requirements row */}
        {data.requirements && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 12,
              paddingTop: 10,
              paddingBottom: 12,
              borderTop: "1px dashed #EEEEEE",
              borderBottom: "1px solid #F5F5F5",
              marginBottom: 12,
              fontSize: 10.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#757575",
              fontWeight: 600,
              flexWrap: "wrap",
            }}
          >
            <span><span style={{ color: "#9E9E9E" }}>LV</span> {data.requirements.level}</span>
            <span style={{ width: 1, height: 10, background: "#E0E0E0" }} />
            <span><span style={{ color: "#9E9E9E" }}>스킬가속</span> {data.requirements.skillHaste}</span>
          </div>
        )}

        {/* Author + stats row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Avatar name={data.author} color={data.authorColor} size={22} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#424242" }}>{data.author}</span>
          </button>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              fontWeight: 600,
              color: "#757575",
            }}
          >
            <button
              onClick={handleLike}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                color: liked ? "#C2185B" : "#757575",
              }}
            >
              <HeartIcon filled={liked} size={14} />
              {formatNum(likes)}
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <DownloadIcon size={14} />
              {formatNum(data.downloads)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// VARIANT B — Compact (horizontal, list-style)
// Thumbnail left, content right. Denser, fits more per row.
// ─────────────────────────────────────────────────────────────────────────
const ComboCardCompact = ({ data, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(data.liked || false);

  return (
    <article
      onClick={() => onClick?.(data)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 480,
        display: "flex",
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow: hovered
          ? "0 4px 12px 0 rgba(0,0,0,0.10), 0 0 0 1px #E0E0E0"
          : "0 0 0 1px #EEEEEE",
        cursor: "pointer",
        transition: "box-shadow 0.18s",
        overflow: "hidden",
        fontFamily: "var(--font-family-base)",
      }}
    >
      <div style={{ width: 192, flexShrink: 0, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 8, overflow: "hidden" }}>
          <Thumbnail data={data} hovered={hovered} aspect="auto" />
        </div>
      </div>

      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ChampChip name={data.champion} color={data.championColor} />
          <DifficultyPips level={data.difficulty} />
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#212121",
            lineHeight: 1.35,
            letterSpacing: -0.1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {data.title}
        </h3>

        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <KeySequence keys={data.keys.slice(0, 5)} size="sm" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Avatar name={data.author} color={data.authorColor} size={20} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#616161" }}>{data.author}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, color: "#757575", fontWeight: 600 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: liked ? "#C2185B" : "inherit" }}>
              <HeartIcon filled={liked} size={13} />
              {formatNum(data.likes)}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <DownloadIcon size={13} />
              {formatNum(data.downloads)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// VARIANT C — Hero (big, featured)
// Bigger thumbnail, overlay info on top, prominent CTAs.
// ─────────────────────────────────────────────────────────────────────────
const ComboCardHero = ({ data, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(data.liked || false);

  return (
    <article
      onClick={() => onClick?.(data)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 380,
        background: "#10131A",
        borderRadius: 10,
        boxShadow: hovered
          ? `0 16px 40px 0 rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.10)`
          : "0 4px 12px 0 rgba(0,0,0,0.20), 0 0 0 1px #1F242E",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        overflow: "hidden",
        fontFamily: "var(--font-family-base)",
        position: "relative",
      }}
    >
      <div style={{ position: "relative" }}>
        <Thumbnail data={data} hovered={hovered} aspect="4/3" />
        {/* gradient bottom overlay */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "55%",
            background: "linear-gradient(to top, rgba(16,19,26,1) 10%, rgba(16,19,26,0.6) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Title overlay */}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, zIndex: 6 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.25,
              letterSpacing: -0.3,
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            {data.title}
          </h3>
          <div style={{ marginTop: 8 }}>
            <KeySequence keys={data.keys} size="sm" />
          </div>
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Avatar name={data.author} color={data.authorColor} size={26} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>{data.author}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{data.timeAgo}</div>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: liked ? "rgba(194,24,91,0.18)" : "rgba(255,255,255,0.06)",
              border: liked ? "1px solid rgba(194,24,91,0.45)" : "1px solid rgba(255,255,255,0.10)",
              color: liked ? "#E57AA0" : "rgba(255,255,255,0.7)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <HeartIcon filled={liked} color="#E57AA0" size={14} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px",
              height: 30,
              borderRadius: 6,
              background: "#FFFFFF",
              border: 0,
              color: "#1A1D24",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.6), 0 1px 2px 0 rgba(0,0,0,0.20)`,
            }}
          >
            <DownloadIcon size={13} />
            {formatNum(data.downloads)}
          </button>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// VARIANT D — Spec / Data-rich
// Tutfile-tag accent, more metadata visible, monospace stat tray
// ─────────────────────────────────────────────────────────────────────────
const ComboCardSpec = ({ data, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(data.liked || false);

  return (
    <article
      onClick={() => onClick?.(data)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 340,
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow: hovered
          ? "0 8px 20px 0 rgba(0,0,0,0.10), 0 0 0 1px #BDBDBD"
          : "0 0 0 1px #E0E0E0",
        cursor: "pointer",
        transition: "all 0.18s",
        overflow: "hidden",
        fontFamily: "var(--font-family-base)",
      }}
    >
      {/* Top accent bar — muted champion tint */}
      <div style={{ height: 3, background: data.championColor, opacity: 0.85 }} />

      <div style={{ position: "relative" }}>
        <Thumbnail data={data} hovered={hovered} aspect="16/9" />
      </div>

      <div style={{ padding: 14 }}>
        {/* Filename / id row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingBottom: 10,
            borderBottom: "1px dashed #E0E0E0",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: "#616161",
            }}
          >
            <FileIcon />
            {data.filename}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "#9E9E9E",
              letterSpacing: 0.5,
            }}
          >
            #{data.id.padStart(4, "0")}
          </span>
        </div>

        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 15,
            fontWeight: 700,
            color: "#212121",
            lineHeight: 1.3,
            letterSpacing: -0.1,
          }}
        >
          {data.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <ChampChip name={data.champion} color={data.championColor} />
          <DifficultyPips level={data.difficulty} />
        </div>

        {/* Key sequence */}
        <div
          style={{
            background: "#FAFAFA",
            border: "1px solid #EEEEEE",
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9E9E9E",
              letterSpacing: 1,
              marginBottom: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            INPUT SEQUENCE
          </div>
          <KeySequence keys={data.keys} size="sm" />
        </div>

        {/* Requirements */}
        {data.requirements && (
          <div
            style={{
              background: "#FAFAFA",
              border: "1px solid #EEEEEE",
              borderRadius: 6,
              padding: "8px 12px",
              marginBottom: 12,
              fontSize: 10.5,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              color: "#424242",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "4px 10px",
            }}
          >
            <span style={{ color: "#9E9E9E" }}>LEVEL</span>
            <span>{data.requirements.level}</span>
            <span style={{ color: "#9E9E9E" }}>HASTE</span>
            <span>{data.requirements.skillHaste}</span>
            <span style={{ color: "#9E9E9E" }}>ITEMS</span>
            <span style={{ color: "#212121" }}>{(data.requirements.items || []).join(" · ") || "—"}</span>
          </div>
        )}

        {/* Stat tray */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            background: "#EEEEEE",
            border: "1px solid #EEEEEE",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {[
            { l: "LIKES", v: formatNum(data.likes) },
            { l: "VIEWS", v: formatNum(data.views) },
            { l: "DOWNLOADS", v: formatNum(data.downloads) },
          ].map((s, i) => (
            <div key={i} style={{ background: "#FFFFFF", padding: "8px 10px", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#9E9E9E",
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#212121",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2,
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Avatar name={data.author} color={data.authorColor} size={22} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#424242" }}>{data.author}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: liked ? "#FCE4EC" : "#FAFAFA",
                border: liked ? "1px solid #F8BBD0" : "1px solid #EEEEEE",
                color: liked ? "#C2185B" : "#757575",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <HeartIcon filled={liked} size={13} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#FAFAFA",
                border: "1px solid #EEEEEE",
                color: "#757575",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <ShareIcon size={13} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                background: "#1A1D24",
                border: 0,
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <DownloadIcon size={12} />
              .tut
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

Object.assign(window, {
  ComboCardStandard,
  ComboCardCompact,
  ComboCardHero,
  ComboCardSpec,
  Avatar,
  ChampChip,
  DifficultyPips,
  HeartIcon,
  DownloadIcon,
  ShareIcon,
  PlayIcon,
  ViewIcon,
  formatNum,
  Thumbnail,
});
