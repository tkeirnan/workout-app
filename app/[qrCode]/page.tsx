import { WorkoutLogger } from "@/components/workout-logger";
import { createClient } from "@supabase/supabase-js";

export default async function QrCodePage({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  // In Next.js 15+, params is a Promise and must be awaited
  const { qrCode } = await params;

  // If no QR code is provided, show an error
  if (!qrCode) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1 style={{ color: "red" }}>❌ Error: No QR Code Provided</h1>
        <p>The URL should be in the format: qrsets.com/YOUR-CODE</p>
        <p>Example: qrsets.com/TEST001</p>
      </div>
    );
  }

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1 style={{ color: "red" }}>❌ Configuration Error</h1>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{" "}
          {supabaseUrl ? "✅ Set" : "❌ Missing"}
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
          {supabaseKey ? "✅ Set" : "❌ Missing"}
        </p>
      </div>
    );
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Query the valid_qr_codes table using ilike (case-insensitive)
  const { data, error } = await supabase
    .from("valid_qr_codes") // <-- FIXED: removed "public." prefix
    .select("qr_code")
    .ilike("qr_code", qrCode)
    .eq("is_active", true)
    .maybeSingle();

  // If there's an error or no data, show the debug page
  if (error || !data) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>🔍 Debug: QR Code Validation Failed</h1>
        <p>
          <strong>QR Code requested:</strong> {qrCode}
        </p>
        <p>
          <strong>Supabase URL:</strong> {supabaseUrl}
        </p>
        <p>
          <strong>Error from Supabase:</strong>{" "}
          {error
            ? JSON.stringify(error, null, 2)
            : "No error, but no data found"}
        </p>
        <p>
          <strong>Data returned:</strong> {data ? JSON.stringify(data) : "null"}
        </p>
      </div>
    );
  }

  // If everything works, load the app
  return <WorkoutLogger qrCode={qrCode} />;
}
