import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";
import { ensureBrandProfile } from "@/lib/actions/brands";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.login);
  }

  const ensured = await ensureBrandProfile();
  if ("error" in ensured) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">
          Could not set up brand profile: {ensured.error}
        </p>
        <SignOutButton />
      </main>
    );
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("name, plan, category")
    .eq("user_id", user.id)
    .maybeSingle();

  if (brand && !brand.category) {
    redirect(routes.onboarding);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Signed in as{" "}
          <span className="font-medium text-gray-900">{user.email}</span>
        </p>
        {brand ? (
          <p className="mt-4 text-sm text-gray-600">
            Brand:{" "}
            <span className="font-medium text-gray-900">{brand.name}</span>
            {brand.plan ? (
              <span className="text-gray-500"> · Plan: {brand.plan}</span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-8 flex gap-3">
          <SignOutButton />
          <Link
            href={routes.onboarding}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit brand profile
          </Link>
          <Link
            href={routes.home}
            className="inline-flex items-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Home
          </Link>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="mb-2 text-sm font-medium text-gray-900">Danger zone</p>
          <p className="mb-3 text-sm text-gray-600">
            Deleting your account is permanent and removes related records.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </main>
  );
}
