import { InfluencerForm } from "@/features/influencers/components/influencer-form";
import { updateInfluencerAction } from "@/features/influencers/actions";
import { getInfluencerById } from "@/features/influencers/queries";
import { getCampaignById } from "@/features/campaigns/queries";
import { ensureBrandProfile } from "@/features/brands/actions";
import { campaignDetailRoute, routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import styles from "../../../../../dashboard-theme.module.css";

type PageProps = { params: { id: string; influencerId: string } };

export default async function EditInfluencerPage({ params }: PageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const ensured = await ensureBrandProfile(user);
  if ("error" in ensured) redirect(routes.dashboard);
  const { brand } = ensured;

  const { data: campaign } = await getCampaignById(params.id, brand.id);
  if (!campaign) notFound();

  const { data: influencer } = await getInfluencerById(
    params.influencerId,
    brand.id
  );
  if (!influencer) notFound();

  const backHref = campaignDetailRoute(campaign.id);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit influencer</h1>
        <p className={styles.text}>
          Editing{" "}
          <span className={styles.textStrong}>@{influencer.handle}</span> in{" "}
          <span className={styles.textStrong}>{campaign.name}</span>
        </p>

        <div className={styles.actions}>
          <Link href={backHref} className={styles.linkBtn}>
            ← Back to campaign
          </Link>
        </div>

        <section className={styles.section}>
          <InfluencerForm
            action={updateInfluencerAction}
            submitLabel="Save changes"
            hiddenFields={{
              id: influencer.id,
              campaignId: campaign.id,
              brandId: brand.id,
            }}
            defaultValues={{
              handle: influencer.handle,
              platform: influencer.platform,
              follower_count: influencer.follower_count,
              agreed_fee: influencer.agreed_fee,
            }}
          />
        </section>
      </div>
    </main>
  );
}
