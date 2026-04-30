import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const onboardingCompleted = req.auth?.user?.onboardingCompleted ?? true;
  const isOnboarding = nextUrl.pathname === "/onboarding";

  // Authenticated users who haven't finished onboarding → /onboarding
  if (isLoggedIn && !onboardingCompleted && !isOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Prevent already-onboarded users from re-entering the flow
  if (isLoggedIn && onboardingCompleted && isOnboarding) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|icons|.*\\.png$|.*\\.svg$).*)"],
};
