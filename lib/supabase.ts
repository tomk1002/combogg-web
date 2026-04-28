import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 클라이언트 컴포넌트용 (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 전용 (service role — 절대 클라이언트에 노출 금지)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 스토리지 버킷 이름
export const BUCKETS = {
  tutfiles: "tutfiles",
  videos: "videos",
  thumbnails: "thumbnails",
} as const;
