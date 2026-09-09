"use client";

import { WorkoutLogger } from "@/components/workout-logger";
import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  // Extract QR code from pathname (remove leading slash)
  const qrCode = pathname && pathname !== "/" ? pathname.slice(1) : "";

  return <WorkoutLogger qrCode={qrCode} />;
}
