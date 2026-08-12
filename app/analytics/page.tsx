"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { supabase, Posting, STATUS_LABELS, STATUS_ORDER } from "@/lib/supabase";

const COLORS = ["#9aa3b2", "#6ea8fe", "#b8a6ff", "#d6a6ff", "#7ee0b5", "#ff8a8a", "#6b7280"];

export default function AnalyticsPage() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("postings")
      .select("*")
      .then(({ data }) => {
        setPostings((data as Posting[]) || []);
        setLoading(false);
      });
  }, []);

  const funnel = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach((s) => (counts[s] = 0));
    postings.forEach((p) => (counts[p.status] = (counts[p.status] || 0) + 1));
    return STATUS_ORDER.map((s) => ({ status: STATUS_LABELS[s], count: counts[s] }));
  }, [postings]);

  const byCompany = useMemo(() => {
    const counts: Record<string, number> = {};
    postings.forEach((p) => (counts[p.company] = (counts[p.company] || 0) + 1));
    return Object.entries(counts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [postings]);

  const byRole = useMemo(() => {
    const counts: Record<string, number> = {};
    postings.forEach((p) => (counts[p.role_category] = (counts[p.role_category] || 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [postings]);

  const overTime = useMemo(() => {
    const counts: Record<string, number> = {};
    postings.forEach((p) => {
      const day = p.date_found;
      counts[day] = (counts[day] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, found]) => ({ date, found }));
  }, [postings]);

  const applied = postings.filter((p) => p.status !== "found").length;
  const responded = postings.filter((p) =>
    ["phone_screen", "interview", "offer", "rejected"].includes(p.status)
  ).length;
  const offers = postings.filter((p) => p.status === "offer").length;
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;

  if (loading) return <div style={{ color: "#9aa3b2" }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Total postings" value={postings.length} />
        <StatCard label="Applied" value={applied} />
        <StatCard label="Response rate" value={`${responseRate}%`} />
        <StatCard label="Offers" value={offers} />
      </div>

      <ChartCard title="Application funnel">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={funnel}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
            <XAxis dataKey="status" stroke="#9aa3b2" fontSize={12} />
            <YAxis stroke="#9aa3b2" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #262b36" }} />
            <Bar dataKey="count" fill="#6ea8fe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Postings found over time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
            <XAxis dataKey="date" stroke="#9aa3b2" fontSize={12} />
            <YAxis stroke="#9aa3b2" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #262b36" }} />
            <Line type="monotone" dataKey="found" stroke="#7ee0b5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <ChartCard title="Postings by role" style={{ flex: "1 1 320px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byRole} dataKey="value" nameKey="name" outerRadius={80} label>
                {byRole.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #262b36" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top companies" style={{ flex: "1 1 320px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCompany} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
              <XAxis type="number" stroke="#9aa3b2" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="company" stroke="#9aa3b2" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #262b36" }} />
              <Bar dataKey="count" fill="#b8a6ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "#171a21", border: "1px solid #262b36", borderRadius: 10,
      padding: "14px 20px", minWidth: 140,
    }}>
      <div style={{ fontSize: 12, color: "#9aa3b2" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#7ee0b5" }}>{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "#171a21", border: "1px solid #262b36", borderRadius: 10,
      padding: 18, ...style,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#9aa3b2", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
