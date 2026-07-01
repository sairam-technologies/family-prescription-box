import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-slate-100 p-4">
          <WifiOff className="h-8 w-8 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">You&apos;re offline</h1>
        <p className="mt-2 text-slate-600">
          RxBox needs an internet connection for uploads and AI scanning. Cached
          pages may still be available when you go back online.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
