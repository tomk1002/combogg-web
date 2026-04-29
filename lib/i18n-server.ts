import { cookies } from "next/headers";
import type { Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const val = c.get("NEXT_LOCALE")?.value;
  return val === "en" ? "en" : "ko";
}
