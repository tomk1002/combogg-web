/* global React, COMBOS, LOL_CHAMPS, SiteHeader,
   ComboCardStandard, Avatar, formatNum */

const { useState } = React;

const ProfilePage = ({ handle, navigate, currentPath, user }) => {
  const [tab, setTab] = useState("combos");
  const userCombos = COMBOS.filter((c) => c.author === handle);
  const fallback = userCombos.length ? userCombos[0] : COMBOS[0];
  const profile = {
    handle: handle,
    color: fallback.authorColor,
    bio: `${fallback.champion} 메인 · ${userCombos.length}개의 콤보 게시`,
    joined: "2024년 11월 가입",
    totalLikes: userCombos.reduce((s, c) => s + c.likes, 0),
    totalDl: userCombos.reduce((s, c) => s + c.downloads, 0),
    totalViews: userCombos.reduce((s, c) => s + c.views, 0),
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", fontFamily: "var(--font-family-base)" }}>
      <SiteHeader navigate={navigate} currentPath={currentPath} user={user} />

      {/* Profile header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #EEEEEE" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            <Avatar name={profile.handle} color={profile.color} size={96} />
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#212121", letterSpacing: -0.5 }}>
                {profile.handle}
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#616161" }}>{profile.bio}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9E9E9E" }}>{profile.joined}</p>
            </div>
            <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
              <button
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 7,
                  background: "#1A1D24",
                  color: "#FFFFFF",
                  border: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                팔로우
              </button>
              <button
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 7,
                  background: "#FFFFFF",
                  color: "#212121",
                  border: "1px solid #E0E0E0",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                공유
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 0, marginTop: 28, borderTop: "1px solid #EEEEEE" }}>
            {[
              { l: "콤보", v: userCombos.length },
              { l: "좋아요", v: formatNum(profile.totalLikes) },
              { l: "다운로드", v: formatNum(profile.totalDl) },
              { l: "조회수", v: formatNum(profile.totalViews) },
            ].map((s, i) => (
              <div key={i} style={{ padding: "16px 24px 16px 0", borderRight: i < 3 ? "1px solid transparent" : "none", marginRight: 24 }}>
                <div style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 700, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#212121", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            {[
              { v: "combos", l: `콤보 ${userCombos.length}` },
              { v: "liked", l: "좋아요" },
              { v: "about", l: "소개" },
            ].map((t) => {
              const active = tab === t.v;
              return (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  style={{
                    padding: "12px 0",
                    background: "transparent",
                    border: 0,
                    borderBottom: active ? "2px solid #1A1D24" : "2px solid transparent",
                    color: active ? "#212121" : "#757575",
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {t.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        {tab === "combos" && (
          userCombos.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px dashed #E0E0E0", borderRadius: 10, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#212121", marginBottom: 6 }}>아직 게시한 콤보가 없습니다</div>
              <div style={{ fontSize: 12, color: "#757575", marginBottom: 16 }}>첫 콤보를 업로드해보세요.</div>
              <button
                onClick={() => navigate("/upload")}
                style={{ height: 36, padding: "0 16px", borderRadius: 7, background: "#1A1D24", color: "#FFFFFF", border: 0, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                업로드하기
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {userCombos.map((c) => (
                <ComboCardStandard key={c.id} data={c} onClick={() => navigate(`/combo/${c.id}`)} />
              ))}
            </div>
          )
        )}
        {tab === "liked" && (
          <div style={{ background: "#FFFFFF", border: "1px dashed #E0E0E0", borderRadius: 10, padding: 48, textAlign: "center", color: "#9E9E9E", fontSize: 13 }}>
            좋아요한 콤보는 비공개입니다.
          </div>
        )}
        {tab === "about" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 10, padding: 24, maxWidth: 640 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#212121" }}>소개</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#424242" }}>
              {profile.bio}. 콤보 연구 및 가이드 제작에 관심이 많으며, 주로 {fallback.champion}을(를) 플레이합니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

window.ProfilePage = ProfilePage;
