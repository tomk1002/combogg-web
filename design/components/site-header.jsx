/* global React */
// Site-wide header — used on all pages.
// Receives a `navigate(path)` function to handle link clicks.

const SiteHeader = ({ navigate, currentPath, user, search, setSearch, transparent }) => {
  const [q, setQ] = React.useState(search || "");
  const isHome = currentPath === "/" || currentPath === "/home";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: transparent ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #EEEEEE",
        fontFamily: "var(--font-family-base)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#1A1D24",
              color: "#FFFFFF",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: -0.3,
              boxShadow: "0 2px 4px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            ⌥▷
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#212121", letterSpacing: -0.4 }}>
            combo<span style={{ color: "#B8860B", fontWeight: 800 }}>.gg</span>
          </span>
        </a>

        <div style={{ flex: 1, maxWidth: 540, position: "relative" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9E9E9E",
            }}
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSearch?.(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/");
            }}
            placeholder="콤보, 챔피언, 작성자 검색..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 40,
              padding: "0 14px 0 38px",
              borderRadius: 8,
              border: "1px solid #E0E0E0",
              background: "#FAFAFA",
              fontFamily: "inherit",
              fontSize: 14,
              color: "#212121",
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1A1D24";
              e.target.style.background = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E0E0E0";
              e.target.style.background = "#FAFAFA";
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 6px",
              borderRadius: 4,
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: "#9E9E9E",
            }}
          >
            ⌘K
          </span>
        </div>

        <nav style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {[
            { l: "League of Legends", k: "lol" },
            { l: "Tekken", k: "tekken" },
            { l: "Valorant", k: "val" },
          ].map((g) => {
            const active = isHome && g.k === "lol";
            return (
              <a
                key={g.k}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? "#1A1D24" : "#616161",
                  textDecoration: "none",
                  background: active ? "#F0F0F0" : "transparent",
                }}
              >
                {g.l}
              </a>
            );
          })}
        </nav>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("/upload")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 7,
              background: "#1A1D24",
              color: "#FFFFFF",
              border: 0,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 14V2m0 0L4 6m4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            업로드
          </button>
          {user ? (
            <button
              onClick={() => navigate(`/u/${user.handle}`)}
              style={{
                height: 36,
                padding: "0 6px 0 6px",
                borderRadius: 999,
                background: "#FFFFFF",
                color: "#212121",
                border: "1px solid #E0E0E0",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: user.color || "#5E35B1",
                  color: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {user.handle[0].toUpperCase()}
              </span>
              <span style={{ paddingRight: 8 }}>{user.handle}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 7,
                background: "transparent",
                color: "#212121",
                border: "1px solid #E0E0E0",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

window.SiteHeader = SiteHeader;
