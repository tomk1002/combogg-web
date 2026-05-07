import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "이용약관 — combo.gg",
  description: "combo.gg 서비스 이용약관",
};

const LAST_UPDATED = "2026-05-07";
const CONTACT_EMAIL = "combo.gg@gmail.com";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ko";

  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-12 w-full">
      <header className="mb-10">
        <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-2">
          {locale === "en" ? "LEGAL" : "법적 고지"}
        </p>
        <h1 className="text-3xl font-black tracking-tight mb-2">
          {locale === "en" ? "Terms of Service" : "이용약관"}
        </h1>
        <p className="text-sm text-text-muted">
          {locale === "en" ? "Last updated" : "최종 수정"}: {LAST_UPDATED}
        </p>
      </header>

      {locale === "en" ? <EnglishContent /> : <KoreanContent />}

      <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
        <Link href="/privacy" className="text-gold hover:underline">
          {locale === "en" ? "Privacy Policy" : "개인정보 처리방침"}
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
      <Section title="1. 서비스 이용">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>combo.gg(이하 &quot;서비스&quot;)를 이용하려면 계정이 필요합니다.</li>
          <li>
            서비스 이용 가능 연령은 만 14세 이상입니다. 만 14세 미만은 가입 및 이용이 불가합니다.
          </li>
          <li>
            <strong>본 서비스는 비공개 알파 테스트 단계입니다.</strong> 기능이 불안정할 수 있고,
            예고 없이 변경·중단될 수 있으며, 알파 기간 중 데이터가 초기화될 수 있습니다.
          </li>
          <li>알파 기간에는 사전에 초대된 사용자만 로그인할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="2. 사용자 콘텐츠">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            사용자가 업로드한 모든 콘텐츠(콤보·영상·썸네일·텍스트 등, 이하 &quot;사용자 콘텐츠&quot;)의
            소유권은 사용자에게 있습니다.
          </li>
          <li>
            사용자는 사용자 콘텐츠를 업로드함으로써 combo.gg에게 해당 콘텐츠를 서비스에서{" "}
            <strong>게재·표시·다운로드 가능하도록 제공·배포</strong>할 수 있는 비독점적·전 세계
            적용·로열티 없음의 사용 권한을 부여합니다.
          </li>
          <li>
            이 권한은 서비스 운영(저장·전송·미리보기·캐시·백업·홍보 자료 작성 등)에 필요한
            범위로 한정됩니다.
          </li>
          <li>
            사용자는 본인이 업로드한 콘텐츠를 언제든지 삭제할 수 있으며, 삭제 시 위 권한도
            함께 종료됩니다(다만 백업·캐시는 본 정책에서 정한 기간 내 잔존할 수 있음).
          </li>
        </ul>
      </Section>

      <Section title="3. 금지 행위">
        <p>다음 행위는 금지됩니다.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1.5">
          <li>타인의 저작권·상표권·초상권 등 권리를 침해하는 콘텐츠 업로드</li>
          <li>스팸, 광고, 어뷰징 행위(과도한 반복 업로드, 자동화된 대량 요청 등)</li>
          <li>봇·스크립트를 이용한 좋아요·다운로드·조회수 조작</li>
          <li>타인 사칭, 허위 정보 게재</li>
          <li>음란물·폭력·차별·혐오·괴롭힘 등 부적절한 콘텐츠 게시</li>
          <li>서비스의 정상 운영을 방해하는 행위(취약점 공격, DDoS 등)</li>
          <li>관련 법령 또는 본 약관을 위반하는 행위</li>
        </ul>
      </Section>

      <Section title="4. 콘텐츠에 대한 책임">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            사용자 콘텐츠에 대한 모든 법적 책임은 해당 콘텐츠를 업로드한 사용자에게 있습니다.
          </li>
          <li>
            combo.gg는 사용자 콘텐츠를 사전 검열하지 않으나, 신고가 접수된 콘텐츠는 검토 후 삭제·
            비공개·계정 제재 등의 조치를 취할 수 있습니다.
          </li>
          <li>
            저작권 침해 신고는{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold hover:underline">
              {CONTACT_EMAIL}
            </a>
            {" "}으로 접수해주세요.
          </li>
        </ul>
      </Section>

      <Section title="5. Riot Games 관련 고지">
        <p>
          combo.gg는 Riot Games, Inc.의 공식 서비스가 아니며, Riot Games로부터 후원·승인·인증을
          받지 않았습니다. 본 서비스에서 사용되는 챔피언 이름·아이템·스킬 아이콘 등 게임
          데이터는 Riot Games가 공개적으로 제공하는 Data Dragon에서 가져옵니다.
        </p>
        <p className="mt-2">
          League of Legends 및 Riot Games는 Riot Games, Inc.의 상표 또는 등록 상표입니다.
          League of Legends © Riot Games, Inc.
        </p>
      </Section>

      <Section title="6. 책임 한계">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            서비스는 &quot;있는 그대로(as-is)&quot; 제공됩니다. 특정 목적 적합성·무중단성·정확성에
            대한 어떠한 명시적·묵시적 보증도 하지 않습니다.
          </li>
          <li>
            combo.gg는 데이터 손실, 서비스 중단, 사용자 콘텐츠 유실, 영업 손실 등 어떠한 직간접
            손해에 대해서도 관련 법령이 허용하는 최대 한도 내에서 책임을 지지 않습니다.
          </li>
          <li>
            특히 알파 기간 중에는 데이터가 예고 없이 삭제·초기화될 수 있으며, 사용자는 본인의
            중요한 데이터를 별도로 백업할 책임이 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="7. 약관 변경">
        <p>
          본 약관은 사이트 공지 또는 이메일을 통해 변경될 수 있습니다. 변경된 약관은 공지된
          시점부터 효력이 발생하며, 사용자가 변경 후에도 서비스를 계속 이용하면 변경된 약관에
          동의한 것으로 간주합니다.
        </p>
      </Section>

      <Section title="8. 계정 종료 및 서비스 중단">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            사용자가 본 약관을 위반한 경우 사전 통지 없이 계정을 일시 정지·종료할 수 있습니다.
          </li>
          <li>
            combo.gg는 알파 종료, 서비스 개편 등 합리적 사유가 있을 경우 서비스 전체 또는 일부를
            중단할 수 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="9. 분쟁 해결">
        <p>
          본 약관과 관련된 분쟁은 대한민국 법령에 따라 해석되며, 관할 법원은 대한민국의
          민사소송법에 따릅니다.
        </p>
      </Section>

      <Section title="10. 연락처">
        <p>
          서비스 관련 문의는{" "}
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
      <Section title="1. Service Use">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>An account is required to use combo.gg (the &quot;Service&quot;).</li>
          <li>
            You must be 14 years of age or older to use the Service. Users under 14 are not
            permitted.
          </li>
          <li>
            <strong>The Service is currently in closed alpha testing.</strong> Features may be
            unstable, may change or be discontinued without notice, and data may be reset
            during the alpha period.
          </li>
          <li>During alpha, only invited users may sign in.</li>
        </ul>
      </Section>

      <Section title="2. User Content">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            You retain ownership of all content you upload (combos, videos, thumbnails, text;
            collectively, &quot;User Content&quot;).
          </li>
          <li>
            By uploading User Content, you grant combo.gg a non-exclusive, worldwide,
            royalty-free license to <strong>host, display, and make available for download</strong>{" "}
            that content on the Service.
          </li>
          <li>
            This license is limited to what is necessary to operate the Service (storage,
            transmission, previews, caching, backups, and promotional materials about the
            Service).
          </li>
          <li>
            You may delete User Content at any time, which terminates the license (subject to
            backups and caches retained for the periods stated in the Privacy Policy).
          </li>
        </ul>
      </Section>

      <Section title="3. Prohibited Conduct">
        <p>The following conduct is prohibited:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1.5">
          <li>Uploading content that infringes copyright, trademarks, or publicity rights</li>
          <li>Spam, advertising, abuse (excessive duplicate uploads, automated bulk requests)</li>
          <li>Manipulating likes, downloads, or views via bots or scripts</li>
          <li>Impersonation or false information</li>
          <li>
            Posting obscene, violent, discriminatory, hateful, or harassing content
          </li>
          <li>Disrupting the Service (vulnerability attacks, DDoS, etc.)</li>
          <li>Violating applicable laws or these Terms</li>
        </ul>
      </Section>

      <Section title="4. Responsibility for Content">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            You are solely responsible for the User Content you upload.
          </li>
          <li>
            combo.gg does not pre-screen User Content but reserves the right to review reported
            content and remove, hide, or sanction accounts as needed.
          </li>
          <li>
            Send copyright complaints to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="5. Riot Games Notice">
        <p>
          combo.gg is not endorsed by, sponsored by, or affiliated with Riot Games, Inc. Game
          data such as champion names, items, and skill icons used on the Service come from
          Riot&apos;s publicly available Data Dragon.
        </p>
        <p className="mt-2">
          League of Legends and Riot Games are trademarks or registered trademarks of Riot
          Games, Inc. League of Legends © Riot Games, Inc.
        </p>
      </Section>

      <Section title="6. Limitation of Liability">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            The Service is provided &quot;as-is&quot; without any express or implied warranty
            of fitness for a particular purpose, uninterrupted operation, or accuracy.
          </li>
          <li>
            To the maximum extent permitted by law, combo.gg disclaims liability for any direct
            or indirect damages including data loss, service interruption, loss of User Content,
            or business losses.
          </li>
          <li>
            During the alpha period, data may be deleted or reset without notice. You are
            responsible for backing up any data important to you.
          </li>
        </ul>
      </Section>

      <Section title="7. Changes to Terms">
        <p>
          These Terms may be updated via site announcements or email. Updated Terms take effect
          when posted; continued use of the Service after that date constitutes acceptance of
          the updated Terms.
        </p>
      </Section>

      <Section title="8. Account Termination & Service Suspension">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            We may suspend or terminate accounts that violate these Terms, with or without
            prior notice.
          </li>
          <li>
            combo.gg may discontinue all or part of the Service for reasonable cause, including
            end-of-alpha or service redesign.
          </li>
        </ul>
      </Section>

      <Section title="9. Dispute Resolution">
        <p>
          These Terms are governed by the laws of the Republic of Korea, and disputes shall be
          heard in the courts having jurisdiction under the Korean Civil Procedure Act.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For questions about the Service, contact{" "}
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
