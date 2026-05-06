import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { getSupabaseAdmin, BUCKETS } from "@/lib/supabase";
import { verifyDesktopToken } from "@/lib/desktop-token";

const ALLOWED_BUCKETS = Object.values(BUCKETS);

async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyDesktopToken(auth.slice(7));
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return unauthorized();

    const { bucket, filename } = await req.json();
    if (!bucket || !filename) return badRequest("bucket과 filename이 필요합니다");
    if (!ALLOWED_BUCKETS.includes(bucket)) return badRequest("허용되지 않는 버킷입니다");

    const ext = filename.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) return serverError(error);

    return ok({ uploadUrl: data.signedUrl, path: `${bucket}/${path}` });
  } catch (err) {
    return serverError(err);
  }
}
