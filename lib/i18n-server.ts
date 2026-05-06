import { cookies } from "next/headers";
import { getT, type T } from "./i18n";

export async function getServerT(): Promise<T> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ko";
  return getT(locale);
}
