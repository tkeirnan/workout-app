"use client";

import { WorkoutLogger } from "@/components/workout-logger";
import { useEffect, useState } from "react";

export default function Home() {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    // Get the QR code from the URL path
    const path = window.location.pathname;
    // Remove leading slash and use as QR code
    const code = path.length > 1 ? path.slice(1) : "";
    setQrCode(code);
  }, []);

  return <WorkoutLogger qrCode={qrCode} />;
}
