import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapNotionPageToJobOrder } from "@/lib/notion-sync";

const NOTION_VERSION = "2022-06-28";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Bukan akun admin." }, { status: 403 });
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_JOB_POSTING_DATABASE_ID;
  if (!notionApiKey || !databaseId) {
    return NextResponse.json(
      {
        error:
          "Sinkronisasi Notion belum dikonfigurasi. Set NOTION_API_KEY dan NOTION_JOB_POSTING_DATABASE_ID di environment variables.",
      },
      { status: 501 }
    );
  }

  const notionRes = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100 }),
    }
  );

  if (!notionRes.ok) {
    const detail = await notionRes.text();
    return NextResponse.json(
      { error: `Gagal mengambil data dari Notion: ${detail}` },
      { status: 502 }
    );
  }

  const notionData = await notionRes.json();
  const rows = (notionData.results ?? []).map(mapNotionPageToJobOrder);

  if (rows.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const { error } = await supabase
    .from("job_orders")
    .upsert(rows, { onConflict: "notion_page_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: rows.length });
}
