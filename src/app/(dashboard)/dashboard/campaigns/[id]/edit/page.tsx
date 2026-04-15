import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  archiveCampaignAction,
  deleteCampaignAction,
  restoreCampaignAction,
  setCampaignStatusAction,
  updateCampaignAction,
} from "@/features/campaigns/actions";
import { CampaignForm } from "@/features/campaigns/components/campaign-form";
import { getCampaignById } from "@/features/campaigns/queries";
import { getBrandByUserId } from "@/features/brands/queries";
import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import styles from "../../../dashboard-theme.module.css";

type EditCampaignPageProps = {
  params: { id: string };
};

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: brand } = await getBrandByUserId(user.id);
  if (!brand) redirect(routes.dashboard);

  const { data: campaign } = await getCampaignById(params.id, brand.id);
  if (!campaign) notFound();

  const editUrl = `${routes.campaigns}/${campaign.id}/edit`;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit campaign</h1>
        <p className={styles.text}>
          Update <span className={styles.textStrong}>{campaign.name}</span>
        </p>
        <div className={styles.actions}>
          <Link href={routes.campaigns} className={styles.linkBtn}>Back to campaigns</Link>
        </div>

        <section className={styles.section}>
          <CampaignForm
            action={updateCampaignAction}
            submitLabel="Save changes"
            hiddenFields={{ id: campaign.id, returnTo: editUrl, brandId: brand.id }}
            defaultValues={{
              name:      campaign.name,
              slug:      campaign.slug,
              budget:    campaign.budget,
              status:    campaign.status,
              platform:  campaign.platform,
              startDate: campaign.start_date,
              endDate:   campaign.end_date,
            }}
          />

          <form action={setCampaignStatusAction} className={styles.rowActions}>
            <input type="hidden" name="id" value={campaign.id} />
            <input type="hidden" name="returnTo" value={editUrl} />
            <input type="hidden" name="brandId" value={brand.id} />
            <select
              name="status"
              defaultValue={campaign.status}
              className={`${styles.select} ${styles.statusSelect}`}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <button type="submit" className={styles.btnSmall}>Update status</button>
          </form>

          {campaign.archived_at ? (
            <>
              <form action={restoreCampaignAction}>
                <input type="hidden" name="id" value={campaign.id} />
                <input type="hidden" name="brandId" value={brand.id} />
                <button type="submit" className={styles.btnSmall}>Restore campaign</button>
              </form>
              <form action={deleteCampaignAction}>
                <input type="hidden" name="returnTo" value={routes.campaigns} />
                <input type="hidden" name="id" value={campaign.id} />
                <input type="hidden" name="brandId" value={brand.id} />
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
              <input type="hidden" name="returnTo" value={editUrl} />
              <input type="hidden" name="id" value={campaign.id} />
              <input type="hidden" name="brandId" value={brand.id} />
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
