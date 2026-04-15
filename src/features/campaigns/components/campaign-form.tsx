import styles from "@/app/(dashboard)/dashboard/dashboard-theme.module.css";

type CampaignDefaults = {
  name?: string;
  slug?: string;
  budget?: number;
  status?: string;
  platform?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type CampaignFormProps = {
  /** Hidden fields injected before the submit button (e.g. id, returnTo). */
  hiddenFields?: Record<string, string>;
  defaultValues?: CampaignDefaults;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  /** Unique key to reset form after submission (pass searchParam timestamp). */
  formKey?: string;
};

export function CampaignForm({
  hiddenFields,
  defaultValues = {},
  action,
  submitLabel,
  formKey,
}: CampaignFormProps) {
  return (
    <form key={formKey} action={action} className={styles.formGrid}>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}

      <div className={styles.gridTwo}>
        <div>
          <label htmlFor="name" className={styles.fieldLabel}>Name</label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues.name}
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="slug" className={styles.fieldLabel}>
            Slug {defaultValues.slug ? "" : "(optional)"}
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={defaultValues.slug}
            placeholder={defaultValues.slug ? undefined : "auto-from-name"}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label htmlFor="budget" className={styles.fieldLabel}>Budget (INR)</label>
          <input
            id="budget"
            name="budget"
            inputMode="numeric"
            defaultValue={defaultValues.budget ?? ""}
            placeholder="e.g. 50000"
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="status" className={styles.fieldLabel}>Status</label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues.status ?? "draft"}
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
          <label htmlFor="platform" className={styles.fieldLabel}>Platform</label>
          <input
            id="platform"
            name="platform"
            defaultValue={defaultValues.platform ?? ""}
            placeholder="Instagram, YouTube..."
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="startDate" className={styles.fieldLabel}>Start date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultValues.startDate ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="endDate" className={styles.fieldLabel}>End date</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={defaultValues.endDate ?? ""}
          className={styles.input}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn}>{submitLabel}</button>
      </div>
    </form>
  );
}
