import Link from "next/link";
import { Pill, Upload, Users, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-teal-600 p-2">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">RxBox</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700">
            <Sparkles className="h-4 w-4" />
            AI-powered prescription scanning
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Your family&apos;s prescriptions, organized and searchable
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Upload prescription photos, let AI extract medicines and doctor
            details, and share everything with your family on one dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Create family account</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Join existing family
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              title: "Shared family dashboard",
              desc: "Every family member logs in and sees the same prescriptions and data.",
            },
            {
              icon: Upload,
              title: "Photo upload",
              desc: "Snap or upload prescription images for each family member.",
            },
            {
              icon: Sparkles,
              title: "AI medicine extraction",
              desc: "Automatically reads medicines, dosage, doctor name, and dates.",
            },
            {
              icon: Search,
              title: "Global search",
              desc: "Find any medicine, doctor, or prescription across your family.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-xl bg-teal-50 p-3">
                <feature.icon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
