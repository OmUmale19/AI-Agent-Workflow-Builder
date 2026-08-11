"use client";

import React from "react";
import { NhostClient, NhostProvider as BaseNhostProvider } from "@nhost/react";

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "local";
const region = process.env.NEXT_PUBLIC_NHOST_REGION || (subdomain !== "local" ? "ap-south-1" : undefined);

const nhost = new NhostClient({
  subdomain,
  ...(region ? { region } : {}),
});

export function NhostProvider({ children }: { children: React.ReactNode }) {
  return <BaseNhostProvider nhost={nhost}>{children}</BaseNhostProvider>;
}
