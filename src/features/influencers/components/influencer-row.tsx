import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { editInfluencerRoute } from "@/config/routes";
import Link from "next/link";
import { deleteInfluencerAction } from "../actions";
import { GenerateLinkButton } from "@/features/campaigns/components/generate-link-button";
import styles from "@/app/(dashboard)/dashboard/dashboard-theme.module.css";

export type InfluencerWithClicks = {
  id: string;
  handle: string;
  platform: string;
  follower_count: number | null;
  agreed_fee: number;
  utm_links: { click_count: number }[] | null;
};

function formatFollowers(count: number | null): string {
  if (!count) return "—";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString("en-IN");
}

export function InfluencerRow({
  influencer,
  campaignId,
  brandId,
}: {
  influencer: InfluencerWithClicks;
  campaignId: string;
  brandId: string;
}) {
  const clicks = influencer.utm_links?.[0]?.click_count ?? 0;

  return (
    <tr className={styles.tableRow}>
      <td className={styles.tableCell}>
        <span className={styles.handle}>@{influencer.handle}</span>
      </td>
      <td className={styles.tableCell}>
        <span className={styles.badge}>{influencer.platform}</span>
      </td>
      <td className={`${styles.tableCell} ${styles.numCell}`}>
        {formatFollowers(influencer.follower_count)}
      </td>
      <td className={`${styles.tableCell} ${styles.numCell}`}>
        ₹{influencer.agreed_fee.toLocaleString("en-IN")}
      </td>
      <td className={`${styles.tableCell} ${styles.numCell}`}>{clicks}</td>
      <td className={styles.tableCell}>
        <GenerateLinkButton
          campaignId={campaignId}
          influencerId={influencer.id}
        />
      </td>
      <td className={styles.tableCell}>
        <div className={styles.rowActions}>
          <Link
            href={editInfluencerRoute(campaignId, influencer.id)}
            className={styles.btnSmall}
          >
            Edit
          </Link>
          <form action={deleteInfluencerAction}>
            <input type="hidden" name="id" value={influencer.id} />
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="brandId" value={brandId} />
            <ConfirmSubmitButton
              type="submit"
              className={`${styles.btnSmall} ${styles.btnDanger}`}
              confirmMessage={`Remove @${influencer.handle} from this campaign?`}
            >
              Remove
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}
