import { MEMBERS } from "@/config/members";

// Static 4-digit PINs, one per team member.
//
// Server-only: this file must never be imported by a client component, so the
// PINs stay out of the browser bundle. To change a member's PIN, edit its value
// here (keep it a 4-digit string).
export const MEMBER_PINS = {
  Hamdan: "4021",
  Junaid: "7314",
  Rehan: "2860",
  Ahmed: "5197",
};

// Returns the member name whose PIN matches, or null if none does.
export function memberForPin(pin) {
  const clean = String(pin || "").trim();
  if (!/^\d{4}$/.test(clean)) return null;
  return MEMBERS.find((m) => MEMBER_PINS[m] === clean) || null;
}
