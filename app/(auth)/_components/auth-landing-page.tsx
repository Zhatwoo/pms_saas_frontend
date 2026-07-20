"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BRAND_CONFIG } from "@/lib/brand-config";

interface AuthLandingPageProps {
  onLoginClick: () => void;
}

const navItems = ["FEATURES", "WHY CHOOSE US", "HOW IT WORKS", "PRICING", "REVIEWS"];

const sectionNavLabels: Record<string, string> = {
  features: "FEATURES",
  "why-choose-us": "WHY CHOOSE US",
  "how-it-works": "HOW IT WORKS",
  pricing: "PRICING",
  reviews: "REVIEWS",
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
    body: `The ${BRAND_CONFIG.companyName} website provides general information about our pawnshop services, branch operations, item selling, buy back services, and customer support. It is intended for customers and visitors who want to learn about our business.`,
  },
  {
    title: "No Online Transaction Guarantee",
    body: `Information shown on the website does not guarantee approval of a pawn, sale, renewal, redemption, or any other transaction. Final service terms, item appraisal, pricing, fees, and acceptance are handled by authorized ${BRAND_CONFIG.companyName} personnel.`,
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
    body: `The login area is reserved for authorized ${BRAND_CONFIG.companyName} employees and administrators. Customers do not need an account to read the public information on this landing page.`,
  },
  {
    title: "Limitations",
    body: `Website content is provided for general guidance only and should not replace official branch documents, signed agreements, receipts, or direct assistance from ${BRAND_CONFIG.companyName} personnel.`,
  },
  {
    title: "Acceptance",
    body: `By using this website, you agree to these terms and to any official policies, notices, and legal requirements that apply to ${BRAND_CONFIG.companyName} services.`,
  },
];

const privacySections = [
  {
    title: "Information We May Collect",
    body: `When customers contact us or complete branch transactions, ${BRAND_CONFIG.companyName} may collect information such as name, contact details, identification details, item descriptions, photos, transaction records, and service-related documents.`,
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
    body: `Customers may contact ${BRAND_CONFIG.companyName} to ask about their records, request corrections, or raise privacy concerns, subject to identity verification, record retention rules, and applicable law.`,
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
    intro: `This policy explains how ${BRAND_CONFIG.companyName} handles customer and visitor information for inquiries, branch transactions, item records, customer support, and required business documentation.`,
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    ariaLabel: "Close terms of service",
    intro: `These terms explain general use of the ${BRAND_CONFIG.companyName} website and public information for customers, visitors, and anyone learning about our pawnshop services.`,
    sections: termsSections,
  },
};

const reasons = [
  {
    title: "Lowest Rates Guaranteed",
    desc: "Our pricing is based on current market values - no low-balling, no hidden charges, no runarounds.",
  },
  {
    title: "Instant Payouts",
    desc: "Get an offer and receive your cash the same day. Cash on hand or digital transfer - your choice.",
  },
  {
    title: "Honest & Transparent",
    desc: "We explain every offer so you know exactly what you're getting before any deal is closed.",
  },
];

const steps = [
  {
    step: "01",
    title: "Digital Submission",
    desc: "Send photos and details of your item online. We accept gadgets, appliances, accessories, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Transparent Offer",
    desc: "Our team reviews your submission and gives you a fair, market-based appraisal - usually within the same day.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Instant Payout",
    desc: "Agree to the offer, drop off your item at any branch, and get paid instantly - cash or digital transfer.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const pricingPlans = [
  {
    tier: "STARTER",
    name: "Basic",
    price: "$29",
    period: "/mo",
    cta: "Get Started",
    popular: false,
    features: [
      { label: "1 Branch", included: true },
      { label: "Basic Reporting", included: true },
      { label: "Email Support", included: true },
      { label: "Advanced Analytics", included: false },
    ],
  },
  {
    tier: "ACCELERATE",
    name: "Pro",
    price: "$79",
    period: "/mo",
    cta: "Choose Pro",
    popular: true,
    features: [
      { label: "Up to 5 Branches", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Priority Support", included: true },
      { label: "Multi-user Access", included: true },
    ],
  },
  {
    tier: "SCALE",
    name: "Enterprise",
    price: "Custom",
    period: "",
    cta: "Contact Sales",
    popular: false,
    features: [
      { label: "Unlimited Branches", included: true },
      { label: "Custom Integrations", included: true },
      { label: "Dedicated Manager", included: true },
      { label: "Custom SLAs", included: true },
    ],
  },
];

const compareRows: { label: string; basic: string | boolean; pro: string | boolean; enterprise: string | boolean }[] = [
  { label: "Max Branches", basic: "1", pro: "5", enterprise: "Unlimited" },
  { label: "Cloud Backups", basic: true, pro: true, enterprise: true },
  { label: "Inventory Management", basic: true, pro: true, enterprise: true },
  { label: "Real-time Dashboard", basic: false, pro: true, enterprise: true },
  { label: "Custom API Access", basic: false, pro: false, enterprise: true },
  { label: "Support SLA", basic: "48h Response", pro: "4h Response", enterprise: "Instant/Dedicated" },
];

const pricingFaqs = [
  {
    question: "Can I upgrade or downgrade later?",
    answer: "Yes. You can switch plans anytime from your account settings. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.",
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, every plan starts with a 14-day free trial with full access to all features. No credit card required to start.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data stays available for export for 30 days after cancellation. After that period, it is permanently deleted from our servers.",
  },
  {
    question: "Do you offer yearly discounts?",
    answer: "Yes. Paying annually saves you two months compared to monthly billing. Contact us for volume discounts on Enterprise plans.",
  },
];

const allReviews = [
  { name: "Maria L.", sold: "Sold an iPad Pro", initials: "ML", quote: "Quick and easy process. Got a great offer for my iPad and the payment was instant. Very satisfied with the service!" },
  { name: "Manon M.", sold: "Sold an iPhone 12", initials: "MM", quote: "Super fast response! I messaged them about my old iPhone and got an offer within a few hours. Payment was smooth and no issues at all." },
  { name: "Carlos R.", sold: "Sold a MacBook Pro", initials: "CR", quote: "Best buy-back shop I've tried. They gave me a fair price for my laptop and the whole process took less than a day. Highly recommend!" },
  { name: "Taesan H.", sold: "Sold a MacBook Air", initials: "TH", quote: "No lowball offers like other shops. They gave me the great price for my laptop and paid on the spot." },
  { name: "Joshua H.", sold: "Sold a PS5 Controller", initials: "JH", quote: `Legit and trustworthy! The offer was fair and they explained everything. Will definitely sell again with ${BRAND_CONFIG.shortCompanyName}. Highly recommended!` },
  { name: "Mindy Meeks", sold: "Sold a Samsung Galaxy", initials: "MM", quote: "Very professional and trustworthy. They explained everything clearly and I felt comfortable with the whole transaction. Will sell again!" },
];

const CREAM = "#F5F1E8";

function Stars({ dark = false }: { dark?: boolean }) {
  return (
    <div className="mb-3 flex gap-1">
      {[...Array(5)].map((_, si) => (
        <svg key={si} className={`h-4 w-4 ${dark ? "text-brand-green" : "text-brand-gold"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function AuthLandingPage({ onLoginClick }: AuthLandingPageProps) {
  const [activeNavItem, setActiveNavItem] = useState("FEATURES");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [publicBranches, setPublicBranches] = useState<PublicBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const lastScrollY = useRef(0);

  const totalSlides = allReviews.length;
  const goToReview = (next: number) => setReviewIndex((next + totalSlides) % totalSlides);
  const prevReview = () => goToReview(reviewIndex - 1);
  const nextReview = () => goToReview(reviewIndex + 1);

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  const handleScroll = (e: React.MouseEvent<HTMLElement>, id: string, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const element = document.getElementById(id);
    if (!element) return;
    setActiveNavItem(item);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const offset = 72;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }, 50);
  };

  useEffect(() => {
    const handleScrollSync = () => {
      const sections = document.querySelectorAll("section[id]");
      const { scrollY, innerHeight } = window;
      setShowBackToTop(scrollY > innerHeight * 0.5);

      if (scrollY > lastScrollY.current + 10 && scrollY > 100) {
        setIsNavVisible(false);
      } else if (scrollY < lastScrollY.current - 10 || scrollY <= 50) {
        setIsNavVisible(true);
      }
      lastScrollY.current = scrollY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 100) {
          const mapped = sectionNavLabels[section.id];
          if (mapped) setActiveNavItem(mapped);
        }
      });
    };
    window.addEventListener("scroll", handleScrollSync);
    return () => window.removeEventListener("scroll", handleScrollSync);
  }, []);

  // Extended list for seamless 3-card carousel
  const extendedReviews = [allReviews[allReviews.length - 1], ...allReviews, allReviews[0]];

  return (
    <div className="min-h-screen bg-brand-green selection:bg-brand-gold selection:text-brand-green">
      {/* ─── NAV ─── */}
      <nav
        className={`fixed left-0 right-0 top-0 z-[80] border-b border-white/10 bg-brand-green/95 backdrop-blur transition-transform duration-300 ease-in-out ${
          isNavVisible || mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          {/* Brand */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setActiveNavItem("FEATURES");
            }}
            className="flex items-center gap-2.5"
          >
            <Image src={BRAND_CONFIG.companyLogo} alt={BRAND_CONFIG.shortCompanyName} width={36} height={36} className="rounded-lg" />
            <span className="text-sm font-black tracking-tight text-white sm:text-base">
              {BRAND_CONFIG.shortCompanyName}{" "}
              <span className="text-brand-gold">Pawnshop</span>
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const id = item.toLowerCase().replace(/ /g, "-");
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  onClick={(e) => handleScroll(e, id, item)}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    activeNavItem === item ? "text-brand-gold" : "text-white/80 hover:text-brand-gold"
                  }`}
                >
                  {item}
                </a>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onLoginClick}
              className="hidden text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:text-brand-gold sm:block"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full bg-brand-gold px-4 py-2 text-xs font-black text-brand-green transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-gold/25 hover:brightness-110 active:translate-y-0 active:scale-95 sm:px-5 sm:text-sm"
            >
              Sign Up
            </button>

            {/* Mobile burger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-gold transition hover:bg-brand-gold/10 lg:hidden"
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-brand-green px-4 py-4 lg:hidden">
            <div className="space-y-2">
              {navItems.map((item) => {
                const id = item.toLowerCase().replace(/ /g, "-");
                const isActive = activeNavItem === item;
                return (
                  <a
                    key={item}
                    href={`#${id}`}
                    onClick={(e) => handleScroll(e, id, item)}
                    className={`block rounded-lg border px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${
                      isActive
                        ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-brand-gold/50 hover:text-brand-gold"
                    }`}
                  >
                    {item}
                  </a>
                );
              })}
              <button
                type="button"
                onClick={onLoginClick}
                className="block w-full rounded-lg bg-brand-gold px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] text-brand-green"
              >
                Log In / Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section id="home" className="relative overflow-hidden bg-brand-green pt-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-gold/10 blur-3xl" />

        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          {/* Copy */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold/80">
              {BRAND_CONFIG.tagline}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              The Gold Standard of{" "}
              <span className="text-brand-gold">Pawn Management</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60">
              Streamline your pawning, inventory, item records and secure your earnings with the modern management suite built for professional pawnshops.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onLoginClick}
                className="rounded-lg bg-brand-gold px-6 py-3 text-sm font-black text-brand-green transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-gold/25 hover:brightness-110 active:translate-y-0 active:scale-95"
              >
                Start Free Trial
              </button>
              <a
                href="#features"
                onClick={(e) => handleScroll(e, "features", "FEATURES")}
                className="rounded-lg border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                Watch Demo
              </a>
            </div>
          </div>

          {/* Photo bleeding to the right edge */}
          <div className="relative lg:-mr-8">
            <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40 lg:rounded-r-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/one.png" alt="Pawnshop management dashboard preview" className="block w-full object-cover" />
            </div>
            <div className="absolute -bottom-4 left-4 rounded-xl bg-brand-gold px-4 py-3 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-green/70">Trusted Platform</p>
              <p className="text-lg font-black leading-none text-brand-green">100% Secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES / VELOCITY & SCALE BENTO ─── */}
      <section id="features" className="px-4 py-16 md:px-8 md:py-24" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-[1280px]">
          {/* Header row: heading left, blurb right */}
          <div className="flex flex-col gap-4 reveal-on-scroll md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded bg-brand-green px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold">
                Core Capabilities
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-green md:text-5xl">
                Engineered for Velocity &amp; Scale
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-brand-green/60">
              A finance-first toolkit to manage assets, clients, and cash flow with banking-grade precision.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3">
            {/* Precision Asset Inventory — wide white card with screenshot */}
            <div className="reveal-on-scroll overflow-hidden rounded-2xl bg-white p-6 shadow-sm md:col-span-2 md:p-8">
              <h3 className="text-lg font-black text-brand-green">Precision Asset Inventory</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                Real-time tracking of every asset. Categorize by metal type, purity, electronics condition, and high-value status. Automated barcode tools ensure your inventory is always sealed and audited.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/two.png" alt="Inventory dashboard preview" className="block max-h-64 w-full object-cover object-top" />
              </div>
            </div>

            {/* Fintech-Grade CRM — dark green card */}
            <div className="reveal-on-scroll flex flex-col justify-between rounded-2xl bg-brand-green p-6 text-white shadow-xl md:p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-black">Fintech-Grade CRM</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Build trust with detailed client profiles, loan history, and automated SMS reminders for due dates and renewals.
                </p>
              </div>
              <a
                href="#pricing"
                onClick={(e) => handleScroll(e, "pricing", "PRICING")}
                className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-brand-gold transition-colors hover:text-white"
              >
                View Feature
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Instant Reporting — gold card */}
            <div className="reveal-on-scroll flex flex-col justify-between rounded-2xl bg-brand-gold p-6 shadow-xl md:p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-brand-gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-brand-green">Instant Reporting</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-green/70">
                  Watch daily transactions, the cash flow of all branches, and liquidity forecasting from one live dashboard.
                </p>
              </div>
              <a
                href="#pricing"
                onClick={(e) => handleScroll(e, "pricing", "PRICING")}
                className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-brand-green transition-opacity hover:opacity-70"
              >
                Explore Metrics
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Uncompromising Security — wide white card with shield */}
            <div className="reveal-on-scroll relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm md:col-span-2 md:p-8">
              <div className="grid items-center gap-6 md:grid-cols-[1.4fr_auto]">
                <div>
                  <h3 className="text-lg font-black text-brand-green">Uncompromising Security</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
                    Encrypted transactions and multi-factor authentication protect your data and your clients&apos; assets at every step.
                  </p>
                </div>
                <div className="hidden h-24 w-24 items-center justify-center rounded-full bg-brand-green/5 text-brand-green/30 md:flex">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-14 w-14">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-brand-gold/10" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section id="why-choose-us" className="bg-white px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-2 lg:gap-14 reveal-on-scroll">
          {/* Left: stats bento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-center rounded-2xl bg-brand-green p-6 text-white shadow-xl">
              <p className="text-4xl font-black leading-none text-brand-gold">24/7</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-white/80">Support</p>
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Our team is ready to help you at every step of the transaction.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-100 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/two.png" alt="Mobile management preview" className="block h-full w-full object-cover" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-100 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/three.png" alt="Secure item handling preview" className="block h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-brand-gold p-6 shadow-xl">
              <p className="text-4xl font-black leading-none text-brand-green">99.9%</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-brand-green/80">Uptime</p>
              <p className="mt-3 text-xs leading-relaxed text-brand-green/70">
                Cloud infrastructure you can rely on - every branch, every day.
              </p>
            </div>
          </div>

          {/* Right: headline + checklist */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold">Why Choose Us?</p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-brand-green md:text-5xl">
              Fair Prices. Fast Cash.{" "}
              <span className="bg-brand-gold px-2 leading-snug text-brand-green">Zero Hassle.</span>
            </h2>

            <div className="mt-8 space-y-4">
              {reasons.map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
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
        </div>
      </section>

      {/* ─── HOW IT WORKS / FAST TRACK TO LIQUIDITY ─── */}
      <section id="how-it-works" className="bg-brand-green px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1280px] reveal-on-scroll">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Fast Track to <span className="text-brand-gold">Liquidity</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              We've refined the appraisal to cash-in cycle into a seamless, digital journey.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
            {steps.map((item) => (
              <div
                key={item.step}
                className={`reveal-on-scroll flex h-full flex-col rounded-2xl p-6 md:p-8 ${
                  item.step === "02"
                    ? "bg-brand-gold text-brand-green shadow-2xl shadow-black/30 md:-my-4 md:py-10"
                    : "border border-white/15 bg-white/5 text-white"
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className={`text-3xl font-black ${item.step === "02" ? "text-brand-green" : "text-brand-gold"}`}>
                    {item.step}
                  </span>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      item.step === "02" ? "bg-brand-green text-brand-gold" : "bg-white/10 text-brand-gold"
                    }`}
                  >
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-base font-black">{item.title}</h3>
                <p className={`mt-2 flex-1 text-sm leading-relaxed ${item.step === "02" ? "text-brand-green/75" : "text-white/60"}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING / VALUE-DRIVEN PRICING ─── */}
      <section id="pricing" className="px-4 py-16 md:px-8 md:py-24" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center reveal-on-scroll">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold">Simple Plans</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-green md:text-5xl">
              Value-Driven Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-green/60">
              Empower your asset management business with tools designed for velocity, security, and growth. Choose the plan that scales with your ambition.
            </p>
          </div>

          {/* Pricing cards — dark green Pro card in the middle */}
          <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`reveal-on-scroll relative flex flex-col rounded-2xl p-6 md:p-7 ${
                  plan.popular
                    ? "bg-brand-green text-white shadow-2xl shadow-black/25 md:-my-4 md:py-10"
                    : "border border-zinc-200 bg-white shadow-xl"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-4 py-1 text-[10px] font-black uppercase tracking-widest text-brand-green shadow">
                    Most Popular
                  </span>
                )}
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${plan.popular ? "text-brand-gold/80" : "text-zinc-400"}`}>
                  {plan.tier}
                </p>
                <h3 className={`mt-1 text-xl font-black ${plan.popular ? "text-white" : "text-brand-green"}`}>{plan.name}</h3>
                <p className="mt-4">
                  <span className={`text-4xl font-black ${plan.popular ? "text-brand-gold" : "text-brand-green"}`}>{plan.price}</span>
                  {plan.period && (
                    <span className={`ml-1 text-sm font-bold ${plan.popular ? "text-white/50" : "text-zinc-400"}`}>{plan.period}</span>
                  )}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2.5 text-sm">
                      {feature.included ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          className={`h-4 w-4 shrink-0 ${plan.popular ? "text-brand-gold" : "text-brand-green"}`}
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.5 2.5 4.5-5.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-zinc-300">
                          <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
                          <path strokeLinecap="round" d="M9 12h6" />
                        </svg>
                      )}
                      <span
                        className={
                          feature.included
                            ? plan.popular
                              ? "font-semibold text-white/90"
                              : "font-semibold text-zinc-700"
                            : "text-zinc-300 line-through"
                        }
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onLoginClick}
                  className={`mt-7 w-full rounded-lg py-2.5 text-sm font-black transition-all duration-200 active:scale-95 ${
                    plan.popular
                      ? "bg-brand-gold text-brand-green hover:brightness-110 hover:shadow-lg hover:shadow-brand-gold/30"
                      : "border-2 border-brand-green/80 bg-white text-brand-green hover:bg-brand-green hover:text-white"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Compare features */}
          <div className="mt-16 reveal-on-scroll md:mt-24">
            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tight text-brand-green md:text-3xl">Compare Features</h3>
              <div className="mx-auto mt-2 h-1 w-14 rounded-full bg-brand-gold" />
            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-lg">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-brand-green">
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider">Core Features</th>
                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider">Basic</th>
                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider">Pro</th>
                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} className="border-b border-zinc-100 last:border-0">
                      <td className="px-5 py-4 font-bold text-zinc-700">{row.label}</td>
                      {[row.basic, row.pro, row.enterprise].map((value, i) => (
                        <td key={i} className="px-5 py-4 text-center">
                          {value === true ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mx-auto h-5 w-5 text-brand-green">
                              <circle cx="12" cy="12" r="10" strokeWidth={1.6} />
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.5 2.5 4.5-5.5" />
                            </svg>
                          ) : value === false ? (
                            <span className="text-zinc-300">—</span>
                          ) : (
                            <span className="text-xs font-bold text-zinc-600">{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 grid gap-10 reveal-on-scroll md:mt-24 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-brand-green md:text-3xl">
                Frequently Asked Questions
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
                Everything you need to know about {BRAND_CONFIG.shortCompanyName} Pawnshop and our pricing structure.
              </p>
            </div>

            <div className="space-y-3">
              {pricingFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-brand-green">{faq.question}</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className={`h-4 w-4 shrink-0 text-brand-green transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <p className="border-t border-zinc-100 px-5 py-4 text-sm leading-relaxed text-zinc-500">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section id="reviews" className="bg-white px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1280px] reveal-on-scroll">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold">Social Proof</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-green md:text-5xl">What Our Sellers Say</h2>
            </div>
            {/* Arrows top-right */}
            <div className="flex shrink-0 gap-2">
              <button
                onClick={prevReview}
                aria-label="Previous review"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-green/20 text-brand-green transition hover:bg-brand-green hover:text-white active:scale-95 md:h-12 md:w-12"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={nextReview}
                aria-label="Next review"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white transition hover:bg-brand-gold hover:text-brand-green active:scale-95 md:h-12 md:w-12"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile: single card */}
          <div className="mt-8 md:hidden">
            <div className="rounded-2xl bg-brand-gold p-5 text-brand-green shadow-2xl">
              <Stars dark />
              <p className="mb-4 text-sm leading-relaxed">&ldquo;{allReviews[reviewIndex].quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-black text-brand-gold">
                  {allReviews[reviewIndex].initials}
                </div>
                <div>
                  <p className="text-sm font-bold">{allReviews[reviewIndex].name}</p>
                  <p className="text-xs text-brand-green/70">{allReviews[reviewIndex].sold}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: 3-card carousel, gold center card */}
          <div className="mt-6 hidden overflow-hidden py-6 md:block">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(${(1 - (reviewIndex + 1)) * 33.333}%)` }}
            >
              {extendedReviews.map((review, i) => {
                const isCenter = i === reviewIndex + 1;
                return (
                  <div key={`${review.name}-${i}`} className="w-1/3 shrink-0 px-2 transition-all duration-500 lg:px-4">
                    <div
                      className={`h-full rounded-2xl p-5 transition-all duration-500 lg:p-6 ${
                        isCenter
                          ? "z-10 scale-105 bg-brand-gold text-brand-green shadow-2xl"
                          : "scale-95 border border-zinc-100 bg-white text-brand-green shadow-lg"
                      }`}
                    >
                      <Stars dark={isCenter} />
                      <p className={`mb-5 text-xs leading-relaxed lg:text-sm ${isCenter ? "text-brand-green/90" : "text-zinc-600"}`}>
                        &ldquo;{review.quote}&rdquo;
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            isCenter ? "bg-brand-green text-brand-gold" : "bg-brand-green text-white"
                          }`}
                        >
                          {review.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-tight">{review.name}</p>
                          <p className={`text-xs ${isCenter ? "text-brand-green/70" : "text-zinc-400"}`}>{review.sold}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {allReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goToReview(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === reviewIndex ? "w-6 bg-brand-green" : "w-2 bg-brand-green/20"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" className="px-4 py-16 md:px-8 md:py-24" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-3xl text-center reveal-on-scroll">
          <h2 className="text-3xl font-black leading-tight tracking-tight text-brand-green md:text-5xl">
            Ready to modernize your{" "}
            <span className="bg-brand-gold px-2 leading-snug">asset management?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-green/60">
            Join hundreds of pawnshop owners who have modernized their operations with {BRAND_CONFIG.shortCompanyName} {BRAND_CONFIG.tagline.toLowerCase()} services.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-lg bg-brand-gold px-7 py-3 text-sm font-black text-brand-green transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-gold/30 hover:brightness-110 active:translate-y-0 active:scale-95"
            >
              Start Your Free Trial
            </button>
            <button
              type="button"
              onClick={() => void openBranchModal()}
              className="rounded-lg border-2 border-brand-green px-7 py-3 text-sm font-black text-brand-green transition-colors hover:bg-brand-green hover:text-white"
            >
              Talk to an Expert
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-brand-green px-4 pb-8 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <Image src={BRAND_CONFIG.companyLogo} alt={BRAND_CONFIG.shortCompanyName} width={44} height={44} className="rounded-lg" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">{BRAND_CONFIG.shortCompanyName}</p>
                  <p className="text-lg font-black leading-none text-white">Pawnshop</p>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/50">
                Your trusted partner for buying back pre-loved gadgets and electronics. Fast, fair, and friendly - that&apos;s the{" "}
                <span className="font-bold text-brand-gold">{BRAND_CONFIG.shortCompanyName} promise.</span>
              </p>
            </div>

            {/* Platform column */}
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-brand-gold">Platform</p>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" onClick={(e) => handleScroll(e, "features", "FEATURES")} className="transition-colors hover:text-brand-gold">Features</a></li>
                <li><a href="#pricing" onClick={(e) => handleScroll(e, "pricing", "PRICING")} className="transition-colors hover:text-brand-gold">Pricing</a></li>
                <li><a href="#how-it-works" onClick={(e) => handleScroll(e, "how-it-works", "HOW IT WORKS")} className="transition-colors hover:text-brand-gold">How It Works</a></li>
                <li>
                  <button type="button" onClick={() => void openBranchModal()} className="transition-colors hover:text-brand-gold">
                    Branches
                  </button>
                </li>
              </ul>
            </div>

            {/* Support column */}
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-brand-gold">Support</p>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#reviews" onClick={(e) => handleScroll(e, "reviews", "REVIEWS")} className="transition-colors hover:text-brand-gold">Reviews</a></li>
                <li>
                  <button type="button" onClick={() => setLegalModal("privacy")} className="transition-colors hover:text-brand-gold">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalModal("terms")} className="transition-colors hover:text-brand-gold">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-brand-gold">Contact</p>
              <div className="space-y-2.5">
                {[
                  { icon: "f", label: "Facebook", sub: `${BRAND_CONFIG.shortCompanyName} Page`, color: "bg-blue-600" },
                  { icon: "@", label: "Email Us", sub: BRAND_CONFIG.email, color: "bg-red-500" },
                  { icon: "pin", label: "Visit Us", sub: branchCountLabel, color: "bg-brand-gold text-brand-green" },
                ].map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      if (c.label === "Facebook") {
                        window.open(`https://${BRAND_CONFIG.website}`, "_blank", "noopener,noreferrer");
                        return;
                      }
                      if (c.label === "Email Us") {
                        window.open("https://mail.google.com/mail/?view=cm&fs=1", "_blank", "noopener,noreferrer");
                        return;
                      }
                      void openBranchModal();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-black text-white ${c.color}`}>
                      {c.icon === "pin" ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                      ) : (
                        c.icon
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white">{c.label}</p>
                      <p className="break-words text-[11px] text-white/50">{c.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/40">
            &copy; 2026 {BRAND_CONFIG.companyName}. All rights reserved. {BRAND_CONFIG.tagline}.
          </div>
        </div>
      </footer>

      {/* ─── LEGAL MODAL ─── */}
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

      {/* ─── BRANCH MODAL ─── */}
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
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">{BRAND_CONFIG.companyName}</p>
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

      {/* Back to top */}
      <button
        type="button"
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold text-brand-green shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white ${
          showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-12 opacity-0"
        }`}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setActiveNavItem("FEATURES");
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
