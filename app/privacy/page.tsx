import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — combo.gg",
  description: "combo.gg의 개인정보 처리방침",
};

const LAST_UPDATED = "2026-05-07";
const CONTACT_EMAIL = "combo.gg@gmail.com";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ko";

  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-12 w-full">
      <header className="mb-10">
        <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-2">
          {locale === "en" ? "LEGAL" : "법적 고지"}
        </p>
        <h1 className="text-3xl font-black tracking-tight mb-2">
          {locale === "en" ? "Privacy Policy" : "개인정보 처리방침"}
        </h1>
        <p className="text-sm text-text-muted">
          {locale === "en" ? "Last updated" : "최종 수정"}: {LAST_UPDATED}
        </p>
      </header>

      {locale === "en" ? <EnglishContent /> : <KoreanContent />}

      <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-gold hover:underline">
          {locale === "en" ? "Terms of Service" : "이용약관"}
        </Link>
        <Link href="/" className="text-text-muted hover:text-text">
          {locale === "en" ? "← Home" : "← 홈으로"}
        </Link>
      </div>
    </main>
  );
}

function KoreanContent() {
  return (
    <article className="prose-combogg space-y-8 text-sm leading-relaxed text-text">
      <Section title="1. 개요">
        <p>
          combo.gg(이하 &quot;서비스&quot;)는 사용자의 개인정보를 소중히 다룹니다. 본 방침은 서비스가
          어떤 정보를 수집하고, 왜 수집하며, 어떻게 보호하는지 설명합니다. 본 서비스는 현재
          비공개 알파 테스트 단계로 운영되고 있으며, 정식 출시 시 본 방침이 갱신될 수 있습니다.
        </p>
      </Section>

      <Section title="2. 수집하는 정보">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>계정 정보</strong>: 이메일 주소, OAuth 제공자(Google·Discord) 식별자, 닉네임,
            프로필 이미지 URL.
          </li>
          <li>
            <strong>업로드 콘텐츠</strong>: .tutfile 메타데이터(콤보 제목·설명·태그·게임별 조건),
            영상 파일(.mp4), 썸네일 이미지, 입력 시퀀스 데이터.
          </li>
          <li>
            <strong>활동 정보</strong>: 좋아요·다운로드·저장·댓글 기록, 콤보 조회수.
          </li>
          <li>
            <strong>기술 정보</strong>: 접속 시각·IP 주소·User-Agent(서버 로그), Vercel Analytics가
            수집하는 익명 페이지 뷰·성능 지표.
          </li>
        </ul>
      </Section>

      <Section title="3. 수집 목적">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>서비스 제공: 로그인·콤보 업로드·다운로드·재생 기능 제공</li>
          <li>
            콘텐츠 모더레이션: 신고된 콤보·댓글 검토, 저작권 침해·스팸·어뷰징 대응
          </li>
          <li>분석 및 개선: 익명 사용 통계로 서비스 품질·성능 개선</li>
          <li>법적 의무 이행 및 분쟁 대응</li>
        </ul>
      </Section>

      <Section title="4. 보관 기간">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>계정이 활성화된 동안 사용자 정보·업로드 콘텐츠를 보관합니다.</li>
          <li>
            계정 삭제 요청 시: 30일 이내 활성 데이터베이스에서 영구 삭제. 백업본은 최대 90일까지
            보관 후 삭제됩니다.
          </li>
          <li>
            법적 보존 의무가 있는 정보(예: 분쟁·신고 기록)는 관련 법령에서 정한 기간 동안 별도로
            보관합니다.
          </li>
        </ul>
      </Section>

      <Section title="5. 제3자 제공">
        <p>
          combo.gg는 사용자 개인정보를 제3자에게 판매·공유하지 않습니다. 다만 서비스를 운영하기
          위해 다음의 신뢰할 수 있는 인프라 제공자를 사용합니다(데이터 처리 위탁 관계).
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Supabase</strong> — 데이터베이스 및 파일 스토리지 호스팅
          </li>
          <li>
            <strong>Vercel</strong> — 웹사이트 호스팅 및 익명 분석(Vercel Analytics)
          </li>
          <li>
            <strong>Google / Discord</strong> — OAuth 로그인 제공자
          </li>
        </ul>
        <p className="mt-2">
          위 제공자는 모두 자체 개인정보 처리방침을 가지며, 수탁받은 데이터를 별도의 목적으로
          사용할 수 없습니다.
        </p>
      </Section>

      <Section title="6. 사용자 권리">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>열람</strong>: 본인의 계정·업로드 콘텐츠를 언제든지 사이트에서 직접 확인할 수
            있습니다.
          </li>
          <li>
            <strong>수정</strong>: 닉네임·프로필 이미지·업로드한 콤보 정보를 직접 수정할 수
            있습니다.
          </li>
          <li>
            <strong>삭제</strong>: 계정 삭제 요청 시 본인이 업로드한 콤보·댓글·좋아요·다운로드
            기록 등이 cascade로 모두 삭제됩니다. 설정 페이지의 계정 삭제 메뉴를 사용하거나
            아래 이메일로 요청하세요.
          </li>
          <li>
            <strong>이의 제기</strong>: 본 방침과 처리 방식에 이의가 있는 경우 아래 연락처로
            문의해주세요.
          </li>
        </ul>
      </Section>

      <Section title="7. 쿠키 및 분석">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Auth.js 세션 쿠키</strong>: 로그인 상태를 유지하기 위해 필수적으로 사용됩니다.
          </li>
          <li>
            <strong>NEXT_LOCALE 쿠키</strong>: 사용자가 선택한 언어(한국어/영어)를 기억합니다.
          </li>
          <li>
            <strong>Vercel Analytics</strong>: 익명 페이지 뷰·로딩 성능을 수집합니다. 개인 식별 가능
            정보는 수집하지 않습니다.
          </li>
        </ul>
      </Section>

      <Section title="8. 보안">
        <p>
          combo.gg는 통신 구간 암호화(HTTPS), 액세스 토큰 분리, 데이터베이스 행 단위 보안 정책 등
          상식적인 보안 조치를 적용합니다. 다만 인터넷·전송 과정의 절대 안전은 보장할 수 없습니다.
        </p>
      </Section>

      <Section title="9. 미성년자 정책">
        <p>
          본 서비스는 만 14세 이상을 대상으로 합니다. 만 14세 미만의 가입은 허용하지 않으며, 발견
          시 즉시 계정을 삭제합니다.
        </p>
      </Section>

      <Section title="10. 방침 변경">
        <p>
          본 방침은 법령·서비스 변경에 따라 갱신될 수 있습니다. 중요한 변경 사항은 사이트 공지로
          알립니다.
        </p>
      </Section>

      <Section title="11. 연락처">
        <p>
          개인정보 관련 문의는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold hover:underline">
            {CONTACT_EMAIL}
          </a>
          {" "}으로 연락해주세요.
        </p>
      </Section>
    </article>
  );
}

function EnglishContent() {
  return (
    <article className="prose-combogg space-y-8 text-sm leading-relaxed text-text">
      <Section title="1. Overview">
        <p>
          combo.gg (the &quot;Service&quot;) values your privacy. This policy explains what
          information we collect, why we collect it, and how we protect it. The Service is
          currently in closed alpha testing and this policy may be updated upon public release.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Account information</strong>: email address, OAuth provider (Google / Discord)
            identifier, nickname, profile image URL.
          </li>
          <li>
            <strong>Uploaded content</strong>: .tutfile metadata (combo title, description, tags,
            game-specific conditions), video files (.mp4), thumbnail images, input sequence data.
          </li>
          <li>
            <strong>Activity</strong>: likes, downloads, saves, comments, combo view counts.
          </li>
          <li>
            <strong>Technical information</strong>: access timestamp, IP address, User-Agent
            (server logs), and anonymous page-view / performance metrics collected by Vercel
            Analytics.
          </li>
        </ul>
      </Section>

      <Section title="3. Purpose of Collection">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Provide the Service: sign-in, combo upload, download, and playback features</li>
          <li>
            Content moderation: review reported combos and comments, respond to copyright,
            spam, and abuse issues
          </li>
          <li>Analytics and improvement: improve service quality and performance using anonymous
            usage statistics</li>
          <li>Compliance with legal obligations and dispute resolution</li>
        </ul>
      </Section>

      <Section title="4. Retention">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>We retain your account information and uploaded content while your account is
            active.</li>
          <li>
            Upon account deletion: data is permanently removed from active databases within
            30 days. Backups may retain copies for up to 90 days before being purged.
          </li>
          <li>
            Information subject to legal retention requirements (e.g., dispute or report
            records) is stored separately for the period required by law.
          </li>
        </ul>
      </Section>

      <Section title="5. Third-Party Sharing">
        <p>
          combo.gg does not sell or share your personal information with third parties. We do
          rely on the following trusted infrastructure providers (data processors) to operate
          the Service:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Supabase</strong> — database and file storage hosting
          </li>
          <li>
            <strong>Vercel</strong> — website hosting and anonymous analytics (Vercel Analytics)
          </li>
          <li>
            <strong>Google / Discord</strong> — OAuth sign-in providers
          </li>
        </ul>
        <p className="mt-2">
          Each provider has its own privacy policy and is contractually prohibited from using
          processed data for any other purpose.
        </p>
      </Section>

      <Section title="6. Your Rights">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Access</strong>: you can review your account information and uploaded content
            on the Service at any time.
          </li>
          <li>
            <strong>Correction</strong>: you can update your nickname, profile image, and combo
            metadata directly.
          </li>
          <li>
            <strong>Deletion</strong>: when you delete your account, your uploaded combos,
            comments, likes, and download records are cascade-deleted. Use the delete-account
            option in Settings or email the address below.
          </li>
          <li>
            <strong>Objection</strong>: if you disagree with how your data is processed,
            contact us using the address below.
          </li>
        </ul>
      </Section>

      <Section title="7. Cookies & Analytics">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Auth.js session cookie</strong>: required to keep you signed in.
          </li>
          <li>
            <strong>NEXT_LOCALE cookie</strong>: remembers your language preference (Korean /
            English).
          </li>
          <li>
            <strong>Vercel Analytics</strong>: collects anonymous page views and performance
            metrics. No personally identifiable information is collected.
          </li>
        </ul>
      </Section>

      <Section title="8. Security">
        <p>
          We apply reasonable security measures including transport encryption (HTTPS), access
          token separation, and database row-level security. However, no method of internet
          transmission is perfectly secure.
        </p>
      </Section>

      <Section title="9. Minors">
        <p>
          The Service is intended for users 14 years of age and older. Accounts for users under
          14 are not permitted and will be deleted upon discovery.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this policy from time to time as the Service or applicable laws evolve.
          We will announce material changes on the site.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          For privacy-related inquiries, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold tracking-tight mb-3">{title}</h2>
      <div className="text-text-secondary space-y-2">{children}</div>
    </section>
  );
}
