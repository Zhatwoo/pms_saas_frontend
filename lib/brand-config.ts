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
}

export const BRAND_CONFIG: BrandConfig = {
  companyName: "QuickPawn",
  shortCompanyName: "QuickPawn",
  companyLogo: "/logo-icon.png",
  loginLogo: "/logo.png",
  sidebarLogo: "/logo-icon.png",
  favicon: "/favicon.ico",
  primaryColor: "#0B5D3B",
  secondaryColor: "#E8C547",
  accentColor: "#d4a843",
  backgroundColor: "#ffffff",
  phone: "+63 XXX XXX XXXX",
  email: "lorem@example.com",
  website: "www.example.com",
  address: "Lorem Ipsum Address",
  footerText: "Generic Footer",
  welcomeMessage: "Generic welcome message",
  tagline: "PAWNSHOP MANAGEMENT SYSTEM",
};
