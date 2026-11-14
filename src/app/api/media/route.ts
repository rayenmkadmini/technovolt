import { NextRequest, NextResponse } from "next/server";
import { requireMediaAdmin } from "@/lib/auth/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCloudflareImageUrl, resolveMediaSrc } from "@/lib/media/imageUrl";

const ALLOWED_SORT_COLUMNS = new Set([
  "created_at",
  "file_name",
  "size_bytes",
  "sort_order",
]);

export async function GET(req: NextRequest) {
  const auth = await requireMediaAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "24", 10) || 24));
    const search = (searchParams.get("search") || "").trim().slice(0, 100);
    const folder = (searchParams.get("folder") || "all").trim().toLowerCase();
    const provider = (searchParams.get("provider") || "all").trim().toLowerCase();
    const rawSortBy = searchParams.get("sortBy") || "created_at";
    const sortBy = ALLOWED_SORT_COLUMNS.has(rawSortBy) ? rawSortBy : "created_at";
    const sortDir = searchParams.get("sortDir") === "asc";

    const supabase = createAdminClient();
    let query = supabase
      .from("media_assets")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

    if (folder && folder !== "all") {
      const safeFolderFilter = folder.replace(/[^a-z0-9_-]/gi, "");
      if (safeFolderFilter) {
        query = query.or(`folder.ilike.${safeFolderFilter},category.ilike.${safeFolderFilter}`);
      }
    }

    if (provider && ["r2", "supabase", "local"].includes(provider)) {
      query = query.eq("storage_provider", provider);
    }

    if (search) {
      const escaped = search.replace(/[%_,()]/g, "");
      if (escaped) {
        query = query.or(
          `file_name.ilike.%${escaped}%,original_filename.ilike.%${escaped}%,alt_text_fr.ilike.%${escaped}%,alt_text_ar.ilike.%${escaped}%`
        );
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order(sortBy, { ascending: sortDir })
      .range(from, to);

    if (error) throw error;

    const items = (data || []).map((row: any) => {
      const resolvedUrl = resolveMediaSrc(row);
      return {
        ...row,
        resolvedUrl,
        thumbnailUrl: buildCloudflareImageUrl(resolvedUrl, "thumbnail"),
        cardUrl: buildCloudflareImageUrl(resolvedUrl, "card"),
      };
    });

    const total = count ?? items.length;
    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("List media error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Impossible de charger la médiathèque." },
      { status: 500 }
    );
  }
}
