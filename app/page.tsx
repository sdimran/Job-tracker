"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  Posting,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/supabase";

export default function PostingsPage() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("postings")
      .select("*")
      .order("date_found", { ascending: false });
    if (error) setError(error.message);
    else setPostings(data as Posting[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const roleCategories = useMemo(
    () => Array.from(new Set(postings.map((p) => p.role_category))).sort(),
    [postings]
  );

  const filtered = postings.filter((p) => {
    if (roleFilter !== "all" && p.role_category !== roleFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(s) &&
        !p.company.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  async function updateStatus(id: string, status: ApplicationStatus) {
    const patch: Partial<Posting> = { status };
    const now = new Date().toISOString().slice(0, 10);
    if (status === "applied") patch.date_applied = now;
    if (["phone_screen", "interview"].includes(status)) patch.date_responded = now;
    if (["offer", "rejected", "withdrawn"].includes(status)) patch.date_closed = now;

    setPostings((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    const { error } = await supabase.from("postings").update(patch).eq("id", id);
    if (error) setError(error.message);
  }

  async function updateNotes(id: string, notes: string) {
    setPostings((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)));
    await supabase.from("postings").update({ notes }).eq("id", id);
  }

  if (error) {
    return (
      <div style={{ color: "#ff8a8a", fontSize: 14 }}>
        Couldn&apos;t load postings: {error}. Check that NEXT_PUBLIC_SUPABASE_URL
        and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input
          placeholder="Search title or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All roles</option>
          {roleCategories.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", color: "#9aa3b2", fontSize: 13, alignSelf: "center" }}>
          {loading ? "Loading…" : `${filtered.length} of ${postings.length} postings`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => (
          <div key={p.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</div>
                <div style={{ color: "#9aa3b2", fontSize: 13 }}>
                  {p.company} · {p.location || "—"} · {p.work_type || "—"} · {p.employment_type || "—"}
                  {p.salary_range ? ` · ${p.salary_range}` : ""}
                </div>
              </div>
              <select
                value={p.status}
                onChange={(e) => updateStatus(p.id, e.target.value as ApplicationStatus)}
                className={`status-pill status-${p.status}`}
                style={{ border: "none", cursor: "pointer" }}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {p.description && (
              <div style={{ fontSize: 13, color: "#c7cbd3", marginTop: 8 }}>{p.description}</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              {p.apply_url && (
                <a href={p.apply_url} target="_blank" rel="noreferrer" style={btnPrimary}>
                  Apply →
                </a>
              )}
              {p.linkedin_url ? (
                <a href={p.linkedin_url} target="_blank" rel="noreferrer" style={btnSecondary}>
                  LinkedIn: {p.linkedin_name} {p.linkedin_title ? `(${p.linkedin_title})` : ""} →
                </a>
              ) : (
                <span style={{ ...btnSecondary, opacity: 0.5, cursor: "default" }}>
                  LinkedIn: not found
                </span>
              )}
              <span style={{ color: "#5b6270", fontSize: 12 }}>
                found {p.date_found}
                {p.date_applied ? ` · applied ${p.date_applied}` : ""}
              </span>
            </div>

            <textarea
              placeholder="Notes (interview prep, referral, follow-up date…)"
              defaultValue={p.notes || ""}
              onBlur={(e) => updateNotes(p.id, e.target.value)}
              style={{
                width: "100%",
                marginTop: 10,
                background: "#0f1115",
                border: "1px solid #262b36",
                borderRadius: 6,
                color: "#e8eaed",
                fontSize: 13,
                padding: 8,
                minHeight: 40,
                resize: "vertical",
              }}
            />
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ color: "#9aa3b2", fontSize: 14 }}>No postings match these filters.</div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#171a21",
  border: "1px solid #262b36",
  borderRadius: 6,
  color: "#e8eaed",
  fontSize: 13,
  padding: "8px 10px",
};

const cardStyle: React.CSSProperties = {
  background: "#171a21",
  border: "1px solid #262b36",
  borderRadius: 10,
  padding: 16,
};

const btnPrimary: React.CSSProperties = {
  background: "#6ea8fe",
  color: "#0b1220",
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 6,
  textDecoration: "none",
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: "#6ea8fe",
  border: "1px solid #6ea8fe",
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 6,
  textDecoration: "none",
};
