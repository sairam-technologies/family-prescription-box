"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { isPdfFile } from "@/lib/file-types";
import { cn } from "@/lib/utils";

interface MemberFileViewerProps {
  src: string;
  alt: string;
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function MemberFileViewer({
  src,
  alt,
  mimeType,
  fileName,
  className,
  imageClassName = "object-contain",
  priority,
}: MemberFileViewerProps) {
  const isPdf = isPdfFile(mimeType, fileName || src);

  if (isPdf) {
    return (
      <div className={className}>
        <iframe
          src={src}
          title={alt}
          className="h-[70vh] w-full border-0"
        />
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="mb-2 text-xs text-slate-500">
            PDF preview may not work on all mobile browsers.
          </p>
          <Link
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Open PDF
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[3/4] w-full bg-slate-100 ${className ?? ""}`}>
      <PrescriptionImage
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority={priority}
      />
    </div>
  );
}

export function MemberFileThumbnail({
  src,
  alt,
  mimeType,
  fileName,
  className,
}: {
  src: string;
  alt: string;
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
}) {
  const isPdf = isPdfFile(mimeType, fileName || src);

  if (isPdf) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 ${className ?? ""}`}
      >
        <FileText className="h-8 w-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className ?? ""}`}>
      <PrescriptionImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="64px"
      />
    </div>
  );
}
