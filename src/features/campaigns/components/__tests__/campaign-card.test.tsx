/**
 * Network tests for CampaignCard buttons
 *
 * CampaignCard uses Next.js Server Actions via <form action={fn}>.
 * The Next.js transform that converts server actions into POST requests to
 * /_next/action/... only runs inside the Next.js build pipeline — not in Vitest.
 * So these tests verify the contract at the boundary:
 *
 *  - Every form includes the hidden fields the server action depends on
 *    (id, brandId, returnTo) — if any are missing the server action would
 *    receive incomplete data and silently fail
 *  - The Archive button is gated behind window.confirm — no request if
 *    the user cancels
 *  - All interactive controls are present and accessible
 *
 * For full end-to-end testing of the server action POST calls, use Playwright.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignCard } from "../campaign-card";

// ── next/link renders as a plain <a> in tests ─────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// ── server actions — replaced with spies so we can assert call count ──────────
const mockSetStatus = vi.fn();
const mockArchive = vi.fn();
vi.mock("@/features/campaigns/actions", () => ({
  setCampaignStatusAction: (...args: unknown[]) => mockSetStatus(...args),
  archiveCampaignAction: (...args: unknown[]) => mockArchive(...args),
}));

// ─────────────────────────────────────────────────────────────────────────────

const campaign = {
  id: "camp-123",
  name: "Summer Drop",
  slug: "summer-drop",
  budget: 50000,
  status: "active",
  platform: "Instagram",
};

const brandId = "brand-456";

describe("CampaignCard — form fields & network contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  // ── rendering ──────────────────────────────────────────────────────────────

  it("renders the campaign name, slug, budget, and platform", () => {
    render(<CampaignCard campaign={campaign} brandId={brandId} />);
    expect(screen.getByText("Summer Drop")).toBeInTheDocument();
    expect(screen.getByText(/summer-drop/)).toBeInTheDocument();
    expect(screen.getByText(/50000/)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/)).toBeInTheDocument();
  });

  it("renders the Edit link pointing to the correct URL", () => {
    render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const editLink = screen.getByRole("link", { name: /edit/i });
    expect(editLink).toHaveAttribute("href", `/dashboard/campaigns/camp-123/edit`);
  });

  // ── "Update status" form — hidden fields ──────────────────────────────────

  it("status form includes hidden id field with campaign id", () => {
    const { container } = render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const statusForm = container.querySelector("form:has(select[name='status'])");
    expect(statusForm).not.toBeNull();
    const idInput = statusForm!.querySelector("input[name='id']") as HTMLInputElement;
    expect(idInput?.value).toBe("camp-123");
  });

  it("status form includes hidden brandId field", () => {
    const { container } = render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const statusForm = container.querySelector("form:has(select[name='status'])");
    const brandIdInput = statusForm!.querySelector(
      "input[name='brandId']"
    ) as HTMLInputElement;
    expect(brandIdInput?.value).toBe("brand-456");
  });

  it("status form includes hidden returnTo field", () => {
    const { container } = render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const statusForm = container.querySelector("form:has(select[name='status'])");
    const returnToInput = statusForm!.querySelector(
      "input[name='returnTo']"
    ) as HTMLInputElement;
    expect(returnToInput?.value).toBe("/dashboard/campaigns");
  });

  it("status select renders all three options", () => {
    render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const select = screen.getByRole("combobox");
    const options = within(select).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Draft", "Active", "Completed"]);
  });

  // ── Archive form — hidden fields & confirm guard ───────────────────────────

  it("archive form includes hidden id, brandId, and returnTo fields", () => {
    const { container } = render(<CampaignCard campaign={campaign} brandId={brandId} />);
    // The archive form is the one with the Archive submit button
    const forms = Array.from(container.querySelectorAll("form"));
    const archiveForm = forms.find((f) =>
      f.querySelector("button[type='submit']")?.textContent?.includes("Archive")
    );
    expect(archiveForm).toBeDefined();

    const get = (name: string) =>
      (archiveForm!.querySelector(`input[name='${name}']`) as HTMLInputElement)
        ?.value;

    expect(get("id")).toBe("camp-123");
    expect(get("brandId")).toBe("brand-456");
    expect(get("returnTo")).toBe("/dashboard/campaigns");
  });

  it("shows confirm dialog with the correct message before archiving", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<CampaignCard campaign={campaign} brandId={brandId} />);
    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Archive this campaign? You can restore it later."
    );
  });

  it("does NOT submit the archive form when user cancels the confirm dialog", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const submitSpy = vi.fn((e: Event) => e.preventDefault());

    const { container } = render(<CampaignCard campaign={campaign} brandId={brandId} />);
    const forms = Array.from(container.querySelectorAll("form"));
    const archiveForm = forms.find((f) =>
      f.querySelector("button[type='submit']")?.textContent?.includes("Archive")
    );
    archiveForm!.addEventListener("submit", submitSpy);

    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    expect(submitSpy).not.toHaveBeenCalled();
  });
});
