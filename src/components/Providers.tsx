"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AutoLogoutProvider timeoutMinutes={15} warningSeconds={60}>
        {children}
      </AutoLogoutProvider>
    </SessionProvider>
  );
}
