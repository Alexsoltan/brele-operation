import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth-session";

export async function POST() {
  clearSession();

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  clearSession();

  return NextResponse.redirect(new URL("/login", req.url));
}