import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const FUND_TRANSFER_BUCKET = "fund-transfer-proofs";

function sanitizeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadFundTransferProof(params: {
  file: File;
  requestNo: string;
  stage: "source" | "destination" | "release";
  branchId?: string | null;
}): Promise<string> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Supabase client is not available for uploads.");
  }

  const extension = params.file.name.includes(".")
    ? params.file.name.split(".").pop()?.toLowerCase() ?? "png"
    : "png";
  const safeRequestNo = sanitizeName(params.requestNo || "fund-request");
  const safeBranch = sanitizeName(params.branchId || "super-admin");
  const safeStage = sanitizeName(params.stage);
  const filePath = `${safeBranch}/${safeRequestNo}/${safeStage}-${Date.now()}.${extension}`;

  const { error } = await client.storage
    .from(FUND_TRANSFER_BUCKET)
    .upload(filePath, params.file, {
      upsert: false,
      contentType: params.file.type || "image/*",
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from(FUND_TRANSFER_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}