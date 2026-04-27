import { NextResponse } from "next/server";
import { signSession } from "@/lib/viewer-auth";

const SECRET = process.env.DASHBOARD_SECRET;

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!SECRET || password !== SECRET) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = await signSession(SECRET);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cockpit-session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("cockpit-session");
  return res;
}
