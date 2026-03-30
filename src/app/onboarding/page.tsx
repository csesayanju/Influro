"use client";

import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./onboarding-theme.module.css";

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

  function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  }

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
        .select("name, website, category, goals, platforms, monthly_budget")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !brand) return;
      setName((n) => (n ? n : brand.name ?? ""));
      setWebsite((w) => (w ? w : brand.website ?? ""));
      setCategory((c) => (c ? c : brand.category ?? ""));
      setGoals((g) => (g.length > 0 ? g : toStringArray(brand.goals)));
      setPlatforms((p) => (p.length > 0 ? p : toStringArray(brand.platforms)));
      setMonthlyBudget((b) =>
        b
          ? b
          : typeof brand.monthly_budget === "number"
            ? String(brand.monthly_budget)
            : ""
      );
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

  async function onSubmit() {
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
    <main className={styles.theme}>
      <div className={styles.container}>
        <p className={styles.stepText}>Step {step} of 3</p>
        <div className={styles.logoPill}>
          <span className={styles.logoDot} />
          <span className={styles.logoText}>INFLURO</span>
        </div>
        <ol className={styles.stepper} aria-label="Onboarding steps">
          {(
            [
              { n: 1, label: "Brand" },
              { n: 2, label: "Goals" },
              { n: 3, label: "Review" },
            ] as const
          ).map(({ n, label }) => (
            <li key={n} className={styles.stepItem}>
              <span
                className={[
                  styles.stepDot,
                  step === n ? styles.stepDotActive : "",
                  step > n ? styles.stepDotDone : "",
                ].join(" ")}
                aria-current={step === n ? "step" : undefined}
              >
                {n}
              </span>
              <span className={styles.stepLabel}>{label}</span>
            </li>
          ))}
        </ol>
        <h1 className={styles.title}>Brand onboarding</h1>
        <p className={styles.subtitle}>Set up your brand details to start tracking ROI.</p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div>
          {step === 1 ? (
            <section className={styles.section}>
              <div>
                <label htmlFor="name" className={styles.label}>
                  Brand name
                </label>
                <input
                  id="name"
                  className={styles.input}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="website" className={styles.label}>
                  Website (optional)
                </label>
                <input
                  id="website"
                  className={styles.input}
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="category" className={styles.label}>
                  Category
                </label>
                <select
                  id="category"
                  className={styles.select}
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
            <section className={styles.section}>
              <div>
                <p className={styles.chipGroupLabel}>Primary goals</p>
                <div className={styles.chipRow}>
                  {GOALS.map((goal) => {
                    const active = goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(goals, goal, setGoals)}
                        className={[styles.chip, active ? styles.chipSelected : ""].join(" ")}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={styles.chipGroupLabel}>Platforms</p>
                <div className={styles.chipRow}>
                  {PLATFORMS.map((platform) => {
                    const active = platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(platforms, platform, setPlatforms)}
                        className={[styles.chip, active ? styles.chipSelected : ""].join(" ")}
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
            <section className={styles.section}>
              <div>
                <label htmlFor="budget" className={styles.label}>
                  Monthly budget in INR (optional)
                </label>
                <input
                  id="budget"
                  className={styles.input}
                inputMode="numeric"
                placeholder="e.g. 50000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                />
              </div>

              <div className={styles.summary}>
                <p>
                  <strong>Brand:</strong> {name}
                </p>
                <p>
                  <strong>Category:</strong> {category}
                </p>
                <p>
                  <strong>Goals:</strong> {goals.join(", ") || "\u2014"}
                </p>
                <p>
                  <strong>Platforms:</strong> {platforms.join(", ") || "\u2014"}
                </p>
                <div className={styles.editRow}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={styles.editButton}
                  >
                    Edit brand details
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className={styles.editButton}
                  >
                    Edit goals/platforms
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <div className={styles.actions}>
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  className={[styles.btn, styles.btnOutline].join(" ")}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
              ) : (
                <div className={styles.btnGhostSlot} aria-hidden />
              )}
            </div>
            <div>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                  className={[styles.btn, styles.btnPrimary].join(" ")}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onSubmit()}
                  className={[styles.btn, styles.btnPrimary].join(" ")}
                >
                  {loading ? "Saving..." : "Finish onboarding"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
