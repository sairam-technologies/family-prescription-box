"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Pill, FileText, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.type === "member" && result.memberId) {
      router.push(`/members/${result.memberId}`);
    } else if (result.prescriptionId) {
      router.push(`/prescriptions/${result.prescriptionId}`);
    }
  }

  const icons = {
    medicine: Pill,
    prescription: FileText,
    member: User,
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search medicines, doctors, prescriptions..."
          className="pl-10"
        />
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No results found
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {results.map((result) => {
                  const Icon = icons[result.type];
                  return (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(result)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div className="mt-0.5 rounded-lg bg-teal-50 p-2">
                          <Icon className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">
                            {result.title}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {result.subtitle}
                          </p>
                          <p className="text-xs text-teal-600">
                            {result.memberName}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
