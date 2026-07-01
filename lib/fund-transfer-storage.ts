import { api } from "@/lib/api";

export async function uploadFundTransferProof(params: {
  file: File;
  requestNo: string;
  stage: "source" | "destination" | "release";
  branchId?: string | null;
}): Promise<string> {
  const fileData = await prepareProofFileData(params.file);
  const result = await api.post<{ proofUrl: string }>("/fund-requests/proof-upload", {
    requestNo: params.requestNo,
    stage: params.stage,
    fileName: params.file.name,
    branchId: params.branchId ?? undefined,
    fileData,
  });

  if (!result.proofUrl) {
    throw new Error("Proof upload did not return a public URL.");
  }

  return result.proofUrl;
}

export async function uploadBuybackProof(params: {
  file: File;
  transactionNo: string;
  branchId?: string | null;
}): Promise<string> {
  console.log('[BUYBACK PROOF UPLOAD] Starting upload...', {
    fileName: params.file.name,
    fileSize: params.file.size,
    fileType: params.file.type,
    transactionNo: params.transactionNo,
    branchId: params.branchId
  });

  const fileData = await prepareProofFileData(params.file);
  console.log('[BUYBACK PROOF UPLOAD] File data prepared, length:', fileData.length);

  console.log('[BUYBACK PROOF UPLOAD] Calling API endpoint...');
  const result = await api.post<{ proofUrl: string }>("/transactions/buyback-proof-upload", {
    transactionNo: params.transactionNo,
    fileName: params.file.name,
    branchId: params.branchId ?? undefined,
    fileData,
  });

  console.log('[BUYBACK PROOF UPLOAD] API response:', result);

  if (!result.proofUrl) {
    throw new Error("Buyback proof upload did not return a public URL.");
  }

  console.log('[BUYBACK PROOF UPLOAD] Success! URL:', result.proofUrl);
  return result.proofUrl;
}

async function prepareProofFileData(file: File): Promise<string> {
  if (file.size <= 4_000_000 && file.type !== "image/png") {
    return fileToDataUrl(file);
  }

  try {
    const compressedFile = await compressImageFile(file);
    return fileToDataUrl(compressedFile);
  } catch {
    return fileToDataUrl(file);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read proof image."));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File): Promise<File> {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);

  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const blob = await dataUrlToBlob(compressedDataUrl);
  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load proof image."));
    image.src = src;
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function replaceExtension(fileName: string, extension: string): string {
  const parts = fileName.split(".");
  if (parts.length <= 1) {
    return `${fileName}.${extension}`;
  }

  parts.pop();
  return `${parts.join(".")}.${extension}`;
}
