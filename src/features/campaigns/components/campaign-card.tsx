import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { campaignDetailRoute, routes } from "@/config/routes";
import Link from "next/link";
import {
  archiveCampaignAction,
  setCampaignStatusAction,
} from "../actions";
import styles from "@/app/(dashboard)/dashboard/dashboard-theme.module.css";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  budget: number;
  status: string;
  platform: string | null;
};

function statusClass(status: string) {
  if (status === "active") return `${styles.badge} ${styles.badgeActive}`;
  if (status === "completed") return `${styles.badge} ${styles.badgeCompleted}`;
  return styles.badge;
}

export function CampaignCard({ campaign, brandId }: { campaign: Campaign; brandId: string }) {
  return (
    <article className={styles.campaignCard}>
      <div className={styles.campaignHead}>
        <div>
          <Link href={campaignDetailRoute(campaign.id)} className={styles.campaignName} style={{ textDecoration: "none" }}>
            {campaign.name}
          </Link>
          <p className={styles.campaignMeta}>
            slug: {campaign.slug} · budget: INR {campaign.budget}
            {campaign.platform ? ` · ${campaign.platform}` : ""}
          </p>
        </div>
        <span className={statusClass(campaign.status)}>{campaign.status}</span>
      </div>
      <div className={styles.rowActions}>
        <Link href={`${routes.campaigns}/${campaign.id}/edit`} className={styles.btnSmall}>
          Edit
        </Link>
        <form action={setCampaignStatusAction}>
          <input type="hidden" name="returnTo" value={routes.campaigns} />
          <input type="hidden" name="id" value={campaign.id} />
          <input type="hidden" name="brandId" value={brandId} />
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
          <input type="hidden" name="brandId" value={brandId} />
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
  );
}
