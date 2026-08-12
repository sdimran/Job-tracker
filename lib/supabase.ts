import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // This only throws at build/runtime if env vars are missing — set them in
  // .env.local (dev) or your Vercel project settings (production).
  console.warn(
    "Supabase env vars are missing. Copy .env.local.example to .env.local and fill them in."
  );
}

export const supabase = createClient(url, anonKey);

export type ApplicationStatus =
  | "found"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface Posting {
  id: string;
  role_category: string;
  title: string;
  company: string;
  location: string | null;
  work_type: string | null;
  employment_type: string | null;
  salary_range: string | null;
  description: string | null;
  apply_url: string | null;
  linkedin_name: string | null;
  linkedin_title: string | null;
  linkedin_url: string | null;
  source: string | null;
  date_found: string;
  status: ApplicationStatus;
  date_applied: string | null;
  date_responded: string | null;
  date_closed: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  found: "Found",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "found",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];
