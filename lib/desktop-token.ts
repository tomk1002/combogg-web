import { SignJWT, jwtVerify } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function signDesktopToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "desktop" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyDesktopToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "desktop" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
