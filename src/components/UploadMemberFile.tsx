"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { compressImageForUpload, isImageFile } from "@/lib/compress-image";

interface Member {
  id: string;
  name: string;
}

interface SelectField {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

interface UploadMemberFileProps {
  title: string;
  endpoint: string;
  members: Member[];
  defaultMemberId?: string;
  accept?: string;
  compressImages?: boolean;
  loadingMessage: string;
  loadingHint?: string;
  redirectBasePath: string;
  extraFields?: SelectField[];
  optionalTitle?: boolean;
  optionalNotes?: boolean;
}

export function UploadMemberFile({
  title,
  endpoint,
  members,
  defaultMemberId,
  accept = "image/*",
  compressImages = true,
  loadingMessage,
  loadingHint,
  redirectBasePath,
  extraFields = [],
  optionalTitle = false,
  optionalNotes = false,
}: UploadMemberFileProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [memberId, setMemberId] = useState(defaultMemberId || members[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      extraFields.map((field) => [field.name, field.defaultValue ?? field.options[0]?.value ?? ""])
    )
  );

  async function uploadFile(file: File) {
    if (!memberId) {
      setError("Please select a family member first");
      return;
    }

    setLoading(true);
    setError("");

    let uploadTarget = file;
    if (compressImages && isImageFile(file)) {
      try {
        uploadTarget = await compressImageForUpload(file);
      } catch {
        uploadTarget = file;
      }

      if (uploadTarget.size > 4 * 1024 * 1024) {
        setError(
          "Photo is too large after compression. Try a closer shot or lower camera quality."
        );
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append("file", uploadTarget);
    formData.append("memberId", memberId);
    if (optionalTitle && titleValue.trim()) {
      formData.append("title", titleValue.trim());
    }
    if (optionalNotes && notes.trim()) {
      formData.append("notes", notes.trim());
    }
    for (const field of extraFields) {
      formData.append(field.name, fieldValues[field.name] ?? "");
    }

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const result = await res.json();
      setPreview(null);
      setTitleValue("");
      setNotes("");
      router.push(`${redirectBasePath}/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const acceptsImage = accept.includes("image");
    const acceptsPdf = accept.includes("pdf");
    const valid =
      (acceptsImage && isImageFile(file)) ||
      (acceptsPdf && (file.type === "application/pdf" || file.name.endsWith(".pdf")));

    if (!valid) {
      setError("Please upload a supported file type");
      return;
    }

    if (isImageFile(file)) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
    void uploadFile(file);
  }

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>

      <div className="mb-4">
        <Label htmlFor="upload-member">For family member</Label>
        <select
          id="upload-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {extraFields.map((field) => (
        <div key={field.name} className="mb-4">
          <Label htmlFor={field.name}>{field.label}</Label>
          <select
            id={field.name}
            value={fieldValues[field.name]}
            onChange={(e) =>
              setFieldValues((current) => ({
                ...current,
                [field.name]: e.target.value,
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {optionalTitle && (
        <div className="mb-4">
          <Label htmlFor="upload-title">Title (optional)</Label>
          <Input
            id="upload-title"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            placeholder="e.g. Hospital bill March 2026"
            className="mt-1.5"
          />
        </div>
      )}

      {optionalNotes && (
        <div className="mb-4">
          <Label htmlFor="upload-notes">Notes (optional)</Label>
          <Input
            id="upload-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details"
            className="mt-1.5"
          />
        </div>
      )}

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
          accept={accept}
          capture={accept.includes("image") ? "environment" : undefined}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {loading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-teal-600" />
            <p className="font-medium text-slate-700">{loadingMessage}</p>
            {loadingHint && (
              <p className="mt-1 text-sm text-slate-500">{loadingHint}</p>
            )}
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
            <p className="font-medium text-slate-700">Drop file here</p>
            <p className="mt-1 text-sm text-slate-500">
              or click to browse / take a photo
            </p>
            <Button variant="secondary" size="sm" className="mt-4" type="button">
              <Upload className="h-4 w-4" />
              Choose file
            </Button>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
