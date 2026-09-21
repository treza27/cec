import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_TAGS = ["reception_marchandise", "constat_anomalie", "chargement_conteneur", "inventaire_depot"] as const;
type PhotoTag = typeof VALID_TAGS[number];

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
];

function sanitizeFilename(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex !== -1 ? name.substring(dotIndex).toLowerCase() : "";
  const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
  const sanitized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized}${ext}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const formData = await req.formData();
    const fileEntries = formData.getAll("files") as File[];

    if (!fileEntries.length) {
      return new Response(JSON.stringify({ error: "No files received" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawTag = formData.get("tag") as string | null;
    const tag: PhotoTag | null = rawTag && (VALID_TAGS as readonly string[]).includes(rawTag)
      ? rawTag as PhotoTag
      : null;

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    const timePrefix = `${hh}${mm}${ss}`;

    const uploadedPaths: string[] = [];

    for (const file of fileEntries) {
      const sanitized = sanitizeFilename(file.name);
      const finalName = `${timePrefix}_${sanitized}`;
      const storagePath = `${today}/${finalName}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(storagePath, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload error for ${file.name}: ${uploadError.message}`);
      }

      const { error: dbError } = await supabase
        .from("photos_uploads")
        .insert({
          storage_path: storagePath,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          folder_date: today,
          tag,
        });

      if (dbError) {
        throw new Error(`DB insert error: ${dbError.message}`);
      }

      uploadedPaths.push(storagePath);
    }

    return new Response(
      JSON.stringify({
        success: true,
        folder: today,
        uploaded: uploadedPaths.length,
        paths: uploadedPaths,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
