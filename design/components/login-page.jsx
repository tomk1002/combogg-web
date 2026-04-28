/* global React */

const { useState } = React;

const LoginPage = ({ navigate, onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const userHandle = mode === "signup" ? handle : email.split("@")[0] || "Player";
    onLogin?.({ handle: userHandle, color: "#5E35B1" });
    navigate("/");
  };

  const oauthLogin = (provider) => {
    onLogin?.({ handle: provider === "google" ? "GoogleUser" : "DiscordUser", color: provider === "google" ? "#1565C0" : "#5E35B1" });
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAFA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "var(--font-family-base)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <a
          href="#/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 9,
              background: "#1A1D24",
              color: "#FFFFFF",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: 12,
              boxShadow: "0 2px 4px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            ⌥▷
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#212121", letterSpacing: -0.4 }}>
            combo<span style={{ color: "#B8860B", fontWeight: 800 }}>.gg</span>
          </span>
        </a>

        <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 12, padding: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#212121", letterSpacing: -0.4 }}>
            {mode === "login" ? "다시 만나서 반가워요" : "combo.gg 시작하기"}
          </h1>
          <p style={{ margin: "6px 0 24px", fontSize: 13, color: "#757575" }}>
            {mode === "login" ? "계정에 로그인하고 콤보를 공유하세요" : "지금 가입하고 첫 콤보를 게시해보세요"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => oauthLogin("google")}
              style={oauthBtn}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, background: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#1565C0", border: "1px solid #E0E0E0" }}>G</span>
              Google로 계속
            </button>
            <button
              onClick={() => oauthLogin("discord")}
              style={{ ...oauthBtn, background: "#5865F2", color: "#FFFFFF", border: "1px solid #5865F2" }}
            >
              <span style={{ fontSize: 14, fontWeight: 800 }}>◇</span>
              Discord로 계속
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <span style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
            <span style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 600 }}>또는 이메일로</span>
            <span style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <Field label="닉네임">
                <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ChampionMaster" required style={inp} />
              </Field>
            )}
            <Field label="이메일">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={inp} />
            </Field>
            <Field label="비밀번호">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" required minLength={8} style={inp} />
            </Field>

            <button
              type="submit"
              style={{
                height: 42,
                marginTop: 6,
                borderRadius: 7,
                background: "#1A1D24",
                color: "#FFFFFF",
                border: 0,
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "inherit",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              {mode === "login" ? "로그인" : "계정 만들기"}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE", textAlign: "center", fontSize: 12, color: "#757575" }}>
            {mode === "login" ? "처음이신가요? " : "이미 계정이 있나요? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ background: "transparent", border: 0, padding: 0, color: "#1A1D24", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
            >
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: "#9E9E9E", textAlign: "center", lineHeight: 1.6 }}>
          계속하면 <a href="#" style={{ color: "#616161" }}>이용약관</a>과 <a href="#" style={{ color: "#616161" }}>개인정보 처리방침</a>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};

const inp = {
  width: "100%",
  boxSizing: "border-box",
  height: 40,
  padding: "0 12px",
  borderRadius: 7,
  border: "1px solid #E0E0E0",
  background: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
};
const oauthBtn = {
  height: 42,
  borderRadius: 7,
  background: "#FFFFFF",
  color: "#212121",
  border: "1px solid #E0E0E0",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

const Field = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#212121", marginBottom: 6 }}>{label}</span>
    {children}
  </label>
);

window.LoginPage = LoginPage;
