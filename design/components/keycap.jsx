/* global React */
// Keycap component — 3D physical keyboard key feel
// Used everywhere combo input sequences are shown

const KeyCap = ({ label, size = "md", state = "default", variant = "default" }) => {
  // sizes: sm (24), md (32), lg (44), xl (56)
  const sizes = {
    sm: { w: 26, h: 26, fs: 11, r: 5 },
    md: { w: 36, h: 36, fs: 13, r: 6 },
    lg: { w: 48, h: 48, fs: 16, r: 7 },
    xl: { w: 64, h: 64, fs: 22, r: 9 },
  };
  const s = sizes[size] || sizes.md;

  // LoL-focused palette:
  //  - default: 일반 키 / 평타 (A)
  //  - spell:   스킬 (Q W E) — 다크 슬레이트
  //  - ult:     궁극기 (R) — 뮤트 ochre
  //  - summoner: 소환사 주문 (D F) — 차분한 청록 (영창=하늘 느낌)
  //  - dark:    수정자 키 (Shift, Ctrl 등)
  const variants = {
    default: {
      top: "linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 100%)",
      side: "linear-gradient(180deg, #C8C8C8 0%, #A8A8A8 100%)",
      shadow: "rgba(0,0,0,0.14)",
      text: "#2A2A2A",
      ringTop: "rgba(255,255,255,0.9)",
    },
    spell: {
      top: "linear-gradient(180deg, #3A3F4B 0%, #252932 100%)",
      side: "linear-gradient(180deg, #1A1D24 0%, #0A0C10 100%)",
      shadow: "rgba(0,0,0,0.30)",
      text: "#F5F5F5",
      ringTop: "rgba(255,255,255,0.14)",
    },
    ult: {
      top: "linear-gradient(180deg, #B8860B 0%, #8B6508 100%)",
      side: "linear-gradient(180deg, #6B4F06 0%, #3E2D03 100%)",
      shadow: "rgba(139,101,8,0.30)",
      text: "#FFF8E1",
      ringTop: "rgba(255,255,255,0.30)",
    },
    summoner: {
      // D / F — 점멸, 회복, 점화 등. 영창 = 청록 톤
      top: "linear-gradient(180deg, #2A6378 0%, #1A4858 100%)",
      side: "linear-gradient(180deg, #0F2D38 0%, #051820 100%)",
      shadow: "rgba(26,72,88,0.30)",
      text: "#E0F2F1",
      ringTop: "rgba(255,255,255,0.18)",
    },
    dark: {
      top: "linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)",
      side: "linear-gradient(180deg, #0F0F0F 0%, #000000 100%)",
      shadow: "rgba(0,0,0,0.4)",
      text: "#F0F0F0",
      ringTop: "rgba(255,255,255,0.16)",
    },
  };
  const v = variants[variant] || variants.default;

  const depth = Math.max(2, Math.round(s.h * 0.12));
  const pressed = state === "pressed";

  return (
    <div
      style={{
        width: s.w,
        height: s.h + depth,
        position: "relative",
        display: "inline-block",
        userSelect: "none",
      }}
    >
      {/* side / depth */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: depth,
          width: s.w,
          height: s.h,
          borderRadius: s.r,
          background: v.side,
          boxShadow: `0 ${depth + 1}px ${depth * 2}px ${v.shadow}`,
        }}
      />
      {/* top cap */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: pressed ? depth - 1 : 0,
          width: s.w,
          height: s.h,
          borderRadius: s.r,
          background: v.top,
          color: v.text,
          fontFamily: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
          fontSize: s.fs,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: label?.length > 1 ? 0 : 0.3,
          boxShadow: `inset 0 1px 0 0 ${v.ringTop}, inset 0 -1px 0 0 rgba(0,0,0,0.08)`,
          transition: "top 80ms ease",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Connector arrow between keycaps
const KeyArrow = ({ size = "md", dim = false }) => {
  const sz = size === "sm" ? 10 : size === "lg" ? 16 : 12;
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 12 12"
      style={{
        flexShrink: 0,
        opacity: dim ? 0.4 : 0.7,
      }}
    >
      <path
        d="M3 2 L7 6 L3 10"
        stroke="#9E9E9E"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// A full combo sequence: KeyCap → KeyCap → ...
// keys: array of { label, variant?, state?, item? }
//   item: { name, color, icon? } — renders as item slot instead of key
const KeySequence = ({ keys, size = "md", showArrows = true, align = "start" }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: size === "sm" ? 4 : 6,
        flexWrap: "wrap",
      }}
    >
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {k.item ? (
            <ItemSlot item={k.item} slot={k.label} size={size} />
          ) : (
            <KeyCap label={k.label} size={size} variant={k.variant} state={k.state} />
          )}
          {showArrows && i < keys.length - 1 && <KeyArrow size={size} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Item slot — used for active item activations (slots 1-6)
// Visually distinct from keys: square with item color fill + slot number badge
const ItemSlot = ({ item, slot, size = "md" }) => {
  const sizes = {
    sm: { w: 26, h: 26, fs: 12, badge: 9 },
    md: { w: 36, h: 36, fs: 14, badge: 10 },
    lg: { w: 48, h: 48, fs: 18, badge: 12 },
    xl: { w: 64, h: 64, fs: 24, badge: 14 },
  };
  const s = sizes[size] || sizes.md;
  const depth = Math.max(2, Math.round(s.h * 0.10));
  return (
    <div
      style={{
        width: s.w,
        height: s.h + depth,
        position: "relative",
        display: "inline-block",
        userSelect: "none",
      }}
      title={item.name}
    >
      {/* depth side */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: depth,
          width: s.w,
          height: s.h,
          borderRadius: 4,
          background: "#1A1D24",
          boxShadow: `0 ${depth + 1}px ${depth * 2}px rgba(0,0,0,0.18)`,
        }}
      />
      {/* item face */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: s.w,
          height: s.h,
          borderRadius: 4,
          background: item.color || "#5A4A2A",
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.20) 100%)`,
          color: "#FFFFFF",
          fontSize: s.fs,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.30)`,
          overflow: "hidden",
        }}
      >
        {/* placeholder item icon — abstract glyph */}
        <span style={{ fontSize: s.fs * 1.1, lineHeight: 1, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}>
          {item.icon || "◆"}
        </span>
      </div>
      {/* slot number badge */}
      <div
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          width: s.badge + 4,
          height: s.badge + 4,
          borderRadius: "50%",
          background: "#1A1D24",
          color: "#FFD54F",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: s.badge,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.10)",
          zIndex: 2,
        }}
      >
        {slot}
      </div>
    </div>
  );
};

Object.assign(window, { KeyCap, KeyArrow, KeySequence, ItemSlot });
