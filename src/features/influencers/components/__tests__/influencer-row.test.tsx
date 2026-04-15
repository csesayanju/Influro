/**
 * Unit tests for InfluencerRow
 *
 * Covers:
 *  - Renders handle, platform, follower count, agreed fee, click count
 *  - Formats large follower counts correctly (K / M)
 *  - Shows "—" for null follower count
 *  - Formats agreed_fee with ₹ and Indian locale commas
 *  - Edit link points to the correct URL
 *  - Remove button shows confirm dialog with correct message
 *  - Cancelling confirm does NOT submit the form
 *  - Hidden fields (id, campaignId, brandId) carry correct values
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InfluencerRow } from "../influencer-row";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/features/influencers/actions", () => ({
  deleteInfluencerAction: vi.fn(),
}));

const base = {
  id: "inf-1",
  handle: "priya_styles",
  platform: "Instagram",
  follower_count: 52000,
  agreed_fee: 15000,
  utm_links: [{ click_count: 42 }],
};

function renderRow(overrides: Partial<typeof base> = {}) {
  const inf = { ...base, ...overrides };
  return render(
    <table>
      <tbody>
        <InfluencerRow
          influencer={inf}
          campaignId="camp-abc"
          brandId="brand-xyz"
        />
      </tbody>
    </table>
  );
}

describe("InfluencerRow — rendering", () => {
  it("renders the handle with @ prefix", () => {
    renderRow();
    expect(screen.getByText("@priya_styles")).toBeInTheDocument();
  });

  it("renders the platform", () => {
    renderRow();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });

  it("formats follower count as 52.0K", () => {
    renderRow();
    expect(screen.getByText("52.0K")).toBeInTheDocument();
  });

  it("formats millions correctly", () => {
    renderRow({ follower_count: 1_200_000 });
    expect(screen.getByText("1.2M")).toBeInTheDocument();
  });

  it("shows — for null follower count", () => {
    renderRow({ follower_count: null });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders agreed_fee with ₹ symbol", () => {
    renderRow();
    expect(screen.getByText(/₹15,000/)).toBeInTheDocument();
  });

  it("renders click count from utm_links", () => {
    renderRow();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders 0 clicks when utm_links is null", () => {
    renderRow({ utm_links: null });
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders 0 clicks when utm_links is empty array", () => {
    renderRow({ utm_links: [] });
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("InfluencerRow — Edit link", () => {
  it("Edit link points to the correct edit URL", () => {
    renderRow();
    const link = screen.getByRole("link", { name: /edit/i });
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/campaigns/camp-abc/influencers/inf-1/edit"
    );
  });
});

describe("InfluencerRow — Remove button / confirm guard", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows confirm dialog with the influencer handle on click", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    renderRow();
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(confirmSpy).toHaveBeenCalledWith(
      "Remove @priya_styles from this campaign?"
    );
  });

  it("does NOT submit form when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const submitSpy = vi.fn((e: Event) => e.preventDefault());

    const { container } = render(
      <table>
        <tbody>
          <InfluencerRow
            influencer={base}
            campaignId="camp-abc"
            brandId="brand-xyz"
          />
        </tbody>
      </table>
    );

    const form = container.querySelector("form")!;
    form.addEventListener("submit", submitSpy);
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(submitSpy).not.toHaveBeenCalled();
  });
});

describe("InfluencerRow — hidden form fields", () => {
  it("delete form carries correct id, campaignId, brandId", () => {
    const { container } = render(
      <table>
        <tbody>
          <InfluencerRow
            influencer={base}
            campaignId="camp-abc"
            brandId="brand-xyz"
          />
        </tbody>
      </table>
    );

    const form = container.querySelector("form")!;
    const get = (name: string) =>
      (form.querySelector(`input[name="${name}"]`) as HTMLInputElement)?.value;

    expect(get("id")).toBe("inf-1");
    expect(get("campaignId")).toBe("camp-abc");
    expect(get("brandId")).toBe("brand-xyz");
  });
});
