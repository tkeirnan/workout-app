import WorkoutLogger from "@/components/workout-logger";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default async function QrCodePage({
  params,
}: {
  params: { qrCode: string };
}) {
  const { qrCode } = params;

  // Log the QR code for debugging
  console.log("QR Code requested:", qrCode);

  // Initialize Supabase client directly using environment variables
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Validate the QR code against the database
  const { data, error } = await supabase
    .from("valid_qr_codes")
    .select("qr_code")
    .eq("qr_code", qrCode)
    .eq("is_active", true)
    .maybeSingle();

  // If the QR code is not found, return a 404
  if (error || !data) {
    console.log("QR code not found:", qrCode);
    notFound();
  }

  console.log("QR code found:", qrCode);
  return <WorkoutLogger qrCode={qrCode} />;
}
