"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Pill, FileText, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: SearchResult) {
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

  const grouped = {
    medicine: results.filter((r) => r.type === "medicine"),
    prescription: results.filter((r) => r.type === "prescription"),
    member: results.filter((r) => r.type === "member"),
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Global Search</h1>
      <p className="mb-8 text-slate-600">
        Search across all medicines, prescriptions, doctors, and family members
      </p>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search medicines, doctors, diagnoses..."
          className="py-3 pl-12 text-base"
          autoFocus
        />
      </div>

      {loading && (
        <p className="text-center text-slate-500">Searching...</p>
      )}

      {!loading && searched && results.length === 0 && (
        <Card className="text-center text-slate-500">
          No results found for &ldquo;{query}&rdquo;
        </Card>
      )}

      <div className="space-y-8">
        {(["medicine", "prescription", "member"] as const).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const Icon = icons[type];
          const titles = {
            medicine: "Medicines",
            prescription: "Prescriptions",
            member: "Family Members",
          };

          return (
            <div key={type}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Icon className="h-4 w-4" />
                {titles[type]} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full text-left"
                  >
                    <Card
                      className={cn(
                        "transition-all hover:border-teal-200 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-slate-900">
                        {result.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        {result.subtitle}
                      </p>
                      <p className="mt-1 text-xs text-teal-600">
                        {result.memberName}
                      </p>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
