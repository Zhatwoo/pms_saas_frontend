import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/ui/sidebar";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/contexts/opening-checklist-context", () => ({
  useOptionalOpeningChecklist: jest.fn(() => null),
}));

jest.mock("@/components/ui/quickpawn-logo", () => ({
  QuickPawnLogo: () => <div data-testid="quickpawn-logo" />,
}));

jest.mock("@/components/ui/logout-modal", () => ({
  LogoutModal: () => null,
}));

jest.mock("@/lib/icons", () => ({
  LogoutIcon: () => <span />,
  MenuIcon: () => <span />,
  CloseIcon: () => <span />,
}));

const baseProps = {
  navGroups: [],
  collapsed: false,
  isMobileOpen: false,
  onToggle: jest.fn(),
  onMobileClose: jest.fn(),
  userName: "Super Admin User",
  userRole: "super_admin" as const,
};

describe("Sidebar account link", () => {
  it("links the account block to profile settings on super admin routes", () => {
    render(<Sidebar {...baseProps} />);

    const profileLink = screen.getByRole("link", { name: "Open profile settings" });
    expect(profileLink).toHaveAttribute("href", "/settings");
    const userName = screen.getByText("Super Admin User");
    expect(userName).toBeInTheDocument();
    expect(userName).toHaveClass("text-white");
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("does not render a profile link when the sidebar is restricted", () => {
    render(<Sidebar {...baseProps} disabled />);

    expect(screen.queryByRole("link", { name: "Open profile settings" })).not.toBeInTheDocument();
    expect(screen.getByText("Super Admin User")).toBeInTheDocument();
  });
});
