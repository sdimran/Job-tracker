"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  Posting,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_ORDER,
  ROLE_CATEGORIES,
} from "@/lib/supabase";

interface ManualDraft {
  apply_url: string;
  title: string;
  company: string;
  location: string;
  role_category: string;
}

export default function PostingsPage() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [manualDraft, setManualDraft] = useState<ManualDraft | null>(null);

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

  async function updateRoleCategory(id: string, role_category: string) {
    setPostings((prev) => prev.map((p) => (p.id === id ? { ...p, role_category } : p)));
    await supabase.from("postings").update({ role_category }).eq("id", id);
  }

  async function handleAddFromLinkedIn(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedinUrl.trim() || adding) return;
    setAdding(true);
    setAddError(null);
    setManualDraft(null);
    try {
      const res = await fetch("/api/parse-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Something went wrong.");
        if (data.needsManualEntry) {
          setManualDraft({
            apply_url: data.canonicalUrl || linkedinUrl.trim(),
            title: "",
            company: "",
            location: "",
            role_category: "Product Manager",
          });
        }
        return;
      }
      setPostings((prev) => [data.posting as Posting, ...prev]);
      setLinkedinUrl("");
    } catch {
      setAddError("Network error — check your connection and try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!manualDraft) return;
    const { data, error } = await supabase
      .from("postings")
      .insert({
        role_category: manualDraft.role_category,
        title: manualDraft.title,
        company: manualDraft.company,
        location: manualDraft.location || null,
        apply_url: manualDraft.apply_url,
        source: "LinkedIn",
        date_found: new Date().toISOString().slice(0, 10),
        status: "found",
      })
      .select()
      .single();
    if (error) {
      setAddError(error.message);
      return;
    }
    setPostings((prev) => [data as Posting, ...prev]);
    setManualDraft(null);
    setAddError(null);
    setLinkedinUrl("");
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
      <form
        onSubmit={handleAddFromLinkedIn}
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}
      >
        <input
          placeholder="Paste a LinkedIn job link…"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          style={{ ...inputStyle, flex: "1 1 320px" }}
        />
        <button
          type="submit"
          disabled={adding || !linkedinUrl.trim()}
          style={{
            ...btnPrimary,
            border: "none",
            cursor: adding || !linkedinUrl.trim() ? "default" : "pointer",
            opacity: adding || !linkedinUrl.trim() ? 0.6 : 1,
          }}
        >
          {adding ? "Adding…" : "Add from LinkedIn"}
        </button>
      </form>

      {addError && (
        <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 12 }}>{addError}</div>
      )}

      {manualDraft && (
        <form
          onSubmit={handleManualAdd}
          style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}
        >
          <div style={{ fontSize: 13, color: "#9aa3b2" }}>
            Couldn&apos;t auto-fill everything for {manualDraft.apply_url} — fill in the rest:
          </div>
          <input
            required
            placeholder="Job title"
            value={manualDraft.title}
            onChange={(e) => setManualDraft({ ...manualDraft, title: e.target.value })}
            style={inputStyle}
          />
          <input
            required
            placeholder="Company"
            value={manualDraft.company}
            onChange={(e) => setManualDraft({ ...manualDraft, company: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Location"
            value={manualDraft.location}
            onChange={(e) => setManualDraft({ ...manualDraft, location: e.target.value })}
            style={inputStyle}
          />
          <select
            value={manualDraft.role_category}
            onChange={(e) => setManualDraft({ ...manualDraft, role_category: e.target.value })}
            style={inputStyle}
          >
            {ROLE_CATEGORIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={{ ...btnPrimary, border: "none", cursor: "pointer" }}>
              Save posting
            </button>
            <button
              type="button"
              onClick={() => {
                setManualDraft(null);
                setAddError(null);
              }}
              style={{ ...btnSecondary, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
                  {p.source ? ` · via ${p.source}` : ""}
                </div>
                <select
                  value={p.role_category}
                  onChange={(e) => updateRoleCategory(p.id, e.target.value)}
                  style={{
                    ...inputStyle,
                    marginTop: 6,
                    padding: "3px 6px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {ROLE_CATEGORIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  {!ROLE_CATEGORIES.includes(p.role_category as any) && (
                    <option value={p.role_category}>{p.role_category}</option>
                  )}
                </select>
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
