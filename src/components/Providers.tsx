"use client";

import { SessionProvider } from "next-auth/react";
import { SerwistProvider } from "@serwist/next/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SerwistProvider
        swUrl="/sw.js"
        disable={process.env.NODE_ENV === "development"}
      >
        {children}
      </SerwistProvider>
    </SessionProvider>
  );
}
