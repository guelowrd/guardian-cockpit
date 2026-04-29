import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.DASHBOARD_SECRET;
const OPEN: string[] = ["/login", "/api/auth"];

async function verifyToken(secret: string, token: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("cockpit-session"));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export async function proxy(req: NextRequest) {
  if (!SECRET) return NextResponse.next();
  if (OPEN.some((p) => req.nextUrl.pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("cockpit-session")?.value;
  if (!token || !(await verifyToken(SECRET, token))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
