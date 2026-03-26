"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORIES = ["Fashion", "Beauty", "Food", "Fitness", "Lifestyle", "Other"] as const;
const GOALS = ["Brand Awareness", "Sales", "Traffic", "Community"] as const;
const PLATFORMS = ["Instagram", "YouTube", "TikTok", "X", "Pinterest"] as const;
/** Fits Postgres INTEGER; keeps silly values out of the DB. */
const MAX_MONTHLY_BUDGET_INR = 999_999_999;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadBrand() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: brand } = await supabase
        .from("brands")
        .select("name, website")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !brand) return;
      setName((n) => (n ? n : brand.name ?? ""));
      setWebsite((w) => (w ? w : brand.website ?? ""));
    }
    void loadBrand();
    return () => {
      cancelled = true;
    };
  }, []);

  const canNextStep1 = name.trim().length > 0 && category.length > 0;
  const canNextStep2 = goals.length > 0 && platforms.length > 0;

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
      return;
    }
    setter([...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setError(userError?.message ?? "Not signed in");
      return;
    }

    const budgetValue = monthlyBudget.trim() === "" ? null : Number(monthlyBudget);
    if (budgetValue !== null) {
      if (Number.isNaN(budgetValue)) {
        setLoading(false);
        setError("Monthly budget must be a number");
        return;
      }
      if (!Number.isInteger(budgetValue)) {
        setLoading(false);
        setError("Monthly budget must be a whole number (INR)");
        return;
      }
      if (budgetValue < 0) {
        setLoading(false);
        setError("Monthly budget cannot be negative");
        return;
      }
      if (budgetValue > MAX_MONTHLY_BUDGET_INR) {
        setLoading(false);
        setError(`Monthly budget must be at most ${MAX_MONTHLY_BUDGET_INR.toLocaleString("en-IN")} INR`);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("brands")
      .update({
        name: name.trim(),
        website: website.trim() || null,
        category,
        goals,
        platforms,
        monthly_budget: budgetValue,
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace(routes.dashboard);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">Step {step} of 3</p>
        <ol className="mt-4 flex gap-2" aria-label="Onboarding steps">
          {(
            [
              { n: 1, label: "Brand" },
              { n: 2, label: "Goals" },
              { n: 3, label: "Review" },
            ] as const
          ).map(({ n, label }) => (
            <li key={n} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  step === n
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2"
                    : step > n
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-200 text-gray-600"
                }`}
                aria-current={step === n ? "step" : undefined}
              >
                {n}
              </span>
              <span className="hidden text-xs text-gray-600 sm:block">{label}</span>
            </li>
          ))}
        </ol>
        <h1 className="mt-6 text-2xl font-semibold text-gray-900">Brand onboarding</h1>
        <p className="mt-1 text-sm text-gray-600">Set up your brand details to start tracking ROI.</p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <form className="mt-6 space-y-6" onSubmit={(e) => void onSubmit(e)}>
          {step === 1 ? (
            <section className="space-y-4">
              <Field label="Brand name" id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Field label="Website (optional)" id="website" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="category"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700">Primary goals</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOALS.map((goal) => {
                    const active = goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(goals, goal, setGoals)}
                        className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-indigo-600 text-white" : "border border-gray-300 text-gray-700"}`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Platforms</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const active = platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(platforms, platform, setPlatforms)}
                        className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-indigo-600 text-white" : "border border-gray-300 text-gray-700"}`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-4">
              <Field
                label="Monthly budget in INR (optional)"
                id="budget"
                inputMode="numeric"
                placeholder="e.g. 50000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
              />

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p><span className="font-medium">Brand:</span> {name}</p>
                <p><span className="font-medium">Category:</span> {category}</p>
                <p><span className="font-medium">Goals:</span> {goals.join(", ") || "\u2014"}</p>
                <p><span className="font-medium">Platforms:</span> {platforms.join(", ") || "\u2014"}</p>
              </div>
            </section>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <div className="w-24" aria-hidden />
              )}
            </div>
            <div>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Finish onboarding"}</Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
