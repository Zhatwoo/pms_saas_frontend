/** Reserved for future marketing video IDs. Leave empty while using placeholders. */
export const LANDING_YOUTUBE_VIDEOS = {
  problemCommercialId: "",
  tutorialId: "",
} as const;

export type LandingDashboardScreenshot = {
  src: string;
  alt: string;
  caption: string;
};

export const LANDING_DASHBOARD_SCREENSHOTS: LandingDashboardScreenshot[] = [
  {
    src: "/landing/quickpawn-dashboard.png",
    alt: "QuickPawn dashboard showing contracts, sales, inventory, and performance charts",
    caption: "Dashboard overview",
  },
];
