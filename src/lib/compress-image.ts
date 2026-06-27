const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "" && IMAGE_EXTENSIONS.test(file.name)) return true;
  return false;
}

function enhanceCanvasForOcr(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    const contrast = 1.25;
    const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));

    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Prepare camera photos for OCR: light enhancement, high resolution, under Vercel's ~4.5MB limit.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 3200;
  const maxHeight = options?.maxHeight ?? 3200;
  const quality = options?.quality ?? 0.95;

  if (file.size <= 2_500_000 && file.type === "image/jpeg") {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxHeight / bitmap.height
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    enhanceCanvasForOcr(ctx, width, height);

    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (blob && blob.size > 4 * 1024 * 1024) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.85);
      });
    }

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "prescription";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
