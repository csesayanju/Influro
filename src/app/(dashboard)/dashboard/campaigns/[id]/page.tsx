import { InfluencerRow } from "@/features/influencers/components/influencer-row";
import { getInfluencersByCampaign } from "@/features/influencers/queries";
import { getCampaignById } from "@/features/campaigns/queries";
import { getBrandByUserId } from "@/features/brands/queries";
import { campaignDetailRoute, newInfluencerRoute, routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import styles from "../../dashboard-theme.module.css";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: brand } = await getBrandByUserId(user.id);
  if (!brand) redirect(routes.dashboard);

  const { data: campaign } = await getCampaignById(params.id, brand.id);
  if (!campaign) notFound();

  const { data: influencers } = await getInfluencersByCampaign(
    campaign.id,
    brand.id
  );

  const flash = one(searchParams?.added)
    ? "Influencer added."
    : one(searchParams?.updated)
    ? "Influencer updated."
    : one(searchParams?.deleted)
    ? "Influencer removed."
    : null;

  const errorMsg = one(searchParams?.error);

  return (
    <main className={styles.page}>
      <div className={styles.cardWide}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className={styles.campaignHead}>
          <div>
            <h1 className={styles.title}>{campaign.name}</h1>
            <p className={styles.text}>
              {campaign.platform ? `${campaign.platform} · ` : ""}
              Budget: ₹{campaign.budget.toLocaleString("en-IN")}
              {campaign.start_date ? ` · ${campaign.start_date}` : ""}
              {campaign.end_date ? ` → ${campaign.end_date}` : ""}
            </p>
          </div>
          <span
            className={
              campaign.status === "active"
                ? `${styles.badge} ${styles.badgeActive}`
                : campaign.status === "completed"
                ? `${styles.badge} ${styles.badgeCompleted}`
                : styles.badge
            }
          >
            {campaign.status}
          </span>
        </div>

        <div className={styles.actions}>
          <Link href={routes.campaigns} className={styles.linkBtn}>
            ← Campaigns
          </Link>
          <Link
            href={`${routes.campaigns}/${campaign.id}/edit`}
            className={styles.linkBtn}
          >
            Edit campaign
          </Link>
          <Link
            href={newInfluencerRoute(campaign.id)}
            className={styles.primaryBtn}
          >
            + Add influencer
          </Link>
        </div>

        {/* ── Destination URL notice ──────────────────────────────── */}
        {campaign.destination_url ? (
          <p className={styles.text} style={{ marginTop: 12 }}>
            Tracking destination:{" "}
            <span className={styles.textStrong}>{campaign.destination_url}</span>
          </p>
        ) : (
          <p className={styles.text} style={{ marginTop: 12 }}>
            No destination URL set.{" "}
            <Link
              href={`${routes.campaigns}/${campaign.id}/edit`}
              className={styles.linkBtn}
              style={{ display: "inline", padding: 0, border: "none", background: "none", fontSize: 13 }}
            >
              Add one in Edit campaign →
            </Link>
          </p>
        )}

        {/* ── Flash / error ───────────────────────────────────────── */}
        {flash && (
          <p
            style={{
              marginTop: 14,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.25)",
              color: "var(--influro-cyan)",
              fontSize: 13,
            }}
          >
            {flash}
          </p>
        )}
        {errorMsg && (
          <p
            style={{
              marginTop: 14,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              fontSize: 13,
            }}
          >
            {decodeURIComponent(errorMsg)}
          </p>
        )}

        {/* ── Influencer table ─────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Influencers</h2>
          <p className={styles.sectionSub}>
            {influencers?.length
              ? `${influencers.length} influencer${influencers.length === 1 ? "" : "s"} in this campaign`
              : "No influencers yet. Add one to start tracking."}
          </p>

          {influencers && influencers.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Handle</th>
                  <th>Platform</th>
                  <th className="numCol">Followers</th>
                  <th className="numCol">Agreed fee</th>
                  <th className="numCol">Clicks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((inf) => (
                  <InfluencerRow
                    key={inf.id}
                    influencer={inf as Parameters<typeof InfluencerRow>[0]["influencer"]}
                    campaignId={campaign.id}
                    brandId={brand.id}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.empty}>
              No influencers yet —{" "}
              <Link href={newInfluencerRoute(campaign.id)} className={styles.linkBtn}
                style={{ display: "inline", padding: 0, border: "none", background: "none", fontSize: 13 }}>
                add the first one →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
