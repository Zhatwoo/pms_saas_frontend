"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";
import {
  LandingBenefits,
  LandingCloud,
  LandingFaq,
  LandingHero,
  LandingHowItHelps,
  LandingIntro,
  LandingLightFooter,
  LandingProblemSolution,
  LandingProcessPricing,
  LandingStats,
  LandingTrustBar,
} from "./landing-layout-sections";

interface AuthLandingPageProps {
  onLoginClick: () => void;
}

const navItems = ["HOME", "PRODUCT", "WHY US", "HOW IT HELPS", "BENEFITS", "PRICING", "FAQ", "CONTACT US"];

const sectionNavLabels: Record<string, string> = {
  home: "HOME",
  product: "PRODUCT",
  "why-us": "WHY US",
  "how-it-helps": "HOW IT HELPS",
  benefits: "BENEFITS",
  pricing: "PRICING",
  faq: "FAQ",
  "contact-us": "CONTACT US",
};

const supportEmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(BRAND_CONFIG.email)}&su=${encodeURIComponent("QuickPawn inquiry")}`;

// Maps nav label text to a section ID when the label differs from the auto-generated id
const navIdOverrides: Record<string, string> = {};

type LegalModalType = "privacy" | "terms" | null;

const termsSections = [
  {
    title: "I. The QuickPawn Service",
    body: "QuickPawn is a cloud-based pawnshop management system designed to help businesses manage operations such as customer records, pawn transactions, pawned items, loans, payments, renewals, redemptions, reports, and other available features. The features available to you may depend on your selected subscription plan. QuickPawn is a business management tool and does not provide legal, accounting, tax, financial, valuation, appraisal, or regulatory advice. You remain responsible for your business operations, decisions, records, and compliance with applicable laws.",
  },
  {
    title: "II. Account Registration and Security",
    body: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials, ensuring only authorized users access your account, keeping your account information accurate and updated, and all activities conducted through your account. You must promptly notify Inspire if you suspect unauthorized access to your account, and you are responsible for ensuring your employees, representatives, and other authorized users comply with these Terms.",
  },
  {
    title: "III. Subscription and Right to Use",
    body: "Subject to these Terms and payment of applicable fees, Inspire grants you a limited, non-exclusive, non-transferable, non-sublicensable right to access and use QuickPawn during your active subscription solely for your internal business operations. You do not receive ownership of QuickPawn, its software, source code, design, interface, trademarks, or other intellectual property. You may not copy, modify, reverse engineer, resell, sublicense, distribute, or use QuickPawn to create or operate a competing product.",
  },
  {
    title: "IV. Fees and Payment",
    body: "You agree to pay the subscription fees applicable to your selected plan. Fees, billing frequency, user limits, feature limits, and other subscription conditions will be stated in the applicable pricing plan, order, invoice, or written agreement. Unless otherwise stated, fees are payable according to the selected billing schedule, applicable taxes and government charges may apply, subscription fees are non-refundable except where required by law or expressly agreed in writing, and failed or overdue payments may result in restricted or suspended access. If your subscription automatically renews, it will renew according to the applicable subscription terms unless cancelled before the renewal date.",
  },
  {
    title: "V. Customer Data",
    body: "“Customer Data” means information, records, files, personal information, transaction information, and other data submitted to or stored in QuickPawn by or on behalf of the Customer. As between the parties, you retain your rights and ownership interests in Customer Data. You are responsible for the accuracy and legality of Customer Data, having the necessary rights and authority to provide Customer Data to QuickPawn, complying with applicable privacy and data protection laws, and ensuring that your collection and use of personal information is lawful. You authorize Inspire to host, store, process, transmit, and use Customer Data as reasonably necessary to provide, maintain, secure, support, and improve QuickPawn, comply with legal obligations, and prevent fraud or abuse.",
  },
  {
    title: "VI. Data Privacy",
    body: "The use of QuickPawn may involve the processing of personal information. Inspire Next Global Inc. and its customers agree to comply with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable Philippine data privacy laws and regulations. Customers are responsible for ensuring that personal information entered into QuickPawn is collected and processed lawfully. Inspire Next Global Inc. will take reasonable measures to protect information processed through the Service. For more information about how personal information is handled, please refer to the QuickPawn Privacy Policy.",
  },
  {
    title: "VII. Acceptable Use",
    body: "You must use QuickPawn only for lawful business purposes. You must not use QuickPawn for unlawful, fraudulent, or abusive activities; violate applicable laws or the rights of others; upload viruses, malware, ransomware, or other harmful code; attempt to gain unauthorized access to QuickPawn or related systems; circumvent security features or usage limitations; reverse engineer, copy, or modify the Platform; resell, sublicense, or provide unauthorized access to QuickPawn; or use QuickPawn to develop or operate a competing service.",
  },
  {
    title: "VIII. Service Availability and Changes",
    body: "Inspire will use reasonable efforts to maintain QuickPawn. However, the Service may occasionally be unavailable due to maintenance, upgrades, technical issues, internet or third-party service failures, cybersecurity incidents, or events beyond Inspire's reasonable control. Inspire may update, modify, improve, or discontinue features of QuickPawn from time to time. Unless otherwise agreed in writing, Inspire does not guarantee uninterrupted or error-free operation of the Service.",
  },
  {
    title: "IX. Suspension and Termination",
    body: "Inspire may suspend or restrict access to QuickPawn if reasonably necessary to protect the security or integrity of the Service, prevent fraud, abuse, or unauthorized access, address a serious violation of these Terms, comply with applicable law, or address unpaid fees. You may cancel your subscription according to the applicable cancellation procedure. Upon termination or expiration of your subscription, your right to use QuickPawn ends, access to your account may be disabled, unpaid fees remain payable, and Customer Data may be retained or deleted in accordance with Inspire's applicable data retention practices and legal obligations. You are responsible for requesting and obtaining any necessary data export before the end of the applicable retention period.",
  },
  {
    title: "X. Intellectual Property",
    body: "QuickPawn and all related software, technology, design, content, documentation, trademarks, logos, and branding are owned by or licensed to Inspire Next Global Inc. You retain ownership of your Customer Data. You may not use Inspire or QuickPawn trademarks, logos, or branding without prior written permission.",
  },
  {
    title: "XI. Disclaimers",
    body: "To the maximum extent permitted by law, QuickPawn is provided on an “AS IS” and “AS AVAILABLE” basis. Inspire does not guarantee that the Service will always be uninterrupted, error-free, that all defects will be corrected, that QuickPawn will meet every specific business requirement, or that use of QuickPawn alone will ensure compliance with any law or regulation. You remain responsible for verifying important information and business transactions.",
  },
  {
    title: "XII. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Inspire will not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, business opportunities, goodwill, data, or business interruption. Inspire's total aggregate liability arising out of or relating to QuickPawn or these Terms will not exceed the total subscription fees actually paid by the Customer to Inspire for QuickPawn during the twelve (12) months preceding the event giving rise to the claim. Nothing in these Terms limits liability that cannot legally be limited or excluded.",
  },
  {
    title: "XIII. Customer Indemnification",
    body: "To the extent permitted by law, you agree to defend, indemnify, and hold harmless Inspire, its affiliates, officers, directors, employees, contractors, and representatives from claims, damages, liabilities, costs, and expenses arising from your breach of these Terms, your misuse of QuickPawn, your violation of applicable law, your Customer Data, your violation of another person's rights, or your business operations and transactions.",
  },
  {
    title: "XIV. Confidentiality",
    body: "Each party agrees to protect the other party's confidential information and use it only for purposes related to the business relationship. This obligation does not apply to information that is publicly available, already lawfully known, independently developed, or required to be disclosed by law.",
  },
  {
    title: "XV. Changes to These Terms",
    body: "Inspire may update these Terms from time to time. Updated Terms may be posted on the QuickPawn website or provided through the Platform, email, or other reasonable means. If you continue to use QuickPawn after the updated Terms become effective, you agree to the revised Terms.",
  },
  {
    title: "XVI. Governing Law and Disputes",
    body: "These Terms are governed by the laws of the Republic of the Philippines. The parties will first attempt in good faith to resolve disputes through discussion and negotiation. If a dispute cannot be resolved, the parties may pursue remedies available under applicable Philippine law before the proper courts with jurisdiction.",
  },
  {
    title: "XVII. Contact Information",
    body: "Inspire Next Global Inc.",
    contactItems: [
      { label: "Name", value: "Inspire Neo" },
      { label: "Email", value: "inspirenextglobal.marketing@gmail.com" },
      { label: "Contact Number", value: "09929718800" },
      { label: "Address", value: "6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig" },
    ],
  },
];

const privacySections = [
  {
    title: "I. Information We May Collect",
    body: "Depending on how you use QuickPawn, we may collect or process: name and contact information; account and login information; business and user information; customer and transaction information entered into the Platform; pawn, payment, loan, renewal, and redemption records; device, browser, log, and technical information; and other information necessary to provide and operate the Service.",
  },
  {
    title: "II. How We Use Information",
    body: "Information may be used to provide, operate, and maintain QuickPawn; create and manage user accounts; process and manage transactions; provide customer and technical support; maintain system security and prevent unauthorized access, fraud, and abuse; improve and develop the Service; perform backups and business continuity activities; comply with applicable laws and legal obligations; and perform other purposes reasonably necessary to provide the Service.",
  },
  {
    title: "III. Customer Data",
    body: "Information entered into QuickPawn by a subscribing pawnshop or business (\"Customer Data\") generally remains under the control and ownership of that customer. The customer is responsible for ensuring that personal information entered into QuickPawn is collected and processed lawfully and in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws. Inspire may process Customer Data as necessary to provide, maintain, secure, support, and operate QuickPawn. Where applicable, the customer may act as the Personal Information Controller, while Inspire may act as a Personal Information Processor processing data on the customer's behalf.",
  },
  {
    title: "IV. Data Sharing and Service Providers",
    body: "We may share or provide access to information only as reasonably necessary to operate QuickPawn, including with authorized service providers such as hosting, cloud infrastructure, security, communication, payment, and other technology providers. We may also disclose information when required by law, legal process, or a lawful government request, or when reasonably necessary to protect the rights, property, security, and operation of Inspire, QuickPawn, our customers, or other persons. We do not sell personal information for purposes unrelated to providing or operating our services.",
  },
  {
    title: "V. Data Security",
    body: "We implement reasonable technical, organizational, and administrative measures designed to protect personal information against unauthorized access, disclosure, alteration, loss, destruction, or unlawful processing. However, no system, network, or electronic transmission can guarantee absolute security. Users and customers are also responsible for protecting their account credentials and limiting access to authorized individuals.",
  },
  {
    title: "VI. Data Retention",
    body: "We retain information only for as long as reasonably necessary to provide the Service, fulfill legitimate business purposes, comply with legal obligations, resolve disputes, enforce agreements, maintain records, and protect our legitimate interests. After an account or subscription ends, Customer Data may be retained or deleted in accordance with applicable retention practices, legal requirements, and the applicable Terms of Service.",
  },
  {
    title: "VII. Data Subject Rights",
    body: "Subject to applicable law, data subjects may have rights under the Data Privacy Act of 2012, including the right to be informed, access, correct, object to certain processing, request erasure or blocking where applicable, and lodge a complaint with the National Privacy Commission. Requests relating to personal information should generally first be directed to the relevant customer or organization that collected the information. Requests relating to personal information directly controlled by Inspire may be sent to the contact details below.",
  },
  {
    title: "VIII. Cookies and Technical Information",
    body: "QuickPawn and related websites may use cookies, logs, and similar technologies to support functionality, security, authentication, performance, and system improvement. You may be able to control certain cookie settings through your browser or device. Disabling certain technologies may affect the availability or functionality of some features.",
  },
  {
    title: "IX. Changes to This Privacy Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our services, practices, technology, or legal requirements. The updated version will be posted on the QuickPawn website with its updated effective date. Your continued use of QuickPawn after an updated Privacy Policy becomes effective constitutes your acknowledgment of the updated Policy.",
  },
  {
    title: "X. Contact Information",
    body: "Inspire Next Global Inc.",
    contactItems: [
      { label: "Name", value: "Inspire Neo" },
      { label: "Email", value: "inspirenextglobal.marketing@gmail.com" },
      { label: "Contact Number", value: "09929718800" },
      { label: "Address", value: "6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig" },
    ],
  },
];

const legalModalContent = {
  privacy: {
    title: "Privacy Policy",
    ariaLabel: "Close privacy policy",
    intro: "This Privacy Policy explains how Inspire Next Global Inc. (\"Inspire,\" \"we,\" \"us,\" or \"our\") collects, uses, stores, and protects personal information in connection with the QuickPawn Pawnshop Management System. By accessing or using QuickPawn, you acknowledge this Privacy Policy. Last updated: August 2026.",
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    ariaLabel: "Close terms of service",
    intro: "These Terms of Service govern your access to and use of the QuickPawn Pawnshop Management System, a software-as-a-service platform owned and operated by Inspire Next Global Inc. By accessing or using QuickPawn, you agree to comply with these Terms.",
    sections: termsSections,
  },
};

export function AuthLandingPage({ onLoginClick }: AuthLandingPageProps) {
  const [activeNavItem, setActiveNavItem] = useState("HOME");
  const [underlineLeft, setUnderlineLeft] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const lastScrollY = useRef(0);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSendingContact(true);
    try {
      await api.post(
        "/contact",
        {
          name: contactName.trim(),
          email: contactEmail.trim(),
          message: contactMessage.trim(),
        },
        { suppressApiIssueLogging: true },
      );
      toast.success("Message sent! We'll get back to you shortly.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your message. Please try again.");
    } finally {
      setIsSendingContact(false);
    }
  };

  // Prevent scrolling when mobile or tablet menu is open
  useEffect(() => {
    if (mobileMenuOpen || tabletMenuOpen) {
      // Store scroll position
      const scrollY = window.scrollY;
      document.body.setAttribute('data-scroll-lock', scrollY.toString());
      
      // Add styles to prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift from scrollbar
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.removeAttribute('data-scroll-lock');
    }
  }, [mobileMenuOpen, tabletMenuOpen]);

  const handleScroll = (e: React.MouseEvent<HTMLElement>, id: string, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = document.getElementById(id);
    if (!element) return;
    
    // Update active nav item immediately
    setActiveNavItem(item);
    
    // Close the menu
    setMobileMenuOpen(false);
    setTabletMenuOpen(false);
    
    // Small delay to let menu start closing, then scroll
    setTimeout(() => {
      const offset =
        window.innerWidth >= 3840 ? 96 : window.innerWidth >= 2560 ? 80 : 64; // Header height by viewport
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      window.history.pushState(null, "", `#${id}`);
    }, 50);
  };

  useEffect(() => {
    // Reveal on scroll elements are now handled via CSS View Timelines in globals.css
  }, []);

  useEffect(() => {
    const handleScrollSync = () => {
      const sections = document.querySelectorAll("section[id]");
      const { scrollY, innerHeight } = window;
      setShowBackToTop(scrollY > innerHeight * 0.5);
      setIsAtTop(scrollY <= 10);

      // Hide nav on scroll down, show on scroll up
      if (scrollY > lastScrollY.current + 10 && scrollY > 100) {
        setIsNavVisible(false);
      } else if (scrollY < lastScrollY.current - 10 || scrollY <= 50) {
        setIsNavVisible(true);
      }
      lastScrollY.current = scrollY;

      // Check if we're in any section
      let foundSection = false;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 100) {
          const mapped = sectionNavLabels[section.id];
          if (mapped) {
            setActiveNavItem(mapped);
            foundSection = true;
          }
        }
      });
      
      // Only set CONTACT US if we're actually at the bottom and no other section was found
      if (!foundSection && scrollY + innerHeight >= document.documentElement.scrollHeight - 60) {
        setActiveNavItem("CONTACT US");
      }
    };
    window.addEventListener("scroll", handleScrollSync);
    return () => { window.removeEventListener("scroll", handleScrollSync); };
  }, []);

  useEffect(() => {
    const activeRef = navRefs.current[navItems.indexOf(activeNavItem)];
    if (activeRef) { setUnderlineLeft(activeRef.offsetLeft); setUnderlineWidth(activeRef.offsetWidth); }
  }, [activeNavItem]);


  return (
    <div className="min-h-screen bg-[#f4f2ee] selection:bg-brand-gold selection:text-brand-green">
      {/* Plain white background */}

      <div className="relative z-10">
        {/* ─── NAV ─── */}
        <nav className={`fixed left-0 right-0 top-0 z-[80] border-b border-brand-green/10 bg-white/90 backdrop-blur-md transition-transform duration-300 ease-in-out ${(isNavVisible || mobileMenuOpen || tabletMenuOpen) ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="landing-container-wide flex h-16 items-center justify-between px-4 md:px-6 lg:px-12 uqhd:h-20 uhd:h-24">
            {/* Logo - Desktop only (lg and up) */}
            <button
              type="button"
              className="hidden items-center lg:flex"
              onClick={(e) => handleScroll(e, "home", "HOME")}
            >
              <QuickPawnLogo variant="full" className="h-10 w-auto" />
            </button>
            
            {/* Burger menu icon - Mobile and Tablet only (below lg) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Show navbar when opening menu
                setIsNavVisible(true);
                // Toggle appropriate menu based on screen size
                if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                  setTabletMenuOpen((prev) => !prev);
                } else {
                  setMobileMenuOpen((prev) => !prev);
                }
              }}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-green transition hover:bg-brand-green/5 lg:hidden"
            >
              {(mobileMenuOpen || tabletMenuOpen) ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Desktop nav links */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 lg:flex xl:gap-8 uqhd:gap-10 uhd:gap-12">
              {navItems.map((item, index) => {
                const id = navIdOverrides[item] ?? item.toLowerCase().replace(/ /g, "-");
                return (
                  <a key={item} ref={(el) => { navRefs.current[index] = el; }} href={`#${id}`}
                    onClick={(e) => handleScroll(e, id, item)}
                    className={`whitespace-nowrap text-[11px] font-bold tracking-wider transition-colors xl:text-sm uqhd:text-base uhd:text-lg ${activeNavItem === item ? "text-brand-gold" : "text-brand-green/70 hover:text-brand-green"}`}>
                    {item}
                  </a>
                );
              })}
              <span className="absolute -bottom-1 h-0.5 bg-brand-gold transition-all duration-300" style={{ left: `${underlineLeft}px`, width: `${underlineWidth}px` }} />
            </div>

            {/* Right side: Login button + tablet dropdown + mobile hamburger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onLoginClick}
                className="rounded-md bg-brand-green px-3 py-2 text-xs font-black text-white transition hover:bg-brand-green/90 sm:px-4 sm:text-sm uqhd:px-5 uqhd:py-2.5 uqhd:text-base"
              >
                Login
              </button>

              {/* Removed redundant buttons - now using unified burger menu on left */}

              {/* Hamburger ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â mobile only */}
            </div>
          </div>

          {/* Tablet side panel menu */}
          <div className={`fixed inset-0 z-[70] hidden md:block lg:hidden ${tabletMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Backdrop blur overlay - positioned to exclude header from blur */}
            <div 
              className={`absolute left-0 right-0 bottom-0 top-0 bg-black/30 backdrop-blur-md transition-opacity duration-500 ${
                tabletMenuOpen ? "opacity-100" : "opacity-0"
              }`}
              style={{ clipPath: 'polygon(0 4rem, 100% 4rem, 100% 100%, 0 100%)' }}
              onClick={() => setTabletMenuOpen(false)}
              aria-hidden="true"
            />

            <aside className={`absolute left-0 top-0 flex h-dvh w-[330px] max-w-[82vw] flex-col overflow-hidden border-r border-brand-gold/30 bg-gradient-to-b from-brand-green to-brand-green/95 shadow-2xl shadow-black/50 transition-transform duration-500 ease-in-out ${tabletMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex items-center justify-between border-b border-brand-gold/20 bg-brand-green/50 backdrop-blur-sm px-5 py-4">
                  <div className="flex items-center gap-3">
                    <QuickPawnLogo variant="mark" className="h-[42px] w-[42px] shadow-lg" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold drop-shadow-sm">{BRAND_CONFIG.shortCompanyName} PawnShop</p>
                      <p className="text-[8px] font-semibold text-white/60 tracking-wider">{BRAND_CONFIG.tagline}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTabletMenuOpen(false)}
                    aria-label="Close tablet navigation"
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-brand-gold/10 text-brand-gold transition-all duration-200 hover:bg-brand-gold hover:text-brand-green hover:scale-110 hover:rotate-90 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-transparent to-black/10">
                  <div className="space-y-2">
                    {navItems.map((item, index) => {
                      const id = navIdOverrides[item] ?? item.toLowerCase().replace(/ /g, "-");
                      const isActive = activeNavItem === item;
                      return (
                        <a
                          key={`tablet-${item}`}
                          ref={(el) => {
                            navRefs.current[index] = el;
                          }}
                          href={`#${id}`}
                          onClick={(e) => {
                            handleScroll(e, id, item);
                          }}
                          className={`group flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                            isActive
                              ? "border-brand-gold bg-brand-gold/20 text-brand-gold shadow-lg shadow-brand-gold/20 scale-[1.02]"
                              : "border-white/10 bg-white/5 text-white/80 hover:border-brand-gold/50 hover:bg-brand-gold/10 hover:text-brand-gold hover:scale-[1.02] hover:shadow-md"
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${isActive ? "bg-brand-gold shadow-sm shadow-brand-gold/50" : "bg-white/30 group-hover:bg-brand-gold/70 group-hover:shadow-sm"}`} />
                          <span>{item}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-brand-gold/20 bg-brand-green/30 backdrop-blur-sm p-4">
                  <p className="text-center text-[10px] text-white/50 tracking-wide">© 2026 {BRAND_CONFIG.companyName}</p>
                </div>
              </aside>
            </div>

          {/* Mobile drawer menu */}
          <div className={`fixed inset-0 z-[70] md:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Backdrop blur overlay - positioned to exclude header from blur */}
            <div 
              className={`absolute left-0 right-0 bottom-0 top-0 bg-black/30 backdrop-blur-md transition-opacity duration-500 ${
                mobileMenuOpen ? "opacity-100" : "opacity-0"
              }`}
              style={{ clipPath: 'polygon(0 4rem, 100% 4rem, 100% 100%, 0 100%)' }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            
            <aside className={`absolute left-0 top-0 flex h-dvh w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-brand-gold/30 bg-gradient-to-b from-brand-green to-brand-green/95 shadow-2xl shadow-black/50 transition-transform duration-500 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
              <div className="flex items-center justify-between border-b border-brand-gold/20 bg-brand-green/50 backdrop-blur-sm px-5 py-4">
                <div className="flex items-center gap-3">
                  <QuickPawnLogo variant="mark" className="h-[42px] w-[42px] shadow-lg" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold drop-shadow-sm">{BRAND_CONFIG.shortCompanyName} PawnShop</p>
                    <p className="text-[8px] font-semibold text-white/60 tracking-wider">{BRAND_CONFIG.tagline}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-brand-gold/10 text-brand-gold transition-all duration-200 hover:bg-brand-gold hover:text-brand-green hover:scale-110 hover:rotate-90 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-transparent to-black/10">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const id = navIdOverrides[item] ?? item.toLowerCase().replace(/ /g, "-");
                    const isActive = activeNavItem === item;
                    return (
                      <a
                        key={item}
                        href={`#${id}`}
                        onClick={(e) => {
                          handleScroll(e, id, item);
                        }}
                        className={`group flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                          isActive
                            ? "border-brand-gold bg-brand-gold/20 text-brand-gold shadow-lg shadow-brand-gold/20 scale-[1.02]"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-brand-gold/50 hover:bg-brand-gold/10 hover:text-brand-gold hover:scale-[1.02] hover:shadow-md"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${isActive ? "bg-brand-gold shadow-sm shadow-brand-gold/50" : "bg-white/30 group-hover:bg-brand-gold/70 group-hover:shadow-sm"}`} />
                        <span>{item}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-brand-gold/20 bg-brand-green/30 backdrop-blur-sm p-4">
                <p className="text-center text-[10px] text-white/50 tracking-wide">© 2026 {BRAND_CONFIG.companyName}</p>
              </div>
            </aside>
          </div>
        </nav>

        <LandingHero onScroll={handleScroll} />
        <LandingIntro />
        <LandingProblemSolution onScroll={handleScroll} />
        <LandingHowItHelps />
        <LandingStats />
        <LandingBenefits />
        <LandingCloud />
        <LandingProcessPricing onScroll={handleScroll} />
        <LandingTrustBar />
        <LandingFaq />

        {/* --- CLOSING / CONTACT --- */}
        <section id="contact-us" className="bg-brand-gold px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal-on-scroll text-center lg:text-left">
              <h2 className="font-display text-4xl font-bold tracking-tight text-brand-green md:text-5xl">
                Ready to Manage Your Pawnshop Smarter?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-green/85 md:text-lg">
                The way you manage your business affects the way your business grows. Move away
                from complicated, scattered processes and discover a more organized way to manage
                your pawnshop. Start your journey with {BRAND_CONFIG.shortCompanyName} today.
              </p>
              <p className="mt-6 text-sm font-semibold text-brand-green/70">
                Or contact us by sending a message to{" "}
                <a
                  href={supportEmailComposeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-brand-green"
                >
                  {BRAND_CONFIG.email}
                </a>
              </p>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="reveal-on-scroll reveal-delay-200 rounded-2xl bg-white p-6 shadow-xl sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-brand-green/50">Request a demo</p>
              <h3 className="font-display mt-1 text-xl font-bold text-brand-green">Talk to {BRAND_CONFIG.shortCompanyName}</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="landing-contact-name" className="text-xs font-semibold text-brand-green/70">
                    Name
                  </label>
                  <input
                    id="landing-contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={isSendingContact}
                    className="mt-1 w-full rounded-md border border-brand-green/20 px-3 py-2.5 text-sm text-brand-green outline-none transition focus:border-brand-green disabled:opacity-60"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label htmlFor="landing-contact-email" className="text-xs font-semibold text-brand-green/70">
                    Email
                  </label>
                  <input
                    id="landing-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={isSendingContact}
                    className="mt-1 w-full rounded-md border border-brand-green/20 px-3 py-2.5 text-sm text-brand-green outline-none transition focus:border-brand-green disabled:opacity-60"
                    placeholder="you@pawnshop.com"
                  />
                </div>
                <div>
                  <label htmlFor="landing-contact-message" className="text-xs font-semibold text-brand-green/70">
                    Message
                  </label>
                  <textarea
                    id="landing-contact-message"
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    disabled={isSendingContact}
                    className="mt-1 w-full resize-none rounded-md border border-brand-green/20 px-3 py-2.5 text-sm text-brand-green outline-none transition focus:border-brand-green disabled:opacity-60"
                    placeholder="Tell us about your pawnshop..."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSendingContact}
                className="mt-6 w-full rounded-md bg-brand-green py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingContact ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </section>

        <LandingLightFooter
          onScroll={handleScroll}
          onLoginClick={onLoginClick}
          onOpenLegal={(type) => setLegalModal(type)}
        />

        {legalModal && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
            onClick={() => setLegalModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="landing-legal-modal-title"
              className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label={legalModalContent[legalModal].ariaLabel}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative overflow-hidden bg-brand-green/90 px-6 pb-6 pt-7 text-white sm:px-8">
                <div className="absolute right-[-28px] top-[-42px] h-36 w-36 rounded-full bg-white/5" />
                <div className="absolute bottom-[-34px] left-[-18px] h-28 w-28 rounded-full bg-white/5" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">{BRAND_CONFIG.companyName}</p>
                  <h3 id="landing-legal-modal-title" className="mt-2 text-2xl font-bold">{legalModalContent[legalModal].title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                    {legalModalContent[legalModal].intro}
                  </p>
                </div>
              </div>

              <div className="relative bg-brand-green/90">
                <div className="h-2 rounded-t-xl bg-stone-100" />
                <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
              </div>

              <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
                <div className="space-y-4">
                  {legalModalContent[legalModal].sections.map((section, index) => (
                    <section key={section.title} className="border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/90 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-brand-green">{section.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-600">{section.body}</p>
                          {section.contactItems && (
                            <ul className="mt-2 space-y-1.5">
                              {section.contactItems.map((item: { label: string; value: string }) => (
                                <li key={item.label} className="text-sm text-zinc-600">
                                  <span className="font-bold text-brand-green">{item.label}:</span>{" "}{item.value}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-200 bg-white/60 px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="w-full bg-brand-green/90 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green/80"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to top button */}
      <button
        type="button"
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold text-brand-green shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white hover:text-brand-green ${showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-12 opacity-0"}`}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setActiveNavItem("HOME");
          window.history.pushState(null, "", "#home");
        }}
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
