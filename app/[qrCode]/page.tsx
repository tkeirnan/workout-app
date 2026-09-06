import { WorkoutLogger } from "@/components/workout-logger";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default async function QrCodePage({
  params,
}: {
  params: { qrCode: string };
}) {
  const { qrCode } = params;

  console.log("=== QR CODE DEBUGGING ===");
  console.log("1. QR Code requested:", qrCode);
  console.log("2. Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "3. Supabase Key (first 10 chars):",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10),
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  console.log("4. Querying valid_qr_codes table for:", qrCode);

  const { data, error } = await supabase
    .from("valid_qr_codes")
    .select("qr_code")
    .eq("qr_code", qrCode)
    .eq("is_active", true)
    .maybeSingle();

  console.log("5. Query result - Data:", data);
  console.log("6. Query result - Error:", error);

  if (error || !data) {
    console.log("7. QR code not found, returning 404");
    notFound();
  }

  console.log("8. QR code found, rendering WorkoutLogger");
  return <WorkoutLogger qrCode={qrCode} />;
}
