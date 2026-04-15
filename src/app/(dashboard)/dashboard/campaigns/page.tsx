import {
  archiveCampaignAction,
  createCampaignAction,
  deleteCampaignAction,
  restoreCampaignAction,
  setCampaignStatusAction,
} from "@/lib/actions/campaigns";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { ensureBrandProfile } from "@/lib/actions/brands";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import styles from "../dashboard-theme.module.css";

function statusClass(status: string) {
  if (status === "active") return `${styles.badge} ${styles.badgeActive}`;
  if (status === "completed") return `${styles.badge} ${styles.badgeCompleted}`;
  return styles.badge;
}

type CampaignsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const ensured = await ensureBrandProfile();
  if ("error" in ensured) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.dangerText}>
            Could not set up brand profile: {ensured.error}
          </p>
        </div>
      </main>
    );
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect(routes.dashboard);

  const [{ data: campaigns }, { data: archivedCampaigns }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, slug, budget, status, platform, start_date, end_date")
      .eq("brand_id", brand.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id, name, slug, budget, status, platform, archived_at")
      .eq("brand_id", brand.id)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
  ]);

  const created = one(searchParams?.created) === "1";
  const updated = one(searchParams?.updated) === "1";
  const deleted = one(searchParams?.deleted) === "1";
  const archived = one(searchParams?.archived) === "1";
  const restored = one(searchParams?.restored) === "1";
  const error = one(searchParams?.error);
  const formKey = one(searchParams?.t) ?? "base";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Campaigns</h1>
        <p className={styles.text}>
          Manage campaigns for <span className={styles.textStrong}>{brand.name}</span>
        </p>
        <div className={styles.actions}>
          <Link href={routes.dashboard} className={styles.linkBtn}>
            Back to dashboard
          </Link>
        </div>

        {created  ? <p className={styles.text}>Campaign created successfully.</p>  : null}
        {updated  ? <p className={styles.text}>Campaign updated successfully.</p>  : null}
        {deleted  ? <p className={styles.text}>Campaign permanently deleted.</p>   : null}
        {archived ? <p className={styles.text}>Campaign archived.</p>              : null}
        {restored ? <p className={styles.text}>Campaign restored.</p>              : null}
        {error    ? <p className={styles.dangerText}>{decodeURIComponent(error)}</p> : null}

        {/* ── Create ──────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create campaign</h2>
          <p className={styles.sectionSub}>
            Add a campaign with budget, platform, and current status.
          </p>
          <form key={formKey} action={createCampaignAction} className={styles.formGrid}>
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="name" className={styles.fieldLabel}>Name</label>
                <input id="name" name="name" required className={styles.input} />
              </div>
              <div>
                <label htmlFor="slug" className={styles.fieldLabel}>Slug (optional)</label>
                <input
                  id="slug"
                  name="slug"
                  className={styles.input}
                  placeholder="auto-from-name"
                />
              </div>
            </div>
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="budget" className={styles.fieldLabel}>Budget (INR)</label>
                <input
                  id="budget"
                  name="budget"
                  inputMode="numeric"
                  placeholder="e.g. 50000"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="status" className={styles.fieldLabel}>Status</label>
                <select id="status" name="status" className={styles.select}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="platform" className={styles.fieldLabel}>Platform</label>
                <input
                  id="platform"
                  name="platform"
                  className={styles.input}
                  placeholder="Instagram, YouTube..."
                />
              </div>
              <div>
                <label htmlFor="startDate" className={styles.fieldLabel}>Start date</label>
                <input id="startDate" name="startDate" type="date" className={styles.input} />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className={styles.fieldLabel}>End date</label>
              <input id="endDate" name="endDate" type="date" className={styles.input} />
            </div>
            <div>
              <button type="submit" className={styles.primaryBtn}>Create campaign</button>
            </div>
          </form>
        </section>

        {/* ── Active list ─────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campaign list</h2>
          {campaigns && campaigns.length > 0 ? (
            <div className={styles.list}>
              {campaigns.map((campaign) => (
                <article key={campaign.id} className={styles.campaignCard}>
                  <div className={styles.campaignHead}>
                    <div>
                      <p className={styles.campaignName}>{campaign.name}</p>
                      <p className={styles.campaignMeta}>
                        slug: {campaign.slug} · budget: INR {campaign.budget}
                        {campaign.platform ? ` · ${campaign.platform}` : ""}
                      </p>
                    </div>
                    <span className={statusClass(campaign.status)}>{campaign.status}</span>
                  </div>
                  <div className={styles.rowActions}>
                    <Link
                      href={`${routes.campaigns}/${campaign.id}/edit`}
                      className={styles.btnSmall}
                    >
                      Edit
                    </Link>
                    <form action={setCampaignStatusAction}>
                      <input type="hidden" name="returnTo" value={routes.campaigns} />
                      <input type="hidden" name="id" value={campaign.id} />
                      <select
                        name="status"
                        defaultValue={campaign.status}
                        className={`${styles.select} ${styles.statusSelect}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button type="submit" className={styles.btnSmall}>
                        Update status
                      </button>
                    </form>
                    <form action={archiveCampaignAction}>
                      <input type="hidden" name="returnTo" value={routes.campaigns} />
                      <input type="hidden" name="id" value={campaign.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        className={styles.btnSmall}
                        confirmMessage="Archive this campaign? You can restore it later."
                      >
                        Archive
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              No campaigns yet. Create your first campaign to get started.
            </p>
          )}
        </section>

        {/* ── Archived list ───────────────────────────────────────── */}
        {archivedCampaigns && archivedCampaigns.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Archived</h2>
            <p className={styles.sectionSub}>
              Archived campaigns are hidden from normal views. Restore to reactivate or delete permanently.
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
                      <button type="submit" className={styles.btnSmall}>
                        Restore
                      </button>
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
