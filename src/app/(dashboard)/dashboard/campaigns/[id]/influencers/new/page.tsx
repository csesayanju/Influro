import { InfluencerForm } from "@/features/influencers/components/influencer-form";
import { createInfluencerAction } from "@/features/influencers/actions";
import { getCampaignById } from "@/features/campaigns/queries";
import { getBrandByUserId } from "@/features/brands/queries";
import { campaignDetailRoute, routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import styles from "../../../../dashboard-theme.module.css";

type PageProps = { params: { id: string } };

export default async function NewInfluencerPage({ params }: PageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: brand } = await getBrandByUserId(user.id);
  if (!brand) redirect(routes.dashboard);

  const { data: campaign } = await getCampaignById(params.id, brand.id);
  if (!campaign) notFound();

  const backHref = campaignDetailRoute(campaign.id);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add influencer</h1>
        <p className={styles.text}>
          Adding to{" "}
          <span className={styles.textStrong}>{campaign.name}</span>
        </p>

        <div className={styles.actions}>
          <Link href={backHref} className={styles.linkBtn}>
            ← Back to campaign
          </Link>
        </div>

        <section className={styles.section}>
          <InfluencerForm
            action={createInfluencerAction}
            submitLabel="Add influencer"
            hiddenFields={{ campaignId: campaign.id, brandId: brand.id }}
          />
        </section>
      </div>
    </main>
  );
}
