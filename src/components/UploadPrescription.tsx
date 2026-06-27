"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { compressImageForUpload, isImageFile } from "@/lib/compress-image";

interface Member {
  id: string;
  name: string;
}

export function UploadPrescription({
  members,
  defaultMemberId,
}: {
  members: Member[];
  defaultMemberId?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [memberId, setMemberId] = useState(defaultMemberId || members[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  async function uploadFile(file: File) {
    if (!memberId) {
      setError("Please select a family member first");
      return;
    }

    setLoading(true);
    setError("");

    let uploadFile = file;
    try {
      uploadFile = await compressImageForUpload(file);
    } catch {
      uploadFile = file;
    }

    if (uploadFile.size > 4 * 1024 * 1024) {
      setError(
        "Photo is too large after compression. Try a closer shot or lower camera quality."
      );
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("memberId", memberId);

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Upload failed";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          if (res.status === 413) {
            message = "Photo is too large. Try again with a closer shot.";
          }
        }
        throw new Error(message);
      }

      const prescription = await res.json();
      setPreview(null);
      router.push(`/prescriptions/${prescription.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (!isImageFile(file)) {
      setError("Please upload an image file (JPEG, PNG, or HEIC)");
      return;
    }
    setPreview(URL.createObjectURL(file));
    uploadFile(file);
  }

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Upload Prescription
      </h3>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          For family member
        </label>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors",
          dragOver
            ? "border-teal-500 bg-teal-50"
            : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/50"
        )}
        onClick={() => !loading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {loading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-teal-600" />
            <p className="font-medium text-slate-700">
              Uploading & scanning with AI...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Extracting medicines and details
            </p>
          </>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="max-h-40 rounded-lg object-contain"
          />
        ) : (
          <>
            <div className="mb-3 rounded-full bg-teal-100 p-4">
              <Camera className="h-8 w-8 text-teal-600" />
            </div>
            <p className="font-medium text-slate-700">
              Drop prescription photo here
            </p>
            <p className="mt-1 text-sm text-slate-500">
              or click to browse / take a photo
            </p>
            <Button variant="secondary" size="sm" className="mt-4" type="button">
              <Upload className="h-4 w-4" />
              Choose Image
            </Button>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
