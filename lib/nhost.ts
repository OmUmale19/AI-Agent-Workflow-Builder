import { createClient } from "@nhost/nhost-js";

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "local";
const region = process.env.NEXT_PUBLIC_NHOST_REGION || (subdomain !== "local" ? "ap-south-1" : undefined);

export const nhost = createClient({
  subdomain,
  ...(region ? { region } : {}),
});