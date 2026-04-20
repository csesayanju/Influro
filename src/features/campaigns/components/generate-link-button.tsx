"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/(dashboard)/dashboard/dashboard-theme.module.css";

type Props = {
  campaignId: string;
  influencerId: string;
  existingTrackingUrl?: string | null;
};

export function GenerateLinkButton({
  campaignId,
  influencerId,
  existingTrackingUrl,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(
    existingTrackingUrl ?? null
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in again.");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!baseUrl) {
        setError("Missing Supabase URL configuration.");
        return;
      }

      const res = await fetch(`${baseUrl}/functions/v1/generate-utm-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          influencer_id: influencerId,
        }),
      });

      const json = (await res.json()) as
        | { tracking_url: string; full_url: string; click_count: number }
        | { error: string };

      if (!res.ok) {
        const msg =
          "error" in json ? json.error : "Failed to generate tracking link.";
        setError(msg);
        return;
      }

      if ("tracking_url" in json) {
        setTrackingUrl(json.tracking_url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — select and copy manually.");
    }
  }

  if (trackingUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <code
          title={trackingUrl}
          style={{
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 11,
            color: "var(--influro-text-sub)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "4px 6px",
          }}
        >
          {trackingUrl}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.btnSmall}
          aria-label="Copy tracking link"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        {error && (
          <span
            role="alert"
            style={{ fontSize: 11, color: "#fca5a5" }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className={styles.btnSmall}
        aria-label="Generate tracking link"
      >
        {loading ? "Generating…" : "Generate link"}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: 11, color: "#fca5a5" }}>
          {error}
        </span>
      )}
    </div>
  );
}
