import { PLATFORMS } from "../schemas";
import styles from "@/app/(dashboard)/dashboard/dashboard-theme.module.css";

type InfluencerDefaults = {
  handle?: string;
  platform?: string;
  follower_count?: number | null;
  agreed_fee?: number;
};

type InfluencerFormProps = {
  hiddenFields?: Record<string, string>;
  defaultValues?: InfluencerDefaults;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

export function InfluencerForm({
  hiddenFields,
  defaultValues = {},
  action,
  submitLabel,
}: InfluencerFormProps) {
  return (
    <form action={action} className={styles.formGrid}>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}

      <div className={styles.gridTwo}>
        <div>
          <label htmlFor="handle" className={styles.fieldLabel}>
            Handle
          </label>
          <input
            id="handle"
            name="handle"
            required
            defaultValue={defaultValues.handle ?? ""}
            placeholder="e.g. @username"
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="platform" className={styles.fieldLabel}>
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            required
            defaultValue={defaultValues.platform ?? ""}
            className={styles.select}
          >
            <option value="" disabled>
              Select platform
            </option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label htmlFor="follower_count" className={styles.fieldLabel}>
            Followers (optional)
          </label>
          <input
            id="follower_count"
            name="follower_count"
            inputMode="numeric"
            defaultValue={defaultValues.follower_count ?? ""}
            placeholder="e.g. 50000"
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="agreed_fee" className={styles.fieldLabel}>
            Agreed fee (INR)
          </label>
          <input
            id="agreed_fee"
            name="agreed_fee"
            inputMode="numeric"
            required
            defaultValue={defaultValues.agreed_fee ?? ""}
            placeholder="e.g. 15000"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
