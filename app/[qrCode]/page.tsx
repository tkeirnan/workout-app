import { WorkoutLogger } from "@/components/workout-logger";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default async function QrCodePage({
  params,
}: {
  params: { qrCode: string };
}) {
  const { qrCode } = params;

  console.log("QR Code requested:", qrCode);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("valid_qr_codes")
    .select("qr_code")
    .eq("qr_code", qrCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    console.log("QR code not found:", qrCode);
    notFound();
  }

  console.log("QR code found:", qrCode);
  return <WorkoutLogger qrCode={qrCode} />;
}
