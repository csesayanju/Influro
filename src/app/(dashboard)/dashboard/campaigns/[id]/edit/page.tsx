import {
  archiveCampaignAction,
  deleteCampaignAction,
  restoreCampaignAction,
  setCampaignStatusAction,
  updateCampaignAction,
} from "@/lib/actions/campaigns";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import styles from "../../../dashboard-theme.module.css";

type EditCampaignPageProps = {
  params: { id: string };
};

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect(routes.dashboard);

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, slug, budget, status, platform, start_date, end_date, archived_at")
    .eq("id", params.id)
    .eq("brand_id", brand.id)
    .maybeSingle();

  if (!campaign) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit campaign</h1>
        <p className={styles.text}>
          Update <span className={styles.textStrong}>{campaign.name}</span>
        </p>
        <div className={styles.actions}>
          <Link href={routes.campaigns} className={styles.linkBtn}>
            Back to campaigns
          </Link>
        </div>

        <section className={styles.section}>
          <form action={updateCampaignAction} className={styles.formGrid}>
            <input type="hidden" name="id" value={campaign.id} />
            <input
              type="hidden"
              name="returnTo"
              value={`${routes.campaigns}/${campaign.id}/edit`}
            />
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="name" className={styles.fieldLabel}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={campaign.name}
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="slug" className={styles.fieldLabel}>
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  required
                  defaultValue={campaign.slug}
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="budget" className={styles.fieldLabel}>
                  Budget (INR)
                </label>
                <input
                  id="budget"
                  name="budget"
                  inputMode="numeric"
                  defaultValue={campaign.budget}
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="status" className={styles.fieldLabel}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={campaign.status}
                  className={styles.select}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className={styles.gridTwo}>
              <div>
                <label htmlFor="platform" className={styles.fieldLabel}>
                  Platform
                </label>
                <input
                  id="platform"
                  name="platform"
                  defaultValue={campaign.platform ?? ""}
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="startDate" className={styles.fieldLabel}>
                  Start date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={campaign.start_date ?? ""}
                  className={styles.input}
                />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className={styles.fieldLabel}>
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={campaign.end_date ?? ""}
                className={styles.input}
              />
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn}>
                Save changes
              </button>
            </div>
          </form>
          <form action={setCampaignStatusAction} className={styles.rowActions}>
            <input type="hidden" name="id" value={campaign.id} />
            <input
              type="hidden"
              name="returnTo"
              value={`${routes.campaigns}/${campaign.id}/edit`}
            />
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
          {campaign.archived_at ? (
            <>
              <form action={restoreCampaignAction}>
                <input type="hidden" name="id" value={campaign.id} />
                <button type="submit" className={styles.btnSmall}>
                  Restore campaign
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
            </>
          ) : (
            <form action={archiveCampaignAction}>
              <input type="hidden" name="returnTo" value={`${routes.campaigns}/${campaign.id}/edit`} />
              <input type="hidden" name="id" value={campaign.id} />
              <ConfirmSubmitButton
                type="submit"
                className={styles.btnSmall}
                confirmMessage="Archive this campaign? You can restore it later."
              >
                Archive campaign
              </ConfirmSubmitButton>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
