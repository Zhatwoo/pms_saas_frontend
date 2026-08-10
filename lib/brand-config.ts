export type SocialPlatform = "facebook" | "instagram" | "tiktok";

export type SocialAccount = {
  platform: SocialPlatform;
  pageName: string;
  handle: string;
  url: string;
};

export interface BrandConfig {
  companyName: string;
  shortCompanyName: string;
  /** Icon-only mark (square) for tight slots like nav bars and the sidebar toggle. */
  companyLogo: string;
  /** Full wordmark (wide, includes company name + tagline) for login/signup screens. */
  loginLogo: string;
  /** Icon-only mark (square) for the sidebar. */
  sidebarLogo: string;
  favicon: string;

  // Theme Colors
  primaryColor: string;     // e.g., emerald green
  secondaryColor: string;   // e.g., gold
  accentColor: string;      // e.g., dark gold
  backgroundColor: string;  // e.g., white

  // Contact Info
  phone: string;
  email: string;
  website: string;
  address: string;

  // Additional Slogans/Footers
  footerText: string;
  welcomeMessage: string;
  tagline: string;

  /** Parent company (INGI) — linked from About page. */
  parentCompany: {
    legalName: string;
    shortName: string;
    website: string;
    tagline: string;
    socialMedia: SocialAccount[];
  };

  /** Official QuickPawn social accounts. */
  socialMedia: SocialAccount[];
}

export const BRAND_CONFIG: BrandConfig = {
  companyName: "QuickPawn",
  shortCompanyName: "QuickPawn",
  companyLogo: "/PMS_logo_theme.svg",
  loginLogo: "/PMS_logo_theme.svg",
  sidebarLogo: "/PMS_logo_theme.svg",
  favicon: "/favicon.ico",
  primaryColor: "#0B5D3B",
  secondaryColor: "#E8C547",
  accentColor: "#d4a843",
  backgroundColor: "#ffffff",
  phone: "0992 971 8800",
  email: "inspirenextglobal.marketing@gmail.com",
  website: "www.example.com",
  address: "6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig",
  footerText: "Generic Footer",
  welcomeMessage: "Generic welcome message",
  tagline: "PAWNSHOP MANAGEMENT SYSTEM",
  socialMedia: [
    {
      platform: "facebook",
      pageName: "QuickPawn Pawnshop Management System",
      handle: "QuickPawn.PMS",
      url: "https://www.facebook.com/QuickPawn.PMS",
    },
    {
      platform: "instagram",
      pageName: "QuickPawn",
      handle: "quick_pawn",
      url: "https://www.instagram.com/quick_pawn/",
    },
  ],
  parentCompany: {
    legalName: "Inspire Next Global Inc.",
    shortName: "INGI",
    website: "https://inspirenextglobal.com/",
    tagline: "Bringing Japan closer to every Filipino home and business",
    socialMedia: [
      {
        platform: "facebook",
        pageName: "Inspire Next Global Inc.",
        handle: "inspirenextglobalinc",
        url: "https://www.facebook.com/inspirenextglobalinc",
      },
      {
        platform: "instagram",
        pageName: "Inspire Next Global Inc.",
        handle: "inspirenextglobal_inc",
        url: "https://www.instagram.com/inspirenextglobal_inc/",
      },
      {
        platform: "tiktok",
        pageName: "Inspire Next Global Inc.",
        handle: "inspirenextglobalinc",
        url: "https://www.tiktok.com/@inspirenextglobalinc",
      },
    ],
  },
};
