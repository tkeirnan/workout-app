import { WorkoutLogger } from "@/components/workout-logger";
import { createClient } from "@supabase/supabase-js";

export default async function QrCodePage({
  params,
}: {
  params: { qrCode: string };
}) {
  const { qrCode } = params;

  // 1. Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are missing, show an error on the page
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
        <p>Please add these environment variables in Vercel.</p>
      </div>
    );
  }

  // 2. Try to query Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("public.valid_qr_codes")
    .select("qr_code")
    .eq("qr_code", qrCode)
    .eq("is_active", true)
    .maybeSingle();

  // 3. If there's an error or no data, show the problem on the page
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
          <strong>Supabase Key (first 10 chars):</strong>{" "}
          {supabaseKey.substring(0, 10)}...
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
        <p>---</p>
        <p>
          Check that <code>{qrCode}</code> exists in your{" "}
          <code>valid_qr_codes</code> table and that <code>is_active</code> is
          set to <code>true</code>.
        </p>
      </div>
    );
  }

  // 4. If everything works, load the app
  return <WorkoutLogger qrCode={qrCode} />;
}
