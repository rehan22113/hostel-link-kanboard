import { PinGate } from "@/components/PinGate";

export default function Page() {
  // The whole board sits behind a member PIN gate; PinGate renders the
  // authenticated shell (header + board) once a PIN is verified.
  return <PinGate />;
}
