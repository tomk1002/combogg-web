import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.onboardingCompleted) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nickname: true, email: true },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <OnboardingWizard
        currentNickname={user?.nickname ?? null}
        currentEmail={user?.email ?? null}
      />
    </div>
  );
}
