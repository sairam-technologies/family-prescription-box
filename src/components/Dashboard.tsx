"use client";

import Link from "next/link";
import { Users, FileText, Pill, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMemberSubtitle } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";

interface DashboardHeaderProps {
  familyName: string;
  inviteCode: string;
  userName: string;
  isPrimary?: boolean;
  stats: {
    members: number;
    prescriptions: number;
    medicines: number;
  };
}

export function DashboardHeader({
  familyName,
  inviteCode,
  userName,
  isPrimary,
  stats,
}: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-600">Welcome back</p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {familyName}
          </h1>
          <p className="mt-1 text-slate-500">
            Signed in as {userName}
            {isPrimary && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Primary
              </span>
            )}
            {" · "}Shared family dashboard
          </p>
        </div>
        <Card className="flex items-center gap-3 bg-teal-50/50 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Family invite code
            </p>
            <p className="font-mono text-lg font-bold text-teal-700">
              {inviteCode}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={copyCode}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.members}</p>
            <p className="text-sm text-slate-500">Family members</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-xl bg-teal-50 p-3">
            <FileText className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.prescriptions}
            </p>
            <p className="text-sm text-slate-500">Prescriptions</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-xl bg-violet-50 p-3">
            <Pill className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.medicines}
            </p>
            <p className="text-sm text-slate-500">Medicines tracked</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface MemberCardProps {
  id: string;
  name: string;
  relationship?: string | null;
  dateOfBirth?: Date | string | null;
  prescriptionCount: number;
  canDelete?: boolean;
}

export function MemberCard({
  id,
  name,
  relationship,
  dateOfBirth,
  prescriptionCount,
  canDelete,
}: MemberCardProps) {
  return (
    <Card className="group transition-all hover:border-teal-200 hover:shadow-md">
      <div className="flex items-center gap-4">
        <Link href={`/members/${id}`} className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-lg font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="group-hover:text-teal-700">{name}</CardTitle>
            <p className="text-sm text-slate-500">
              {formatMemberSubtitle(relationship, dateOfBirth)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-slate-900">
              {prescriptionCount}
            </p>
            <p className="text-xs text-slate-500">prescriptions</p>
          </div>
        </Link>
        {canDelete && (
          <DeleteMemberButton memberId={id} memberName={name} />
        )}
      </div>
    </Card>
  );
}
