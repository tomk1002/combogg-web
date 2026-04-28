/* global React, LOL_CHAMPS, SiteHeader, KeyCap, KeySequence, ItemSlot, ITEMS */

const { useState, useRef } = React;

const Step = ({ n, label, active, done }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: done ? "#1A1D24" : active ? "#1A1D24" : "#FFFFFF",
        color: done || active ? "#FFFFFF" : "#9E9E9E",
        border: done || active ? "1px solid #1A1D24" : "1px solid #E0E0E0",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        fontFamily: "'JetBrains Mono', monospace",
        flexShrink: 0,
      }}
    >
      {done ? "✓" : n}
    </span>
    <span style={{ fontSize: 13, fontWeight: active || done ? 700 : 600, color: active || done ? "#212121" : "#9E9E9E" }}>
      {label}
    </span>
  </div>
);

const Stepper = ({ step }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <Step n={1} label="파일 업로드" active={step === 1} done={step > 1} />
    <span style={{ flex: 1, height: 1, background: step > 1 ? "#1A1D24" : "#E0E0E0", maxWidth: 80 }} />
    <Step n={2} label="정보 입력" active={step === 2} done={step > 2} />
    <span style={{ flex: 1, height: 1, background: step > 2 ? "#1A1D24" : "#E0E0E0", maxWidth: 80 }} />
    <Step n={3} label="게시" active={step === 3} done={step > 3} />
  </div>
);

const UploadPage = ({ navigate, currentPath, user }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [info, setInfo] = useState({
    title: "",
    champion: "Ahri",
    difficulty: 2,
    tags: [],
    note: "",
    level: "11+",
    skillHaste: "20+",
    items: "",
  });

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile({ name: f.name, size: f.size });
      setTimeout(() => setStep(2), 600);
    }
  };

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile({ name: f.name, size: f.size });
      setTimeout(() => setStep(2), 400);
    }
  };

  const TAGS = ["풀콤보", "한타", "라인전", "포크", "암살", "갱킹", "캔슬", "엔트리", "아이템 활용"];

  const toggleTag = (t) => {
    setInfo((s) => ({ ...s, tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] }));
  };

  const canPublish = info.title.trim() && info.champion && info.difficulty;

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", fontFamily: "var(--font-family-base)" }}>
      <SiteHeader navigate={navigate} currentPath={currentPath} user={user} />

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 800,
              color: "#9E9E9E",
              letterSpacing: 1.5,
              marginBottom: 4,
            }}
          >
            UPLOAD
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#212121", letterSpacing: -0.5 }}>
            새 콤보 게시
          </h1>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 28 }}>
            <Stepper step={step} />
          </div>

          {step === 1 && (
            <section>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  display: "block",
                  border: dragOver ? "2px dashed #1A1D24" : "2px dashed #E0E0E0",
                  background: dragOver ? "#F5F5F5" : "#FAFAFA",
                  borderRadius: 12,
                  padding: "60px 32px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input ref={fileInputRef} type="file" accept=".tut,.tutfile" onChange={pickFile} style={{ display: "none" }} />
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 14px",
                    borderRadius: 12,
                    background: "#FFFFFF",
                    border: "1px solid #E0E0E0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1A1D24",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#212121", marginBottom: 6 }}>
                  .tut 파일을 끌어다 놓으세요
                </div>
                <div style={{ fontSize: 12, color: "#757575", marginBottom: 14 }}>
                  최대 50MB · 지원 포맷: .tut, .tutfile
                </div>
                <span
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 7,
                    background: "#1A1D24",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  파일 선택
                </span>

                <div
                  style={{
                    marginTop: 24,
                    padding: 14,
                    background: "#FFFFFF",
                    border: "1px solid #EEEEEE",
                    borderRadius: 8,
                    textAlign: "left",
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#757575",
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ color: "#9E9E9E", fontWeight: 800, marginBottom: 4 }}># .combo 파일이란?</div>
                  combo.gg 데스크톱 앱에서 녹화한 콤보 입력 시퀀스 데이터 파일입니다.<br/>
                  키 입력 + 타이밍 + 아이템 활성화 정보가 포함되어 있습니다.
                </div>
              </label>
            </section>
          )}

          {step >= 2 && file && (
            <section style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  background: "#F0F7F0",
                  border: "1px solid #C8E6C9",
                  borderRadius: 8,
                  marginBottom: step === 2 ? 24 : 0,
                }}
              >
                <span style={{ width: 32, height: 32, borderRadius: 7, background: "#2E7D32", color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                  ✓
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1B5E20", fontFamily: "'JetBrains Mono', monospace" }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: "#388E3C", marginTop: 2 }}>업로드 완료 · {(file.size / 1024).toFixed(1)} KB · 입력 시퀀스 자동 인식됨</div>
                </div>
                {step === 2 && (
                  <button
                    onClick={() => { setFile(null); setStep(1); }}
                    style={{ background: "transparent", border: 0, color: "#757575", cursor: "pointer", padding: 6, fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}
                  >
                    교체
                  </button>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="제목" required>
                <input
                  type="text"
                  value={info.title}
                  onChange={(e) => setInfo({ ...info, title: e.target.value })}
                  placeholder="예: 아리 차지 풀콤보 — EQR 매혹 시작"
                  style={inputStyle}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="챔피언" required>
                  <select
                    value={info.champion}
                    onChange={(e) => setInfo({ ...info, champion: e.target.value })}
                    style={selectStyle}
                  >
                    {Object.keys(LOL_CHAMPS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="난이도" required>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { v: 1, l: "쉬움", c: "#4CAF50" },
                      { v: 2, l: "보통", c: "#FFA726" },
                      { v: 3, l: "어려움", c: "#F44336" },
                    ].map((d) => {
                      const active = info.difficulty === d.v;
                      return (
                        <button
                          key={d.v}
                          onClick={() => setInfo({ ...info, difficulty: d.v })}
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 7,
                            background: active ? "#FFFFFF" : "#FAFAFA",
                            color: active ? "#212121" : "#757575",
                            border: active ? `2px solid ${d.c}` : "1px solid #E0E0E0",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          {d.l}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <Field label="태그" hint="콤보 종류와 사용 상황을 선택하세요 (다중 선택)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TAGS.map((t) => {
                    const active = info.tags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 999,
                          background: active ? "#1A1D24" : "#FFFFFF",
                          color: active ? "#FFFFFF" : "#424242",
                          border: active ? "1px solid #1A1D24" : "1px solid #E0E0E0",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="권장 레벨" hint="예: 6+, 9+, 11+">
                  <input
                    type="text"
                    value={info.level}
                    onChange={(e) => setInfo({ ...info, level: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
                <Field label="필요 스킬가속" hint="해당 없으면 — 입력">
                  <input
                    type="text"
                    value={info.skillHaste}
                    onChange={(e) => setInfo({ ...info, skillHaste: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="권장 아이템" hint="쉼표로 구분 — 예: 루덴의 동반자, 수호 천사">
                <input
                  type="text"
                  value={info.items}
                  onChange={(e) => setInfo({ ...info, items: e.target.value })}
                  placeholder="루덴의 동반자, 수호 천사"
                  style={inputStyle}
                />
              </Field>

              <Field label="작성자 노트" hint="언제 쓰는 콤보인지, 주의사항 등">
                <textarea
                  value={info.note}
                  onChange={(e) => setInfo({ ...info, note: e.target.value })}
                  placeholder="이 콤보는 언제 쓰는지, 어떤 점에 주의해야 하는지 작성해주세요..."
                  style={{ ...inputStyle, minHeight: 100, padding: 12, resize: "vertical" }}
                />
              </Field>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #EEEEEE", marginTop: 8 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 7,
                    background: "transparent",
                    color: "#616161",
                    border: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  ← 뒤로
                </button>
                <button
                  disabled={!canPublish}
                  onClick={() => setStep(3)}
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 7,
                    background: canPublish ? "#1A1D24" : "#E0E0E0",
                    color: canPublish ? "#FFFFFF" : "#9E9E9E",
                    border: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: canPublish ? "pointer" : "not-allowed",
                  }}
                >
                  다음 — 미리보기
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#212121" }}>게시 미리보기</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#757575" }}>아래 정보로 콤보가 게시됩니다. 확인 후 게시 버튼을 눌러주세요.</p>

              <div style={{ background: "#FAFAFA", border: "1px solid #EEEEEE", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 6px", borderRadius: 999, background: "#F5F5F5", fontSize: 11, fontWeight: 600, color: "#424242" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: LOL_CHAMPS[info.champion]?.color || "#9E9E9E" }} />
                    {info.champion}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#616161" }}>
                    {info.difficulty === 1 ? "쉬움" : info.difficulty === 2 ? "보통" : "어려움"}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#212121", letterSpacing: -0.3 }}>{info.title || "(제목 없음)"}</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {info.tags.map((t) => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#616161", padding: "3px 8px", background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: 4 }}>#{t}</span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#424242" }}>
                  <span style={{ color: "#9E9E9E" }}>LEVEL</span>
                  <span>{info.level || "—"}</span>
                  <span style={{ color: "#9E9E9E" }}>HASTE</span>
                  <span>{info.skillHaste || "—"}</span>
                  <span style={{ color: "#9E9E9E" }}>ITEMS</span>
                  <span>{info.items || "—"}</span>
                </div>
                {info.note && (
                  <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.6, color: "#616161", padding: 12, background: "#FFFFFF", borderRadius: 6, border: "1px solid #EEEEEE" }}>
                    {info.note}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #EEEEEE" }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 7,
                    background: "transparent",
                    color: "#616161",
                    border: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  ← 정보 수정
                </button>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    height: 40,
                    padding: "0 24px",
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
                  콤보 게시하기
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: 40,
  padding: "0 12px",
  borderRadius: 7,
  border: "1px solid #E0E0E0",
  background: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: 13,
  color: "#212121",
  outline: "none",
};
const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' stroke='%239E9E9E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 30 };

const Field = ({ label, hint, required, children }) => (
  <div>
    <label style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#212121" }}>
        {label} {required && <span style={{ color: "#C2185B" }}>*</span>}
      </span>
      {hint && <span style={{ fontSize: 11, color: "#9E9E9E" }}>{hint}</span>}
    </label>
    {children}
  </div>
);

window.UploadPage = UploadPage;
