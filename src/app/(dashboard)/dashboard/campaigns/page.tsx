import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  archiveCampaignAction,
  createCampaignAction,
  deleteCampaignAction,
  restoreCampaignAction,
} from "@/features/campaigns/actions";
import { CampaignCard } from "@/features/campaigns/components/campaign-card";
import { CampaignForm } from "@/features/campaigns/components/campaign-form";
import { getActiveCampaigns, getArchivedCampaigns } from "@/features/campaigns/queries";
import { ensureBrandProfile } from "@/features/brands/actions";
import { getBrandByUserId } from "@/features/brands/queries";
import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "../dashboard-theme.module.css";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CampaignsPage({ searchParams }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const ensured = await ensureBrandProfile();
  if ("error" in ensured) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.dangerText}>Could not set up brand profile: {ensured.error}</p>
        </div>
      </main>
    );
  }

  const { data: brand } = await getBrandByUserId(user.id);
  if (!brand) redirect(routes.dashboard);

  const [{ data: campaigns }, { data: archivedCampaigns }] = await Promise.all([
    getActiveCampaigns(brand.id),
    getArchivedCampaigns(brand.id),
  ]);

  const created  = one(searchParams?.created)  === "1";
  const updated  = one(searchParams?.updated)  === "1";
  const deleted  = one(searchParams?.deleted)  === "1";
  const archived = one(searchParams?.archived) === "1";
  const restored = one(searchParams?.restored) === "1";
  const error    = one(searchParams?.error);
  const formKey  = one(searchParams?.t) ?? "base";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Campaigns</h1>
        <p className={styles.text}>
          Manage campaigns for <span className={styles.textStrong}>{brand.name}</span>
        </p>
        <div className={styles.actions}>
          <Link href={routes.dashboard} className={styles.linkBtn}>Back to dashboard</Link>
        </div>

        {created  ? <p className={styles.text}>Campaign created successfully.</p>   : null}
        {updated  ? <p className={styles.text}>Campaign updated successfully.</p>   : null}
        {deleted  ? <p className={styles.text}>Campaign permanently deleted.</p>    : null}
        {archived ? <p className={styles.text}>Campaign archived.</p>               : null}
        {restored ? <p className={styles.text}>Campaign restored.</p>               : null}
        {error    ? <p className={styles.dangerText}>{decodeURIComponent(error)}</p> : null}

        {/* ── Create ───────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create campaign</h2>
          <p className={styles.sectionSub}>Add a campaign with budget, platform, and status.</p>
          <CampaignForm action={createCampaignAction} submitLabel="Create campaign" formKey={formKey} />
        </section>

        {/* ── Active list ──────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campaign list</h2>
          {campaigns && campaigns.length > 0 ? (
            <div className={styles.list}>
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No campaigns yet. Create your first campaign above.</p>
          )}
        </section>

        {/* ── Archived list ────────────────────────────────────── */}
        {archivedCampaigns && archivedCampaigns.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Archived</h2>
            <p className={styles.sectionSub}>
              Restore to reactivate or delete permanently.
            </p>
            <div className={styles.list}>
              {archivedCampaigns.map((campaign) => (
                <article key={campaign.id} className={`${styles.campaignCard} ${styles.campaignCardArchived}`}>
                  <div className={styles.campaignHead}>
                    <div>
                      <p className={styles.campaignName}>{campaign.name}</p>
                      <p className={styles.campaignMeta}>
                        slug: {campaign.slug} · budget: INR {campaign.budget}
                        {campaign.platform ? ` · ${campaign.platform}` : ""}
                      </p>
                    </div>
                    <span className={styles.badge}>archived</span>
                  </div>
                  <div className={styles.rowActions}>
                    <form action={restoreCampaignAction}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <button type="submit" className={styles.btnSmall}>Restore</button>
                    </form>
                    <form action={deleteCampaignAction}>
                      <input type="hidden" name="returnTo" value={routes.campaigns} />
                      <input type="hidden" name="id" value={campaign.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        className={`${styles.btnSmall} ${styles.btnDanger}`}
                        confirmMessage="Permanently delete this campaign? This cannot be undone."
                      >
                        Delete permanently
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
