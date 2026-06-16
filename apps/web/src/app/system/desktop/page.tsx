import type { Metadata } from "next";
import { Desktop } from "@/components/desktop/Desktop";

export const metadata: Metadata = {
  title: "Desktop",
  description: "A retro desktop OS — drag windows, open apps, send encrypted files.",
};

export default function DesktopPage() {
  return <Desktop />;
}
