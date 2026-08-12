import { NextResponse } from "next/server";
import { supabase, ROLE_CATEGORIES } from "@/lib/supabase";

// Accepts either a canonical /jobs/view/<id> link or a /jobs/search?currentJobId=<id>
// link (what's in the address bar when you click a job from search results) and
// returns a clean canonical URL, or null if it's not a LinkedIn job link at all.
function normalizeLinkedInJobUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!/(^|\.)linkedin\.com$/i.test(u.hostname)) return null;

  const viewMatch = u.pathname.match(/\/jobs\/view\/(?:[\w%-]*-)?(\d+)/i);
  if (viewMatch) return `https://www.linkedin.com/jobs/view/${viewMatch[1]}/`;

  const currentJobId = u.searchParams.get("currentJobId");
  if (currentJobId && /^\d+$/.test(currentJobId)) {
    return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
  }
  return null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  const withBreaks = html.replace(/<\/(p|li|div|br)>/gi, "\n").replace(/<li>/gi, "- ");
  const text = withBreaks.replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(text).replace(/\n{3,}/g, "\n\n").trim();
}

// LinkedIn job pages embed a schema.org JobPosting block as JSON-LD for SEO —
// this is the same public data Google for Jobs / link-preview bots read, so it's
// usually present even when the rest of the page is gated behind a login wall.
function extractJsonLdJobPosting(html: string): any | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1].trim());
      const candidates: any[] = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const c of candidates) {
        const types = Array.isArray(c?.["@type"]) ? c["@type"] : [c?.["@type"]];
        if (types.includes("JobPosting")) return c;
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return null;
}

// Fallback for when JSON-LD isn't present: Open Graph tags, which LinkedIn serves
// so link-preview unfurlers (Slack, iMessage, etc.) can show a card. Title is
// formatted like "<Company> hiring <Title> in <Location> | LinkedIn".
function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re = /<meta\s+([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const propMatch = attrs.match(/(?:property|name)=["']([^"']+)["']/i);
    const contentMatch = attrs.match(/content=["']([^"']*)["']/i);
    if (propMatch && contentMatch) tags[propMatch[1]] = decodeHtmlEntities(contentMatch[1]);
  }
  return tags;
}

function mapEmploymentType(v: unknown): string | null {
  const val = Array.isArray(v) ? v[0] : v;
  if (typeof val !== "string") return null;
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACTOR: "Contract",
    TEMPORARY: "Contract",
    INTERN: "Internship",
    VOLUNTEER: "Volunteer",
  };
  return map[val] ?? null;
}

function guessRoleCategory(title: string): (typeof ROLE_CATEGORIES)[number] {
  const t = title.toLowerCase();
  if (/agile coach|scrum master/.test(t)) return "Agile Coach";
  if (/product owner/.test(t)) return "Product Owner";
  if (/product/.test(t) && /\bai\b|artificial intelligence|machine learning|\bml\b/.test(t)) {
    return "AI Product Manager";
  }
  return "Product Manager";
}

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "Paste a LinkedIn job link first." }, { status: 400 });
  }

  const canonicalUrl = normalizeLinkedInJobUrl(rawUrl);
  if (!canonicalUrl) {
    return NextResponse.json(
      { error: "That doesn't look like a LinkedIn job link (expected linkedin.com/jobs/view/…)." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("postings")
    .select("id")
    .eq("apply_url", canonicalUrl)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "This job is already in your tracker." }, { status: 409 });
  }

  let html: string;
  try {
    const res = await fetch(canonicalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`LinkedIn returned ${res.status}`);
    html = await res.text();
  } catch {
    return NextResponse.json(
      {
        error: "Couldn't reach that LinkedIn page. Add the details manually.",
        needsManualEntry: true,
        canonicalUrl,
      },
      { status: 502 }
    );
  }

  const jobPosting = extractJsonLdJobPosting(html);
  const meta = extractMetaTags(html);

  let title = "";
  let company = "";
  let location = "";
  let description = "";
  let employment_type: string | null = null;
  let work_type: string | null = null;
  let salary_range: string | null = null;

  if (jobPosting) {
    title = jobPosting.title || "";
    company = jobPosting.hiringOrganization?.name || "";
    const addr = jobPosting.jobLocation?.address ?? jobPosting.jobLocation?.[0]?.address;
    if (addr) {
      location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(", ");
    }
    description = stripHtml(jobPosting.description || "").slice(0, 2000);
    employment_type = mapEmploymentType(jobPosting.employmentType);
    if (jobPosting.jobLocationType === "TELECOMMUTE") work_type = "Remote";
    const salaryValue = jobPosting.baseSalary?.value;
    if (salaryValue) {
      const currency = jobPosting.baseSalary.currency || "";
      if (salaryValue.minValue && salaryValue.maxValue) {
        salary_range = `${currency} ${Math.round(salaryValue.minValue).toLocaleString()}–${Math.round(
          salaryValue.maxValue
        ).toLocaleString()}`.trim();
      } else if (salaryValue.value) {
        salary_range = `${currency} ${Math.round(salaryValue.value).toLocaleString()}`.trim();
      }
    }
  }

  if (!title || !company) {
    const ogTitle = meta["og:title"] || "";
    const match = ogTitle.match(/^(.*?)\s+hiring\s+(.*?)\s+in\s+(.*?)(?:\s*\|\s*LinkedIn)?$/i);
    if (match) {
      company = company || match[1].trim();
      title = title || match[2].trim();
      location = location || match[3].trim();
    }
    if (!description && meta["og:description"]) description = meta["og:description"];
  }

  if (!title || !company) {
    return NextResponse.json(
      {
        error: "Couldn't auto-extract this posting — LinkedIn may be gating it. Add the details manually.",
        needsManualEntry: true,
        canonicalUrl,
      },
      { status: 422 }
    );
  }

  if (!work_type && /\bremote\b/i.test(`${location} ${title}`)) {
    work_type = "Remote";
  }

  const row = {
    role_category: guessRoleCategory(title),
    title,
    company,
    location: location || null,
    work_type,
    employment_type,
    salary_range,
    description: description || null,
    apply_url: canonicalUrl,
    source: "LinkedIn",
    date_found: new Date().toISOString().slice(0, 10),
    status: "found" as const,
  };

  const { data, error } = await supabase.from("postings").insert(row).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posting: data });
}
