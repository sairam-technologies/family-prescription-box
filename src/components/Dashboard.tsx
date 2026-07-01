"use client";

import Link from "next/link";
import { Users, FileText, Pill, Copy, Check, Share2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMemberSubtitle } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";
import { buildFamilyInviteUrl } from "@/lib/invite-links";

const WHATSAPP_PHONE_PREFIX = "+91 ";

interface DashboardHeaderProps {
  familyName: string;
  inviteCode: string;
  appBaseUrl: string;
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
  appBaseUrl,
  userName,
  isPrimary,
  stats,
}: DashboardHeaderProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(WHATSAPP_PHONE_PREFIX);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  function handlePhoneChange(value: string) {
    setPhoneError("");
    setPhoneSuccess("");

    if (!value || value.length < WHATSAPP_PHONE_PREFIX.length) {
      setPhoneNumber(WHATSAPP_PHONE_PREFIX);
      return;
    }

    if (!value.startsWith("+91")) {
      const digits = value.replace(/\D/g, "").replace(/^91/, "");
      setPhoneNumber(`${WHATSAPP_PHONE_PREFIX}${digits}`);
      return;
    }

    setPhoneNumber(value);
  }

  const inviteUrl = buildFamilyInviteUrl(appBaseUrl, inviteCode);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function sendWhatsAppInvite() {
    setPhoneError("");
    setPhoneSuccess("");
    setSendingInvite(true);

    try {
      const res = await fetch("/api/invites/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPhoneError(data.error || "Failed to send WhatsApp invite");
        return;
      }

      setPhoneSuccess("Invite sent on WhatsApp");
      setPhoneNumber(WHATSAPP_PHONE_PREFIX);
    } catch {
      setPhoneError("Failed to send WhatsApp invite");
    } finally {
      setSendingInvite(false);
    }
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
        <Card className="bg-teal-50/50 py-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Family invite
                </p>
                <p className="font-mono text-lg font-bold text-teal-700">
                  {inviteCode}
                </p>
                <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                  {inviteUrl}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={copyCode}>
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedCode ? "Copied" : "Copy code"}
                </Button>
                <Button variant="secondary" size="sm" onClick={copyInviteLink}>
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {copiedLink ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>

            <div className="border-t border-teal-100 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Send invite on WhatsApp
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  placeholder="9876543210"
                  className="bg-white sm:max-w-xs"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void sendWhatsAppInvite();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => void sendWhatsAppInvite()}
                  disabled={sendingInvite}
                >
                  {sendingInvite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {sendingInvite ? "Sending..." : "Send invite"}
                </Button>
              </div>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              )}
              {phoneSuccess && (
                <p className="mt-2 text-sm text-green-700">{phoneSuccess}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Sends the invite directly on WhatsApp using your Business API
                account — no chat window opens.
              </p>
            </div>
          </div>
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
