"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { AnimatedGradient } from "@/components/shared/animated-gradient";
import { api } from "@/lib/api";
import { FeaturedSaleItems } from "./featured-sale-items";

// Lazy-load BranchMap component (Requirements: 12.1)
const BranchMap = dynamic(
  () => import('@/components/branch-map').then(mod => ({ default: mod.BranchMap })),
  {
    ssr: false, // Critical: Leaflet requires browser window
    loading: () => (
      <div className="h-40 w-full flex items-center justify-center bg-brand-green/10">
        <span className="text-sm text-brand-green/60">Loading map...</span>
      </div>
    )
  }
);

interface AuthLandingPageProps {
  onLoginClick: () => void;
}

const navItems = ["HOME", "HOW IT WORKS", "WHAT WE BUY", "WHY US", "ITEMS FOR SALE", "REVIEWS", "BRANCHES", "CONTACT US"];

const sectionNavLabels: Record<string, string> = {
  home: "HOME",
  "how-it-works": "HOW IT WORKS",
  categories: "WHAT WE BUY",
  "why-us": "WHY US",
  "items-for-sale": "ITEMS FOR SALE",
  reviews: "REVIEWS",
  branches: "BRANCHES",
  "contact-us": "CONTACT US",
};

// Maps nav label text to a section ID when the label differs from the auto-generated id
const navIdOverrides: Record<string, string> = {
  "WHAT WE BUY": "categories",
};

type LegalModalType = "privacy" | "terms" | null;

interface PublicBranch {
  id: string;
  branch_code?: string | null;
  name: string;
  location?: string | null;
}

const termsSections = [
  {
    title: "Website Information",
    body: "The JCLB Buy Back Pawnshop website provides general information about our pawnshop services, branch operations, item selling, buy back services, and customer support. It is intended for customers and visitors who want to learn about our business.",
  },
  {
    title: "No Online Transaction Guarantee",
    body: "Information shown on the website does not guarantee approval of a pawn, sale, renewal, redemption, or any other transaction. Final service terms, item appraisal, pricing, fees, and acceptance are handled by authorized JCLB Buy Back Shop personnel.",
  },
  {
    title: "Customer Responsibilities",
    body: "Customers are responsible for providing accurate contact information, valid identification, truthful item details, and lawful ownership documents when required. Customers should review official receipts, pawn tickets, and agreements before completing a branch transaction.",
  },
  {
    title: "Service Availability",
    body: "Services, branch schedules, item availability, prices, promotions, and business requirements may change without prior notice. Some services may depend on branch location, staff review, item condition, and applicable pawnshop regulations.",
  },
  {
    title: "Respectful Use",
    body: "Visitors must not misuse the website, attempt unauthorized access to employee or administrator areas, submit false information, interfere with system security, or use the website for unlawful, harmful, or misleading activity.",
  },
  {
    title: "Internal Login",
    body: "The login area is reserved for authorized JCLB Buy Back Shop employees and administrators. Customers do not need an account to read the public information on this landing page.",
  },
  {
    title: "Limitations",
    body: "Website content is provided for general guidance only and should not replace official branch documents, signed agreements, receipts, or direct assistance from JCLB Buy Back Shop personnel.",
  },
  {
    title: "Acceptance",
    body: "By using this website, you agree to these terms and to any official policies, notices, and legal requirements that apply to JCLB Buy Back Shop services.",
  },
];

const privacySections = [
  {
    title: "Information We May Collect",
    body: "When customers contact us or complete branch transactions, JCLB Buy Back Shop may collect information such as name, contact details, identification details, item descriptions, photos, transaction records, and service-related documents.",
  },
  {
    title: "How We Use Information",
    body: "We use customer information to verify identity, evaluate pawned or sold items, process transactions, issue receipts or pawn tickets, manage renewals and redemptions, respond to inquiries, improve service, and comply with legal or regulatory requirements.",
  },
  {
    title: "Branch and Transaction Records",
    body: "Customer and transaction records may be stored in our internal Pawnshop Management System so authorized personnel can manage customer service, item inventory, payments, audit reviews, reports, and required business documentation.",
  },
  {
    title: "Sharing of Information",
    body: "We do not sell customer personal information. We may share information only when needed for business operations, customer requests, legal compliance, fraud prevention, security review, or cooperation with authorized government or regulatory offices.",
  },
  {
    title: "Data Protection",
    body: "We use reasonable administrative, technical, and access-control safeguards to protect customer information. Only authorized employees and administrators may access customer records when needed for legitimate pawnshop operations.",
  },
  {
    title: "Customer Choices",
    body: "Customers may contact JCLB Buy Back Shop to ask about their records, request corrections, or raise privacy concerns, subject to identity verification, record retention rules, and applicable law.",
  },
  {
    title: "Website Visitors",
    body: "Public visitors can browse the landing page without logging in. Basic technical information may still be processed by normal website hosting, browser, security, or analytics tools if they are enabled.",
  },
  {
    title: "Policy Updates",
    body: "We may update this Privacy Policy as our services, systems, or legal requirements change. Updated policy content will apply once posted or otherwise made available.",
  },
];

const legalModalContent = {
  privacy: {
    title: "Privacy Policy",
    ariaLabel: "Close privacy policy",
    intro: "This policy explains how JCLB Buy Back Shop handles customer and visitor information for inquiries, branch transactions, item records, customer support, and required business documentation.",
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    ariaLabel: "Close terms of service",
    intro: "These terms explain general use of the JCLB Buy Back Shop website and public information for customers, visitors, and anyone learning about our pawnshop services.",
    sections: termsSections,
  },
};

const steps = [
  {
    step: "01",
    title: "Send Your Item Details",
    desc: "Message us on Facebook with photos and details of your item. We accept gadgets, appliances, accessories, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Get a Fair Offer",
    desc: "Our team reviews your submission and gives you a fair, competitive buy-back price - usually within the same day.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Get Paid Instantly",
    desc: "Agree to the offer, drop off or ship your item, and get paid instantly. Cash on hand or digital transfer - your choice.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const categories = [
  {
    name: "SMARTPHONES",
    desc: "iPhone, Samsung and More",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    name: "LAPTOP & PCs",
    desc: "All brands accepted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
      </svg>
    ),
  },
  {
    name: "APPLIANCES",
    desc: "Smart and Large Electronics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 21h8M12 17v4M6 8h.01M6 12h.01" />
      </svg>
    ),
  },
  {
    name: "GAMING CONSOLES",
    desc: "PSP, Xbox or Nintendo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M9 12h6M12 9v6M18 2l4 4-8 8-4-4 8-8z" />
      </svg>
    ),
  },
  {
    name: "CAMERAS",
    desc: "DSLR, mirrorless and action cams",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  {
    name: "SMARTWATCHES",
    desc: "Apple Watch or Galaxy Watch",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <rect x="7" y="5" width="10" height="14" rx="2" /><path d="M9 5V3h6v2M9 19v2h6v-2M12 9v4l2 2" />
      </svg>
    ),
  },
  {
    name: "AUDIO & EARPHONES",
    desc: "Headphones, TWS or Speakers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm16 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
      </svg>
    ),
  },
  {
    name: "OTHER ITEMS",
    desc: "Ask us - we might buy it!",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />
      </svg>
    ),
  },
];

const reasons = [
  {
    title: "Same-Day Offers",
    desc: "We respond fast. Submit your item in the morning and have an offer by afternoon - no waiting around.",
  },
  {
    title: "Honest & Transparent",
    desc: "Our pricing is based on current market values. We explain every offer so you know exactly what you're getting.",
  },
  {
    title: "Secure Transactions",
    desc: "Every deal is handled with full transparency. Your items and your money are always protected.",
  },
  {
    title: "Trusted by Hundreds",
    desc: "Hundreds of satisfied sellers trust JCLB for their buy-back needs. Join our growing community today.",
  },
];

const allReviews = [
  { name: "Manon M.", sold: "Sold an iPhone 12", initials: "MM", quote: "Super fast response! I messaged them about my old iPhone and got an offer within a few hours. Payment was smooth and no issues at all." },
  { name: "Carlos R.", sold: "Sold a MacBook Pro", initials: "CR", quote: "Best buy-back shop I've tried. They gave me a fair price for my laptop and the whole process took less than a day. Highly recommend!" },
  { name: "Mindy Meeks", sold: "Sold a Samsung Galaxy", initials: "MM", quote: "Very professional and trustworthy. They explained everything clearly and I felt comfortable with the whole transaction. Will sell again!" },
  { name: "Taesan H.", sold: "Sold a MacBook Air", initials: "TH", quote: "No lowball offers like other shops. They gave me the great price for my laptop and paid on the spot." },
  { name: "Joshua H.", sold: "Sold a PS5 Controller", initials: "JH", quote: "Legit and trustworthy! The offer was fair and they explained everything. Will definitely sell again with JCLB. Highly recommended!" },
  { name: "Maria L.", sold: "Sold an iPad Pro", initials: "ML", quote: "Quick and easy process. Got a great offer for my iPad and the payment was instant. Very satisfied with the service!" },
];

export function AuthLandingPage({ onLoginClick }: AuthLandingPageProps) {
  const [activeNavItem, setActiveNavItem] = useState("HOME");
  const [underlineLeft, setUnderlineLeft] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [publicBranches, setPublicBranches] = useState<PublicBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const lastScrollY = useRef(0);

  const totalSlides = allReviews.length;

  const goToReview = (next: number) => {
    setReviewIndex((next + totalSlides) % totalSlides);
  };

  const prevReview = () => goToReview(reviewIndex - 1);
  const nextReview = () => goToReview(reviewIndex + 1);
  const prevHeroSlide = () => setSlideIndex((prev) => (prev - 1 + 3) % 3);
  const nextHeroSlide = () => setSlideIndex((prev) => (prev + 1) % 3);
  const branchCountLabel =
    publicBranches.length > 0
      ? `${publicBranches.length} ${publicBranches.length === 1 ? "Branch" : "Branches"}`
      : "View available branches";

  const loadPublicBranches = async () => {
    if (publicBranches.length > 0 || isLoadingBranches) return;

    setIsLoadingBranches(true);
    setBranchLoadError("");
    try {
      const data = await api.get<PublicBranch[]>("/auth/signup/branches", {
        suppressApiIssueLogging: true,
      });
      setPublicBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      setBranchLoadError(error instanceof Error ? error.message : "Could not load branches.");
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const openBranchModal = async () => {
    setBranchModalOpen(true);
    await loadPublicBranches();
  };

  useEffect(() => {
    void loadPublicBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // For seamless sliding, we wrap the reviews
  const extendedReviews = [
    allReviews[allReviews.length - 1],
    ...allReviews,
    allReviews[0],
  ];

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
      const offset = 64; // Header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      window.history.pushState(null, "", `#${id}`);
    }, 50);
  };

  const handleContactUsClick = () => {
    const element = document.getElementById("contact-us");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", "#contact-us");
    }
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

  // Auto-advance slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-brand-gold selection:text-brand-green">
      {/* Plain white background */}

      <div className="relative z-10">
        {/* ─── NAV ─── */}
        <nav className={`fixed left-0 right-0 top-0 z-[80] border-b border-white/10 bg-brand-green transition-transform duration-300 ease-in-out ${(isNavVisible || mobileMenuOpen || tabletMenuOpen) ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 md:px-6 lg:px-12">
            {/* Logo - Desktop only (lg and up) */}
            <Image 
              src="/logo.png" 
              alt="JCLB" 
              width={48} 
              height={48} 
              className="hidden lg:block rounded-lg cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                handleScroll(e, "home", "HOME");
              }} 
            />
            
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
              className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg text-brand-gold transition hover:bg-brand-gold/10"
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
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 lg:flex xl:gap-8">
              {navItems.map((item, index) => {
                const id = navIdOverrides[item] ?? item.toLowerCase().replace(/ /g, "-");
                return (
                  <a key={item} ref={(el) => { navRefs.current[index] = el; }} href={`#${id}`}
                    onClick={(e) => handleScroll(e, id, item)}
                    className={`whitespace-nowrap text-[11px] font-bold tracking-wider transition-colors xl:text-sm ${activeNavItem === item ? "text-brand-gold" : "text-white hover:text-brand-gold"}`}>
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
                className="rounded-lg bg-brand-gold px-3 py-2 text-xs font-black text-brand-green transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-gold/20 hover:brightness-110 active:translate-y-0 active:scale-95 sm:px-4 sm:text-sm"
              >
                Login / Sign Up
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
                    <Image src="/logo.png" alt="JCLB" width={42} height={42} className="rounded-lg shadow-lg" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold drop-shadow-sm">JCLB PawnShop</p>
                      <p className="text-[8px] font-semibold text-white/60 tracking-wider">Buy Back Shop</p>
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
                  <p className="text-center text-[10px] text-white/50 tracking-wide">© 2026 JCLB Buy Back Shop</p>
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
                  <Image src="/logo.png" alt="JCLB" width={42} height={42} className="rounded-lg shadow-lg" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold drop-shadow-sm">JCLB PawnShop</p>
                    <p className="text-[8px] font-semibold text-white/60 tracking-wider">Buy Back Shop</p>
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
                <p className="text-center text-[10px] text-white/50 tracking-wide">© 2026 JCLB Buy Back Shop</p>
              </div>
            </aside>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section id="home" className="group relative pt-16 bg-brand-green flex flex-col justify-center lg:min-h-screen">
          {/* Full-width container */}
          <div className="w-full overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out items-center"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {["one.png", "two.png", "three.png"].map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img}
                  src={`/${img}`}
                  alt=""
                  className="w-full shrink-0 object-contain lg:object-fill lg:h-[calc(100vh-4rem)]"
                  style={{
                    display: "block",
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* â†â† HOW IT WORKS â†â† */}
        <section id="how-it-works" className="bg-white px-3 py-12 sm:px-6 sm:py-20 md:px-12 md:py-32 lg:py-48">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <h2 className="text-xl font-black text-brand-green sm:text-3xl md:text-4xl lg:text-5xl">
              <span className="text-brand-gold">3</span> Steps to Get Your Cash
            </h2>
            <div className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-4 sm:grid-cols-2 md:mt-12 md:grid-cols-3 md:gap-6">
              {steps.map((item, index) => (
                <div key={item.step}
                  className="reveal-on-scroll flex flex-col rounded-lg bg-brand-green p-3 text-white shadow-xl h-full sm:rounded-2xl sm:p-5 md:p-8">
                  <div className="flex items-center gap-2 mb-2.5 sm:gap-4 sm:mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white sm:h-12 sm:w-12 sm:rounded-xl">
                      {item.icon}
                    </div>
                    <span className="text-xl font-black text-brand-gold sm:text-3xl">{item.step}</span>
                  </div>
                  <h3 className="text-sm font-bold sm:text-lg">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/75 flex-1 sm:mt-3 sm:text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CATEGORIES / ITEMS WE ACCEPT ─── */}
        <section id="categories" className="bg-brand-green flex flex-col justify-center lg:min-h-[calc(100vh-4rem)] py-4 lg:py-0 lg:!scroll-mt-16">
          {/* Full-width container */}
          <div className="w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/itemsweaccept.png"
              alt="Items We Accept"
              className="w-full shrink-0 object-contain"
              style={{ display: "block" }}
            />
          </div>
        </section>

        {/* â†â† WHY US â†â† */}
        <section id="why-us" className="bg-white px-4 py-16 md:px-12 md:py-24 lg:pt-48 lg:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:gap-12 reveal-on-scroll">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">WHY CHOOSE US?</p>
              <h2 className="mt-2 text-4xl font-black leading-tight text-brand-green md:text-5xl">
                Fair Prices. Fast Cash.<br /><span className="text-brand-green/80">ZERO HASSLE.</span>
              </h2>
              <div className="mt-8 rounded-2xl bg-brand-green p-8 shadow-2xl">
                <p className="text-base leading-relaxed text-white">
                  We believe everyone deserves a fair price for their pre-loved items - no low-balling, no runarounds.
                </p>
                <p className="mt-4 text-xs text-brand-gold">- JCLB Buy Back Shop Team</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-gold px-4 py-1.5">
                  <span className="text-sm font-black text-brand-green">5.0</span>
                  <span className="text-[10px] font-bold text-brand-green">CUSTOMER RATING</span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              {reasons.map((item) => (
                <div key={item.title}
                  className="flex items-start gap-4 rounded-xl bg-brand-green/8 p-5 shadow-sm transition-colors hover:bg-brand-green/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-green">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ ITEMS FOR SALE ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <FeaturedSaleItems />

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ REVIEWS CAROUSEL ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <section id="reviews" className="bg-white px-4 py-16 md:px-10 md:py-24 lg:pt-48 lg:pb-48">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">CUSTOMER REVIEWS</p>
            <h2 className="mt-2 text-3xl font-black text-brand-green md:text-4xl lg:text-5xl">What Our Sellers Say</h2>

            <div className="relative mt-8 flex items-center gap-2 md:mt-12 md:gap-3 lg:gap-4">
              {/* Left arrow */}
              <button onClick={prevReview}
                className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white shadow-lg transition hover:bg-brand-green/90 active:scale-95 md:h-12 md:w-12">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Mobile: single card */}
              <div className="flex-1 md:hidden">
                <div className="rounded-2xl bg-brand-green p-5 text-white shadow-2xl">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, si) => (
                      <svg key={si} className="h-4 w-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-white/90">&ldquo;{allReviews[reviewIndex].quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold text-sm font-black text-brand-green">
                      {allReviews[reviewIndex].initials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{allReviews[reviewIndex].name}</p>
                      <p className="text-xs text-white/60">{allReviews[reviewIndex].sold}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: 3-card carousel */}
              <div className="hidden flex-1 overflow-hidden py-8 md:block lg:py-10">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${(1 - (reviewIndex + 1)) * 33.333}%)` }}
                >
                  {extendedReviews.map((review, i) => {
                    const isCenter = i === reviewIndex + 1;
                    return (
                      <div key={`${review.name}-${i}`} className="w-1/3 shrink-0 px-2 transition-all duration-500 lg:px-4">
                        <div className={`h-full rounded-2xl p-4 shadow-lg transition-all duration-500 lg:p-6 ${
                          isCenter
                            ? "bg-brand-green text-white scale-105 shadow-2xl z-10"
                            : "bg-brand-green/8 text-brand-green scale-95 opacity-50"
                        }`}>
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, si) => (
                              <svg key={si} className="h-4 w-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className={`mb-5 text-xs leading-relaxed lg:mb-6 lg:text-sm ${isCenter ? "text-white/90" : "text-zinc-600"}`}>
                            &ldquo;{review.quote}&rdquo;
                          </p>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${isCenter ? "bg-brand-gold text-brand-green" : "bg-brand-green text-white"}`}>
                              {review.initials}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold leading-tight ${isCenter ? "text-white" : "text-brand-green"}`}>{review.name}</p>
                              <p className={`text-xs ${isCenter ? "text-white/60" : "text-zinc-400"}`}>{review.sold}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right arrow */}
              <button onClick={nextReview}
                className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white shadow-lg transition hover:bg-brand-green/90 active:scale-95 md:h-12 md:w-12">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Dots */}
            <div className="mt-4 flex justify-center gap-2 md:mt-6">
              {allReviews.map((_, i) => (
                <button key={i} onClick={() => goToReview(i)}
                  className={`h-2 rounded-full transition-all ${i === reviewIndex ? "w-6 bg-brand-green" : "w-2 bg-brand-green/30"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ BRANCH LOCATIONS ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <section id="branches" className="bg-white px-6 pt-20 pb-32 md:px-12 md:pt-28 md:pb-40">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">FIND US</p>
            <h2 className="mt-2 text-4xl font-black text-brand-green md:text-5xl">Our Branch Locations</h2>
            <p className="mt-3 text-base text-brand-green/60">
              {publicBranches.length > 0
                ? `Visit us at any of our ${branchCountLabel.toLowerCase()}.`
                : "Visit us at any available JCLB Buy Back Shop branch."}
            </p>

            {isLoadingBranches ? (
              <div className="mt-10 rounded-2xl border border-brand-green/20 bg-brand-green/5 px-6 py-10 text-center text-sm font-bold text-brand-green/60">
                Loading branch locations...
              </div>
            ) : branchLoadError ? (
              <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-semibold text-red-700">
                {branchLoadError}
              </div>
            ) : publicBranches.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-brand-green/20 bg-brand-green/5 px-6 py-10 text-center text-sm font-bold text-brand-green/60">
                Branch locations will be posted soon.
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicBranches.map((branch) => (
                <div key={branch.id} className="rounded-2xl bg-brand-green overflow-hidden shadow-xl">
                  {/* Interactive map with geocoding (Requirements: 9.1, 9.2) */}
                  <BranchMap 
                    branchName={branch.name}
                    location={branch.location}
                    branchId={branch.id}
                  />
                  <div className="p-5">
                    <h3 className="font-black text-white text-lg">{branch.name}</h3>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 mt-0.5 text-brand-gold">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {branch.location?.trim() || "Address will be announced soon."}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-brand-gold">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Branch hours may vary
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-brand-gold">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Contact through Facebook
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.location?.trim() || branch.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block w-full rounded-xl bg-brand-gold py-2.5 text-center text-sm font-black text-brand-green transition-colors hover:bg-brand-gold"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </section>

        {/* --- CONTACT CTA --- */}
        <section
          id="contact-us"
          className="bg-brand-gold px-6 py-20 md:px-12 md:py-32"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-4xl font-black tracking-tight text-brand-green md:text-5xl lg:text-6xl">Ready to Turn Your Items Into Cash?</h2>
            <p className="text-xl font-bold text-brand-green/90 md:text-2xl lg:text-3xl">
              It only takes a minute to start.
            </p>
          </div>
        </section>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ FOOTER ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <footer className="bg-brand-green px-6 pt-10 pb-0 md:px-8 md:pt-12 md:pb-0 lg:px-16 lg:pt-14 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl">
            {/* Brand & Contact - Side by side on large screens */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-8 mb-6 md:mb-8">
              {/* Brand - Centered on mobile, left-aligned on desktop */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left mb-6 lg:mb-0 lg:flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Image src="/logo.png" alt="JCLB" width={48} height={48} className="rounded-lg" />
                  <div>
                    <p className="text-xs font-bold text-brand-gold uppercase tracking-widest">JCLB BUY BACK</p>
                    <p className="text-xl font-black text-white leading-none">Pawnshop</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/50 lg:text-sm max-w-md">
                  Your trusted partner for buying back pre-loved gadgets and electronics. Fast, fair, and friendly - that&apos;s the{" "}
                  <span className="text-brand-gold font-bold">JCLB promise.</span>
                </p>
              </div>

            {/* Contact - Horizontal Cards */}
            <div className="lg:flex-1 lg:max-w-xl">
              <p className="mb-3 text-center lg:text-left text-[11px] font-black uppercase tracking-widest text-brand-gold lg:text-xs">CONTACT US</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-1 lg:gap-2">
                  {[
                    { icon: "f", label: "Facebook", sub: "JCLB Buy Back Shop", color: "bg-blue-600" },
                    { icon: "@", label: "Email Us", sub: "Compose with Gmail", color: "bg-red-500" },
                    { icon: "pin", label: "Visit Us", sub: branchCountLabel, color: "bg-brand-green/70" },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => {
                        if (c.label === "Facebook") {
                          window.open("https://www.facebook.com/JclbBuyBackShop", "_blank", "noopener,noreferrer");
                          return;
                        }
                        if (c.label === "Email Us") {
                          window.open("https://mail.google.com/mail/?view=cm&fs=1", "_blank", "noopener,noreferrer");
                          return;
                        }
                        void openBranchModal();
                      }}
                      className="flex w-full items-center gap-2 lg:gap-2.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 lg:px-3 lg:py-2.5 text-left transition-colors hover:bg-white/10"
                    >
                      <div className={`flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-md ${c.color} text-white text-xs font-black`}>
                        {c.icon === "pin" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4 lg:h-[18px] lg:w-[18px]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                        ) : (
                          c.icon
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] lg:text-xs font-bold text-white">{c.label}</p>
                        <p className="break-words text-[10px] lg:text-[11px] text-white/50">{c.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-center justify-center gap-5 border-t border-white/10 pt-5 pb-0 text-xs text-white/40">
              {/* Copyright */}
              <div className="text-center">
                <span>&copy; 2026 JCLB Buy Back Shop. All rights reserved.</span>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacy")}
                    className="font-bold text-brand-gold/70 transition hover:text-brand-gold hover:underline"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => setLegalModal("terms")}
                    className="font-bold text-brand-gold/70 transition hover:text-brand-gold hover:underline"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            </div>
             </div>
         
        </footer>

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
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">JCLB Buy Back Pawnshop</p>
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

        {branchModalOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
            onClick={() => setBranchModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="branch-list-modal-title"
              className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setBranchModalOpen(false)}
                aria-label="Close branch list"
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
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">JCLB Buy Back Pawnshop</p>
                  <h3 id="branch-list-modal-title" className="mt-2 text-2xl font-bold">Available Branches</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                    Visit any active branch below for in-person appraisal, item drop-off, payment, renewal, redemption, or customer assistance.
                  </p>
                </div>
              </div>

              <div className="relative bg-brand-green/90">
                <div className="h-2 rounded-t-xl bg-stone-100" />
                <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
              </div>

              <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
                {isLoadingBranches ? (
                  <p className="py-10 text-center text-sm font-semibold text-zinc-500">Loading branches...</p>
                ) : branchLoadError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {branchLoadError}
                  </div>
                ) : publicBranches.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-zinc-500">No public branches are available right now.</p>
                ) : (
                  <div className="space-y-3">
                    {publicBranches.map((branch) => (
                      <section key={branch.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-green/90 text-sm font-black text-white">
                            {branch.branch_code || branch.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-brand-green">{branch.name}</h4>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                              {branch.location?.trim() || "Address will be announced soon."}
                            </p>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 bg-white/60 px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="w-full bg-brand-green/90 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green/80"
                >
                  Close
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
