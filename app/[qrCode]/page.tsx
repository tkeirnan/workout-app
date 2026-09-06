import WorkoutLogger from "@/components/workout-logger";
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

  // Log the full result for debugging
  console.log("Supabase response:", { data, error });

  if (error || !data) {
    console.log("QR code not found:", qrCode);
    // TEMPORARY: Show the error on the page for debugging
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>Debug: QR Code Validation Failed</h1>
        <p>
          QR Code: <strong>{qrCode}</strong>
        </p>
        <p>
          Error: {error ? JSON.stringify(error) : "No error, but no data found"}
        </p>
        <p>Data: {data ? JSON.stringify(data) : "null"}</p>
        <p>
          Check your Supabase `valid_qr_codes` table to ensure this QR code
          exists.
        </p>
      </div>
    );
  }

  console.log("QR code found:", qrCode);
  return <WorkoutLogger qrCode={qrCode} />;
}
