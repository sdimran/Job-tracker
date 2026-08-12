import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Personal job search tracker and analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
          <nav style={{ display: "flex", gap: 20, alignItems: "baseline", marginBottom: 28 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Job Tracker</span>
            <Link href="/" style={{ color: "#9aa3b2", fontSize: 14 }}>Postings</Link>
            <Link href="/analytics" style={{ color: "#9aa3b2", fontSize: 14 }}>Analytics</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
