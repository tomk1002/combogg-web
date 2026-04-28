import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { getSupabaseAdmin, BUCKETS } from "@/lib/supabase";

const ALLOWED_BUCKETS = Object.values(BUCKETS);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const { bucket, filename } = await req.json();
    if (!bucket || !filename) return badRequest("bucket과 filename이 필요합니다");
    if (!ALLOWED_BUCKETS.includes(bucket)) return badRequest("허용되지 않는 버킷입니다");

    const ext = filename.split(".").pop();
    const path = `${session.user.id}/${Date.now()}.${ext}`;

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
