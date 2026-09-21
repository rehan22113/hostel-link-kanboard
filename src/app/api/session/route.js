import { NextResponse } from "next/server";
import { memberForPin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/session — verify a 4-digit PIN and return the matching member name.
// PINs are checked server-side so they never reach the browser.
export async function POST(request) {
  try {
    const body = await request.json();
    const member = memberForPin(body.pin);
    if (!member) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
    return NextResponse.json({ member });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
