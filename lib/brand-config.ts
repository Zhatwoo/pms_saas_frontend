export interface BrandConfig {
  companyName: string;
  shortCompanyName: string;
  companyLogo: string;
  loginLogo: string;
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
  companyName: "Lorem Ipsum Company",
  shortCompanyName: "Lorem Ipsum",
  companyLogo: "/logo.png",
  loginLogo: "/logo.png",
  sidebarLogo: "/logo.png",
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
  tagline: "BUY BACK SHOP",
};
