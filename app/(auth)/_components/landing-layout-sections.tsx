"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { SocialIconLink } from "@/lib/social-links";
import { LandingVideoPlaceholder } from "@/app/(auth)/_components/landing-video-placeholder";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";

type ScrollHandler = (e: React.MouseEvent<HTMLElement>, id: string, item: string) => void;

const footerSupportEmail = BRAND_CONFIG.email;
const supportEmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(footerSupportEmail)}&su=${encodeURIComponent("QuickPawn inquiry")}`;
const footerAddress = "11th ave. corner 36th st. Uptown Bonifacio Global City, Taguig, Philippines, 1634";
const footerAddressMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footerAddress)}`;

export const landingClosingSurfaceClass =
  "bg-[radial-gradient(circle_at_top,#0d6b45_0%,#0B5D3B_42%,#063827_100%)] text-white";

export function LandingClosingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden ${landingClosingSurfaceClass}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

const withQuickPawn = [
  "Organize customer information",
  "Manage pawn transactions",
  "Track pawned items",
  "Monitor loans and payments",
  "Manage important transaction details",
  "Access transaction history",
  "Generate business reports",
  "Monitor daily operations",
  "Manage your business information in one centralized system",
];

const problemPoints = [
  "Who your customers are",
  "What items have been pawned",
  "How much was loaned",
  "When payments are due",
  "Which transactions have been renewed",
  "Which items have been redeemed",
  "What transactions have been completed",
  "What is happening across your business",
];

const manualRisks = [
  "Time-consuming recordkeeping",
  "Difficulty finding transaction information",
  "Disorganized customer records",
  "Increased risk of human error",
  "Limited visibility over business operations",
  "Difficulty monitoring multiple transactions",
  "Challenges when the business begins to grow",
];

const howItHelps = [
  {
    title: "Manage Your Customers",
    desc: "Keep customer information organized and easily accessible when you need it.",
    variant: "profiles" as const,
  },
  {
    title: "Manage Your Pawn Transactions",
    desc: "Create, monitor, and manage pawn transactions through a more structured process.",
    variant: "transactions" as const,
  },
  {
    title: "Track Pawned Items",
    desc: "Keep important item information connected to its corresponding transaction and customer record.",
    variant: "inventory" as const,
  },
  {
    title: "Monitor Loans and Payments",
    desc: "Keep track of important loan details, payments, balances, and transaction information.",
    variant: "payments" as const,
  },
  {
    title: "Stay on Top of Important Dates",
    desc: "Monitor important transaction dates and details to help prevent information from being overlooked.",
    variant: "calendar" as const,
  },
  {
    title: "Review Transaction History",
    desc: "Access organized transaction records for easier monitoring, checking, and reference.",
    variant: "history" as const,
  },
  {
    title: "Understand Your Operations",
    desc: "Use reports and organized business information to gain better visibility into your pawnshop.",
    variant: "analytics" as const,
  },
  {
    title: "Manage Multiple Branches",
    desc: "Connect branch locations in one system so owners and admins can monitor operations from a single view.",
    variant: "branches" as const,
  },
];

const benefits = [
  {
    title: "Stay Organized",
    desc: "Keep customer, item, loan, payment, and transaction information in one centralized system.",
  },
  {
    title: "Reduce Human Error",
    desc: "A more structured system can help reduce mistakes caused by disorganized or inconsistent recordkeeping.",
  },
  {
    title: "Improved Visibility",
    desc: "Get a clearer view of important business information and daily pawnshop operations.",
  },
  {
    title: "Work More Efficiently",
    desc: "Help your team manage everyday operations with a more organized workflow.",
  },
  {
    title: "Prepare for Growth",
    desc: "Use a management system that can support your pawnshop as your business continues to grow.",
  },
];

const cloudPoints = [
  "Centralized access to business information",
  "Easier system management",
  "Reduced dependence on local files and manual records",
  "More convenient access for authorized users",
  "A system designed to support modern business operations",
];

const subscriptionPlans = [
  {
    name: "Starter",
    price: "₱2,999",
    period: "/mo",
    audience: "For single-branch shops",
    features: [
      "1 branch location",
      "Up to 3 staff accounts",
      "Inventory & pawn tracking",
      "Basic daily reports",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
    ctaTarget: "contact-us" as const,
    ctaNav: "CONTACT",
  },
  {
    name: "Professional",
    price: "₱7,999",
    period: "/mo",
    audience: "For growing pawnshops",
    features: [
      "Up to 5 branch locations",
      "Unlimited staff accounts",
      "Full inventory & transactions",
      "Real-time reporting & audit logs",
      "Priority support",
    ],
    cta: "Start free trial",
    popular: true,
    ctaTarget: "contact-us" as const,
    ctaNav: "CONTACT",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    audience: "For multi-branch networks",
    features: [
      "Unlimited branches",
      "Custom roles & permissions",
      "Advanced analytics & exports",
      "Dedicated onboarding",
      "SLA & account manager",
    ],
    cta: "Contact sales",
    popular: false,
    ctaTarget: "contact-us" as const,
    ctaNav: "CONTACT",
  },
];

const faqs = [
  {
    q: "What is QuickPawn?",
    a: "QuickPawn is a Pawnshop Management System designed to help pawnshops manage their customers, pawn transactions, items, loans, payments, records, and daily business operations through one centralized platform.",
  },
  {
    q: "Who can use QuickPawn?",
    a: "QuickPawn is designed for pawnshop owners, managers, employees, and businesses that want a more organized way to manage pawnshop operations.",
  },
  {
    q: "Is QuickPawn cloud-based?",
    a: "QuickPawn is designed as a SaaS-based platform, allowing users to access the system through an online environment. Specific access and subscription details may depend on the selected plan.",
  },
  {
    q: "How much is QuickPawn?",
    a: "Pricing depends on the plan and features your pawnshop needs. See the Pricing section above, or contact us for a custom quote.",
  },
  {
    q: "Can QuickPawn support multiple branches?",
    a: "The system can be designed to support businesses with multiple branches, depending on the available subscription plan and system configuration.",
  },
  {
    q: "Can I manage customer information in QuickPawn?",
    a: "QuickPawn helps organize customer information so authorized users can access important records more efficiently.",
  },
  {
    q: "Can I generate reports in QuickPawn?",
    a: "QuickPawn includes reporting and monitoring capabilities designed to help businesses gain better visibility into their operations.",
  },
  {
    q: "How can I get started?",
    a: `Click "Try QuickPawn Now" or "Request a Demo" to begin exploring how QuickPawn can help improve your pawnshop operations. Or contact us by sending a message to ${BRAND_CONFIG.email}.`,
  },
  {
    q: "Is QuickPawn right for my pawnshop?",
    a: "If you want to spend less time dealing with scattered records and more time managing your business, QuickPawn may be the right solution for you.",
  },
];

/* ── Mini dashboard mock building block (reused across bento cards) ── */
function LandingVideoModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f0c] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-bold text-white">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close video"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <LandingVideoPlaceholder title={title} variant="dark" />
      </div>
    </div>
  );
}

function LandingVideoFrame({
  title,
  caption,
}: {
  title: string;
  caption: string;
}) {
  return (
    <div className="reveal-on-scroll reveal-delay-200 mx-auto w-full max-w-xl lg:max-w-none">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-white/15 to-white/5 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:-translate-y-1">
        <div className="mb-2 flex justify-center">
          <span className="h-1 w-1 rounded-full bg-black/50 ring-1 ring-white/20" aria-hidden="true" />
        </div>

        <div className="overflow-hidden rounded-xl border border-black/30">
          <LandingVideoPlaceholder title={title} label={caption} variant="dark" />
        </div>

        <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
          Placeholder preview
        </p>
      </div>
    </div>
  );
}

function MiniDashboardCard({
  label,
  rows,
}: {
  label: string;
  rows: { name: string; value: string; tone?: "gold" | "white" }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-[#faf9f6] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider text-black/35">{label}</span>
      </div>
      <div className="space-y-2 p-3">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg bg-[#f6f5f2] px-3 py-2">
            <span className="text-[11px] font-medium text-brand-green/70">{row.name}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                row.tone === "gold" ? "bg-brand-gold/20 text-brand-green" : "bg-brand-green text-white"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type HowItHelpsVariant =
  | "profiles"
  | "transactions"
  | "inventory"
  | "payments"
  | "calendar"
  | "history"
  | "analytics"
  | "branches";

function HowItHelpsLaptopScreen({ variant }: { variant: HowItHelpsVariant }) {
  if (variant === "profiles") {
    return (
      <div className="flex h-full flex-col bg-gradient-to-br from-[#eef4f1] to-white p-3">
        <div className="mb-2 h-1.5 w-12 rounded-full bg-brand-green/15" />
        {[
          { initials: "JS", name: "J. Santos", status: "Active" },
          { initials: "MC", name: "M. Cruz", status: "Updated" },
          { initials: "AR", name: "A. Reyes", status: "Saved" },
        ].map((profile) => (
          <div key={profile.initials} className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-[8px] font-bold text-white">
              {profile.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-semibold text-brand-green">{profile.name}</p>
              <p className="text-[7px] text-brand-green/45">{profile.status}</p>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "transactions") {
    return (
      <div className="flex h-full flex-col justify-center bg-gradient-to-br from-[#f7f3ea] to-white p-3">
        <div className="flex items-center justify-between gap-1">
          {[
            { label: "New", active: true },
            { label: "Renew", active: false },
            { label: "Redeem", active: false },
          ].map((step, index) => (
            <div key={step.label} className="flex flex-1 flex-col items-center">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold ${
                  step.active ? "bg-brand-green text-white" : "bg-brand-green/10 text-brand-green/50"
                }`}
              >
                {index + 1}
              </span>
              <span className="mt-1 text-[7px] font-semibold text-brand-green/70">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-brand-green/10 bg-white p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-brand-green/45">Ticket #4821</p>
          <p className="mt-0.5 text-[10px] font-bold text-brand-green">Pawn transaction active</p>
        </div>
      </div>
    );
  }

  if (variant === "inventory") {
    return (
      <div className="grid h-full grid-cols-2 gap-1.5 bg-gradient-to-br from-[#eef0f4] to-white p-2.5">
        {[
          { label: "Ring 18k", tone: "gold" },
          { label: "Laptop", tone: "green" },
          { label: "Watch", tone: "green" },
          { label: "Chain", tone: "gold" },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex flex-col justify-end rounded-md p-1.5 ${
              item.tone === "gold" ? "bg-brand-gold/20" : "bg-brand-green/10"
            }`}
          >
            <div className="mb-1 h-5 rounded bg-white/70" />
            <p className="text-[7px] font-bold text-brand-green">{item.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "payments") {
    return (
      <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#edf6f2] to-white p-3">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-wider text-brand-green/45">Outstanding</p>
          <p className="font-display text-lg font-black leading-none text-brand-green">P48,200</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-brand-gold/20 px-2 py-1.5">
            <p className="text-[7px] text-brand-green/55">Received</p>
            <p className="text-[9px] font-bold text-brand-green">P12,500</p>
          </div>
          <div className="rounded-lg bg-brand-green/10 px-2 py-1.5">
            <p className="text-[7px] text-brand-green/55">Interest</p>
            <p className="text-[9px] font-bold text-brand-green">P1,200</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "calendar") {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    return (
      <div className="flex h-full flex-col bg-gradient-to-br from-[#f8f4ea] to-white p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[8px] font-bold text-brand-green">March 2026</p>
          <span className="rounded-full bg-brand-gold/25 px-1.5 py-0.5 text-[7px] font-bold text-brand-green">Due</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {days.map((day, dayIndex) => (
            <span key={`${day}-${dayIndex}`} className="text-[6px] font-bold text-brand-green/35">
              {day}
            </span>
          ))}
          {Array.from({ length: 14 }).map((_, index) => {
            const dayNum = index + 1;
            const highlighted = dayNum === 14;
            return (
              <span
                key={dayNum}
                className={`flex h-3.5 items-center justify-center rounded text-[6px] font-semibold ${
                  highlighted ? "bg-brand-green text-white" : "text-brand-green/55"
                }`}
              >
                {dayNum}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "history") {
    return (
      <div className="relative h-full bg-gradient-to-br from-[#eef2ef] to-white p-3 pl-4">
        <div className="absolute bottom-3 left-[11px] top-3 w-px bg-brand-green/15" />
        {[
          { time: "10:24 AM", label: "Redemption logged" },
          { time: "09:12 AM", label: "Renewal processed" },
          { time: "Yesterday", label: "18 records archived" },
        ].map((entry) => (
          <div key={entry.label} className="relative mb-2 pl-3">
            <span className="absolute left-0 top-1 h-1.5 w-1.5 -translate-x-[3px] rounded-full bg-brand-gold" />
            <p className="text-[7px] font-semibold text-brand-green/45">{entry.time}</p>
            <p className="text-[8px] font-bold text-brand-green">{entry.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "branches") {
    return (
      <div className="flex h-full flex-col gap-1.5 bg-gradient-to-br from-[#eef4f8] to-white p-2.5">
        {[
          { name: "Main Branch", status: "Online", active: true },
          { name: "Quezon Ave", status: "Online", active: false },
          { name: "Makati", status: "Synced", active: false },
        ].map((branch) => (
          <div
            key={branch.name}
            className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
              branch.active ? "bg-brand-green text-white" : "bg-white/85 text-brand-green shadow-sm"
            }`}
          >
            <div>
              <p className="text-[8px] font-bold">{branch.name}</p>
              <p className={`text-[7px] ${branch.active ? "text-white/70" : "text-brand-green/45"}`}>{branch.status}</p>
            </div>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                branch.active ? "bg-brand-gold" : "bg-brand-green/30"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-end bg-gradient-to-br from-[#edf3ef] to-white p-3">
      <div className="mb-2 flex h-12 items-end justify-between gap-1">
        {[3, 5, 4, 6].map((height, barIndex) => (
          <div key={barIndex} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t ${barIndex % 2 === 0 ? "bg-brand-gold/70" : "bg-brand-green/70"}`}
              style={{ height: `${height * 6}px` }}
            />
            <span className="text-[6px] font-semibold text-brand-green/40">W{barIndex + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-[8px] font-bold text-brand-green">Weekly performance overview</p>
    </div>
  );
}

function HowItHelpsLaptopCard({
  title,
  desc,
  variant,
  index,
  prefersReducedMotion,
}: {
  title: string;
  desc: string;
  variant: HowItHelpsVariant;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  return (
    <motion.article
      className="group/card flex flex-col items-center"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full max-w-[290px] [perspective:1200px]">
        <motion.div
          className={`relative origin-bottom transition-[transform,filter] duration-500 ease-out ${
            prefersReducedMotion
              ? "group-hover/card:-translate-y-1"
              : "group-hover/card:[transform:rotateX(10deg)_translateY(-10px)_scale(1.02)]"
          }`}
        >
          <div className="overflow-hidden rounded-t-[18px] border border-[#334155] bg-gradient-to-b from-[#475569] via-[#334155] to-[#1e293b] p-[10px] pb-2 shadow-[0_20px_40px_rgba(0,77,64,0.16)] transition-shadow duration-500 group-hover/card:shadow-[0_28px_50px_rgba(0,77,64,0.24)]">
            <div className="mb-2 flex justify-center">
              <span className="h-1 w-1 rounded-full bg-black/50 ring-1 ring-white/10" aria-hidden="true" />
            </div>
            <div className="aspect-[16/10] overflow-hidden rounded-[6px] border border-black/20 bg-[#f4f2ee] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] transition-[filter,transform] duration-500 group-hover/card:brightness-[1.03] group-hover/card:saturate-[1.05]">
              <HowItHelpsLaptopScreen variant={variant} />
            </div>
          </div>

          <div className="mx-auto h-[3px] w-[94%] bg-gradient-to-r from-transparent via-[#64748b] to-transparent" />

          <div className="rounded-b-[16px] rounded-t-[3px] border border-t-0 border-[#94a3b8] bg-gradient-to-b from-[#dbeafe] via-[#cbd5e1] to-[#94a3b8] px-5 pb-3 pt-2.5 shadow-[0_16px_30px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-10 gap-[3px]">
              {Array.from({ length: 30 }).map((_, keyIndex) => (
                <div
                  key={keyIndex}
                  className="h-[6px] rounded-[2px] bg-white/45 transition-colors duration-300 group-hover/card:bg-brand-gold/35"
                />
              ))}
            </div>
            <div className="mx-auto mt-2.5 h-[20px] w-[42%] rounded-md border border-black/5 bg-white/30 shadow-inner transition-colors duration-300 group-hover/card:bg-white/45" />
          </div>
        </motion.div>

        <div className="mx-auto mt-3 h-2.5 w-[68%] rounded-[50%] bg-brand-green/10 blur-md transition-all duration-500 group-hover/card:w-[82%] group-hover/card:bg-brand-gold/20" />
      </div>

      <div className="mt-6 w-full max-w-[290px] rounded-2xl border border-brand-green/8 bg-[#f9f8f5] px-4 py-4 text-center transition-all duration-300 group-hover/card:border-brand-gold/30 group-hover/card:bg-brand-gold/8 group-hover/card:shadow-lg group-hover/card:shadow-brand-gold/10">
        <h3 className="font-display text-base font-bold text-brand-green md:text-lg">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-green/65">{desc}</p>
      </div>
    </motion.article>
  );
}

export function LandingHero({
  onScroll,
  heroSrc,
}: {
  onScroll: ScrollHandler;
  heroSrc: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="home" className="relative min-h-[92svh] overflow-hidden bg-[#f4f2ee] pt-32 pb-20 sm:pt-36 md:pt-40">
      <div className="absolute inset-0" aria-hidden>
        <motion.img
          key={heroSrc}
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4f2ee] via-[#f4f2ee]/92 to-[#f4f2ee]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f2ee] via-transparent to-[#f4f2ee]/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.p
          className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-green/60"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {BRAND_CONFIG.tagline}
        </motion.p>
        <motion.h1
          className="font-display mt-5 text-[clamp(2.4rem,6vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-brand-green"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          Run Your Pawnshop{" "}
          <span className="italic text-brand-gold">Smarter</span> with {BRAND_CONFIG.shortCompanyName}
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-green/65 sm:text-lg"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          An all-in-one platform designed to help you manage customers, pawn transactions, items,
          loans, payments, and daily operations in one organized system — spend less time on
          scattered records and more time growing your business.
        </motion.p>
        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <a
            href="#contact-us"
            onClick={(e) => onScroll(e, "contact-us", "CONTACT")}
            className="inline-flex items-center justify-center rounded-full bg-brand-green px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-brand-green/90"
          >
            Try {BRAND_CONFIG.shortCompanyName} Now
          </a>
          <a
            href="#pricing"
            onClick={(e) => onScroll(e, "pricing", "PRICING")}
            className="inline-flex items-center justify-center rounded-full border border-brand-green/20 bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-green transition hover:border-brand-green"
          >
            View pricing
          </a>
        </motion.div>
      </div>

      {/* ── Bento grid of dashboard mock cards ── */}
      <motion.div
        className="reveal-on-scroll relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2 md:gap-5"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-2xl bg-gradient-to-br from-[#eef0e8] to-[#dfe6d6] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green/50">Every transaction, tracked</p>
          <h3 className="font-display mt-2 text-xl font-bold text-brand-green">
            One system for every pawn transaction
          </h3>
          <div className="mt-5">
            <MiniDashboardCard
              label={`${BRAND_CONFIG.shortCompanyName} · Transactions`}
              rows={[
                { name: "New pawn — J. Santos", value: "Active", tone: "gold" },
                { name: "Renewal — M. Cruz", value: "Due today" },
                { name: "Redemption — A. Reyes", value: "Completed", tone: "gold" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#f2ecd9] to-[#e7dcb8] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green/50">Complete visibility</p>
          <h3 className="font-display mt-2 text-xl font-bold text-brand-green">
            Every item, connected to its record
          </h3>
          <div className="mt-5">
            <MiniDashboardCard
              label={`${BRAND_CONFIG.shortCompanyName} · Inventory`}
              rows={[
                { name: "Gold ring 18k — Item #2291", value: "In vault" },
                { name: "Laptop — Item #2294", value: "Released", tone: "gold" },
                { name: "Watch — Item #2296", value: "Pending" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#e9eef2] to-[#d3dfe8] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green/50">Never miss a due date</p>
          <h3 className="font-display mt-2 text-xl font-bold text-brand-green">
            Loans and payments, always in view
          </h3>
          <div className="mt-5">
            <MiniDashboardCard
              label={`${BRAND_CONFIG.shortCompanyName} · Loans`}
              rows={[
                { name: "Balance due — Branch 1", value: "₱48,200" },
                { name: "Payments this week", value: "₱312,900", tone: "gold" },
                { name: "Overdue accounts", value: "3" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#eef0e8] to-[#dbe4cd] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green/50">One centralized view</p>
          <h3 className="font-display mt-2 text-xl font-bold text-brand-green">
            Reports that explain your business
          </h3>
          <div className="mt-5">
            <MiniDashboardCard
              label={`${BRAND_CONFIG.shortCompanyName} · Reports`}
              rows={[
                { name: "Daily transactions", value: "128", tone: "gold" },
                { name: "Active branches", value: "5" },
                { name: "Monthly growth", value: "+18%", tone: "gold" },
              ]}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingIntro() {
  return (
    <section id="product" className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="reveal-on-scroll text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">Meet {BRAND_CONFIG.shortCompanyName}</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl">
            A Smarter Way to Manage Your Pawnshop
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-brand-green/65">
            Running a pawnshop requires accuracy, organization, and complete visibility over every
            transaction. From customer information and pawned items to loans, payments,
            redemptions, renewals, and daily operations, every detail matters. {BRAND_CONFIG.shortCompanyName}{" "}
            brings essential pawnshop processes into one centralized platform, helping you organize
            your records, monitor transactions, and manage your business more efficiently — instead
            of relying on scattered files, manual records, and disconnected processes.
          </p>
        </div>

        <div className="mx-auto mt-14 grid gap-x-8 gap-y-3 md:grid-cols-3">
          {withQuickPawn.map((item, i) => (
            <div
              key={item}
              className={`reveal-on-scroll reveal-delay-${Math.min(500, (i % 5) * 100 || 100)} flex items-start gap-3 rounded-xl border border-brand-green/10 bg-[#f9f8f5] px-4 py-3`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-brand-green/85">{item}</span>
            </div>
          ))}
        </div>

        <p className="reveal-on-scroll mt-10 text-center font-display text-xl font-bold italic text-brand-green md:text-2xl">
          One System. Better Visibility. Smarter Operations.
        </p>

        <div className="reveal-on-scroll mt-14 overflow-hidden rounded-3xl border border-brand-green/10 bg-[#f9f8f5] shadow-[0_16px_50px_rgba(11,93,59,0.10)] lg:grid lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/itemsweaccept.png"
              alt="Jewelry, gadgets, and valuables accepted at pawnshops"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/85 via-brand-green/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">What pawnshops manage</p>
              <h3 className="font-display mt-2 text-2xl font-bold text-white md:text-3xl">
                Jewelry, gadgets, and more
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                Track every item type your shop accepts — from gold and watches to laptops and electronics.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">Built for real pawnshops</p>
            <h3 className="font-display mt-3 text-2xl font-bold text-brand-green md:text-3xl">
              Every item, connected to its record
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-brand-green/65">
              {BRAND_CONFIG.shortCompanyName} helps you organize pawned items, loan details, renewals,
              redemptions, and inventory — so your team always knows what is in the vault and what is due.
            </p>
            <ul className="mt-6 space-y-3">
              {["Gold & jewelry tracking", "Electronics & gadgets", "Complete transaction history"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-brand-green/80">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingProblemSolution({ onScroll }: { onScroll: ScrollHandler }) {
  const router = useRouter();

  return (
    <section id="why-us" className="bg-brand-green px-4 py-20 text-white sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">The problem</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Running a pawnshop comes with a lot to manage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
            Every day, pawnshop owners and employees deal with important information and
            transactions. You need to keep track of:
          </p>
        </div>

        <div className="mx-auto mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
          <div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {problemPoints.map((p, i) => (
                <div
                  key={p}
                  className={`reveal-on-scroll reveal-delay-${Math.min(500, (i % 5) * 100 || 100)} flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3`}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                  <span className="text-sm text-white/85">{p}</span>
                </div>
              ))}
            </div>

            <p className="reveal-on-scroll mt-8 text-sm leading-relaxed text-white/70 lg:mt-10">
              When information is difficult to organize, daily operations can become slower and more
              complicated. Manual processes can lead to:
            </p>
            <div className="reveal-on-scroll mt-4 flex flex-wrap gap-2">
              {manualRisks.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <LandingVideoFrame
            title="QuickPawn commercial"
            caption="Commercial preview"
          />
        </div>

        <div className="reveal-on-scroll reveal-delay-200 mt-14 rounded-2xl bg-white p-8 text-center shadow-2xl md:p-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">
            The {BRAND_CONFIG.shortCompanyName} solution
          </p>
          <h3 className="font-display mt-3 text-2xl font-bold leading-tight text-brand-green md:text-3xl">
            Bring your essential operations together
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-brand-green/65">
            {BRAND_CONFIG.shortCompanyName} helps bring your essential pawnshop operations together
            in one centralized management system. From the first customer transaction to the final
            redemption, {BRAND_CONFIG.shortCompanyName} helps you manage your pawnshop journey with
            greater organization and confidence.
          </p>
          <Link
            href="/see-how-it-works"
            onClick={(event) => {
              event.preventDefault();
              router.push("/see-how-it-works");
            }}
            className="relative z-10 mt-7 inline-flex items-center justify-center rounded-full bg-brand-green px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-brand-green/90"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingHowItHelps() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="how-it-helps" className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-on-scroll text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">Centralized platform</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl">
            How {BRAND_CONFIG.shortCompanyName} Helps Your Business
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-green/60">
            Instead of using multiple tools to manage different parts of your business,{" "}
            {BRAND_CONFIG.shortCompanyName} provides a centralized system that helps connect your
            important business information.
          </p>
        </div>

        <div className="mx-auto mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {howItHelps.map((item, i) => (
            <HowItHelpsLaptopCard
              key={item.title}
              title={item.title}
              desc={item.desc}
              variant={item.variant}
              index={i}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingStats() {
  const stats = [
    { value: "1", label: "Centralized system for every branch" },
    { value: "24/7", label: "Cloud-based access, anytime" },
    { value: "100%", label: "Visibility over daily operations" },
  ];

  return (
    <section className="bg-[#0c0f0c] px-4 py-20 text-white sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="reveal-on-scroll text-sm font-bold uppercase tracking-widest text-brand-gold">
          No more scattered records
        </p>
        <h2 className="reveal-on-scroll font-display mt-3 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          One System. <span className="text-brand-gold">Better Visibility.</span>
        </h2>
        <p className="reveal-on-scroll mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60">
          {BRAND_CONFIG.shortCompanyName} is where pawnshop owners bring their operations together —
          connect your branches, organize your records, and monitor your business with confidence.
        </p>

        <div className="mx-auto mt-14 grid gap-8 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`reveal-on-scroll reveal-delay-${(i + 1) * 150}`}>
              <p className="font-display text-5xl font-black text-brand-gold sm:text-6xl">{stat.value}</p>
              <p className="mt-3 text-sm text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingBenefits() {
  return (
    <section id="benefits" className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">Benefits</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl">
            Why Do Pawnshop Owners Choose a Smarter Way?
          </h2>
        </div>

        <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={`reveal-on-scroll reveal-delay-${Math.min(500, (i % 5) * 100 || 100)} rounded-2xl bg-[#f9f8f5] p-6 transition duration-300 hover:-translate-y-1 hover:bg-brand-gold/10 hover:shadow-lg`}
            >
              <h3 className="mt-4 font-display text-base font-bold text-brand-green">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-green/60">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCloud() {
  return (
    <section id="cloud" className="relative overflow-hidden bg-[#f4f2ee] px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="reveal-on-scroll">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">Cloud-based SaaS</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-brand-green md:text-4xl">
            Access Your Pawnshop Management System Wherever Your Business Takes You
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-green/65">
            {BRAND_CONFIG.shortCompanyName} is offered as a cloud-based Software-as-a-Service
            platform, allowing your business to access the system through an online environment
            without the need to manage complicated infrastructure on your own.
          </p>
        </div>
        <div className="reveal-on-scroll reveal-delay-200 relative min-h-[360px] overflow-hidden rounded-2xl shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-brand-green/78" />
          <div className="relative flex h-full flex-col justify-center p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">With a cloud-based system, you get:</p>
            <ul className="mt-5 space-y-3">
              {cloudPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ApiPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  badge?: string;
  isPopular?: boolean;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  billingType: "monthly" | "annual" | "both";
  limits?: {
    branchLimit: number;
    userLimit: number;
    storageGb: number;
  } | null;
  features: string[];
  inclusions: string[];
  addons: { id: string; name: string; price: number; unit?: string }[];
}

export function LandingProcessPricing({ onScroll }: { onScroll: ScrollHandler }) {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {
        // Fallback plans if backend not running
      })
      .finally(() => setIsLoading(false));
  }, []);

  const displayPlans = plans.length > 0 ? plans : [
    {
      id: "1",
      name: "Basic",
      slug: "basic",
      badge: undefined,
      isPopular: false,
      monthlyPrice: 5000,
      annualPrice: 55000,
      currency: "PHP",
      billingType: "both" as const,
      limits: { branchLimit: 2, userLimit: 13, storageGb: 2 },
      features: [
        "2 Branches",
        "SUPER ADMIN - 1",
        "ADMIN - 1 (per branch)",
        "EMPLOYEE - 5 (per branch)",
        "Up to 13 Users/Accounts",
        "2GB Storage",
        "30 Days Tech Support/ Training",
        "Free Trial (1 week)",
      ],
      inclusions: ["30 Days Tech Support/ Training", "Free Trial (1 week)"],
      addons: [
        { id: "a1", name: "Additional Branch", price: 35000 },
        { id: "a2", name: "Additional Super Admin", price: 1500 },
        { id: "a3", name: "Additional Admin", price: 1500 },
        { id: "a4", name: "Additional Employee", price: 1200 },
        { id: "a5", name: "Additional Storage (1GB)", price: 2000 },
      ],
    },
    {
      id: "2",
      name: "Standard",
      slug: "standard",
      badge: "Most Popular",
      isPopular: true,
      monthlyPrice: 10000,
      annualPrice: 110000,
      currency: "PHP",
      billingType: "both" as const,
      limits: { branchLimit: 4, userLimit: 33, storageGb: 5 },
      features: [
        "4 Branches",
        "SUPER ADMIN - 1",
        "ADMIN - 1 (per branch)",
        "EMPLOYEE - 5 (per branch)",
        "Up to 33 Users/Accounts",
        "5GB Storage",
        "3 months Tech Support/ Training",
        "Free Trial (1 week)",
      ],
      inclusions: ["3 months Tech Support/ Training", "Free Trial (1 week)"],
      addons: [
        { id: "a1", name: "Additional Branch", price: 35000 },
        { id: "a2", name: "Additional Super Admin", price: 1500 },
        { id: "a3", name: "Additional Admin", price: 1500 },
        { id: "a4", name: "Additional Employee", price: 1200 },
        { id: "a5", name: "Additional Storage (1GB)", price: 2000 },
      ],
    },
    {
      id: "3",
      name: "Customized",
      slug: "customized",
      badge: "Customized",
      isPopular: false,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: "PHP",
      billingType: "both" as const,
      limits: null,
      features: [
        "Customized Number of Branches",
        "Additional Features",
        "Customized users",
        "Customized Interface",
        "Free Trial (1 week)",
        "Price may Vary",
      ],
      inclusions: [],
      addons: [],
    },
  ];

  // Collect all unique add-ons across plans for bottom banner
  const allAddons = Array.from(
    new Map(
      displayPlans.flatMap((p) => p.addons || []).map((a) => [a.name, a])
    ).values()
  );

  return (
    <section id="pricing" className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl text-center reveal-on-scroll">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">Pricing</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-green/60 uqhd:max-w-2xl uqhd:text-xl uhd:max-w-3xl uhd:text-2xl">
          Choose the plan that fits your pawnshop. Scale as you grow — no hidden fees.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="mt-8 flex justify-center items-center gap-3">
          <span className={`text-xs font-bold ${cycle === "monthly" ? "text-brand-green" : "text-brand-green/40"}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setCycle(cycle === "monthly" ? "annual" : "monthly")}
            className="relative h-6 w-12 rounded-full bg-brand-green p-1 transition-colors"
          >
            <span
              className={`block h-4 w-4 rounded-full bg-brand-gold transition-transform ${
                cycle === "annual" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${cycle === "annual" ? "text-brand-green" : "text-brand-green/40"}`}>
            Annual Billing <span className="text-brand-gold font-extrabold">(Save up to 15%)</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 overflow-visible md:grid-cols-3 md:items-stretch">
        {displayPlans.map((plan, i) => {
          const rawPrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
          const formattedPrice = rawPrice === 0 ? "---" : `₱${rawPrice.toLocaleString()}`;
          const periodText = rawPrice === 0 ? "/yearly" : cycle === "annual" ? "/yearly" : "/mo";

          return (
            <div
              key={plan.id || plan.name}
              className={`reveal-on-scroll group/card relative flex flex-col rounded-3xl border-2 p-8 transition-all duration-300 ease-out hover:-translate-y-1 ${
                plan.isPopular
                  ? "border-white/10 bg-[#004d40] text-white shadow-2xl md:scale-[1.03] hover:border-brand-gold hover:shadow-[0_0_0_1px_#E8C547,0_0_28px_rgba(232,197,71,0.32)]"
                  : "border-white/10 bg-[#004d40] text-white shadow-lg hover:border-brand-gold hover:shadow-[0_0_0_1px_#E8C547,0_0_24px_rgba(232,197,71,0.28)]"
              }`}
            >
              {/* Bookmark-like Yellow Badge for Most Availed */}
              {plan.isPopular && (
                <div className="absolute top-0 right-6 flex items-center gap-1 rounded-b-lg bg-brand-gold px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-brand-green shadow-md">
                  ★ Most Availed
                </div>
              )}

              <p className="text-center text-base font-bold tracking-wider text-white mb-2 pt-2">
                {plan.name}
              </p>

              <div className="mt-2 text-center pb-6 border-b border-white/20">
                <p className="font-display text-4xl font-extrabold text-white md:text-5xl">
                  {formattedPrice}
                </p>
                <span className="text-xs font-medium text-white/70">
                  {periodText}
                </span>
              </div>

              {/* Dynamic Feature Checklist (Inclusion Tags) */}
              <ul className="mt-6 flex-1 space-y-2 text-xs text-white/90">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 px-2.5 py-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-gold/25 text-[10px] font-bold text-brand-gold">
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact-us"
                onClick={(e) => onScroll(e, "contact-us", "CONTACT")}
                className="mt-8 block rounded-full bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-[#004d40] transition hover:bg-brand-gold hover:text-brand-green shadow-md"
              >
                Get Started
              </a>
            </div>
          );
        })}
      </div>

      {/* Add-ons Banner Section */}
      {allAddons.length > 0 && (
        <div className="mx-auto mt-10 max-w-6xl rounded-3xl bg-[#00bfa5] p-8 text-white shadow-xl">
          <h3 className="text-center text-2xl font-black tracking-widest uppercase mb-6 text-white drop-shadow-sm">
            ADD ONS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-xs font-semibold">
            <div className="space-y-3">
              {allAddons.map((addon) => (
                <div key={addon.name} className="flex items-center gap-3">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">
                    ✓
                  </span>
                  <span>
                    {addon.name} {addon.price > 0 ? `- ${addon.price.toLocaleString()}` : ""}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/20 md:pl-8">
              <p className="font-bold uppercase tracking-wider text-white/90">
                ADDITIONAL FEATURE / CUSTOMIZATION
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/80">
                <li>Cash Loan Feature</li>
                <li>Valid ID Verification</li>
                <li>ETC.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


export function LandingTrustBar() {
  const items = [
    "Centralized records",
    "Real-time visibility",
    "Multi-branch ready",
    "Cloud-based access",
  ];
  return (
    <div className="border-y border-brand-green/10 bg-[#f9f8f5] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-green/45 uqhd:text-sm uhd:text-base">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold uqhd:h-2 uqhd:w-2" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="reveal-on-scroll text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">FAQ</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className="reveal-on-scroll overflow-hidden rounded-xl border border-brand-green/10 bg-[#f9f8f5]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-brand-green">{item.q}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className={`h-4 w-4 shrink-0 text-brand-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-brand-green/65">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingLightFooter({
  onScroll,
  onLoginClick,
  onOpenLegal,
  continued = false,
}: {
  onScroll: ScrollHandler;
  onLoginClick: () => void;
  onOpenLegal: (type: "privacy" | "terms") => void;
  continued?: boolean;
}) {
  return (
    <footer
      className={
        continued
          ? "relative px-6 pb-14 pt-6 md:px-12 lg:px-16 uqhd:px-20 uqhd:pb-20 uhd:px-28 uhd:pb-24"
          : `relative overflow-hidden ${landingClosingSurfaceClass} px-6 pb-14 pt-14 md:px-12 lg:px-16 uqhd:px-20 uqhd:pb-20 uhd:px-28 uhd:pb-24`
      }
    >
      {!continued && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-brand-gold/10 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
      )}

      <div className="landing-container-wide relative grid gap-10 md:grid-cols-2 lg:grid-cols-5 uqhd:gap-14">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <QuickPawnLogo variant="mark" className="h-11 w-11" />
            <div>
              <p className="font-display text-xl font-bold text-white uqhd:text-2xl uhd:text-3xl">{BRAND_CONFIG.shortCompanyName}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold uqhd:text-xs">{BRAND_CONFIG.tagline}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-white/70">
            <p className="text-[11px] font-black uppercase tracking-widest text-brand-gold">Contact Details</p>
            <div className="space-y-2">
              <p className="leading-relaxed text-white/80">
                <span className="font-semibold text-white">Email:</span>{" "}
                <a href={supportEmailComposeUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand-gold">
                  quickpawn.pms@gmail.com
                </a>
              </p>
              <p className="leading-relaxed text-white/80">
                <span className="font-semibold text-white">Telephone:</span> 253221002
              </p>
              <p className="leading-relaxed text-white/80">
                <span className="font-semibold text-white">Address:</span>{" "}
                <a href={footerAddressMapUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand-gold">
                  {footerAddress}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            {[
              ["Product", "product", "PRODUCT"],
              ["Features", "why-us", "FEATURES"],
              ["Pricing", "pricing", "PRICING"],
              ["Contact", "contact-us", "CONTACT"],
            ].map(([label, id, nav]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => onScroll(e, id, nav)} className="transition-colors hover:text-brand-gold">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-gold">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>
              <Link href="/about" className="transition-colors hover:text-brand-gold">
                About us
              </Link>
            </li>
            <li>
              <a
                href={BRAND_CONFIG.parentCompany.website}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brand-gold"
              >
                {BRAND_CONFIG.parentCompany.shortName} website
              </a>
            </li>
            <li>
              <Link href="/social" className="transition-colors hover:text-brand-gold">
                Social media
              </Link>
            </li>
            <li>
              <a href="#faq" onClick={(e) => onScroll(e, "faq", "CONTACT")} className="transition-colors hover:text-brand-gold">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-gold">Quick Links</p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>
              <button type="button" onClick={onLoginClick} className="transition-colors hover:text-brand-gold">
                Staff login
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal("privacy")} className="transition-colors hover:text-brand-gold">
                Privacy policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal("terms")} className="transition-colors hover:text-brand-gold">
                Terms of service
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-gold">Connect with us</p>
          <div className="mt-4 space-y-4 text-sm text-white/65">
            <div className="flex flex-wrap items-center gap-3">
              {BRAND_CONFIG.socialMedia.map((account) => (
                <SocialIconLink key={account.url} account={account} />
              ))}
            </div>
            <Link href="/social" className="block transition-colors hover:text-brand-gold">
              View all social accounts
            </Link>
            <a
              href={supportEmailComposeUrl}
              target="_blank"
              rel="noreferrer"
              className="block transition-colors hover:text-brand-gold"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>

      <div className="landing-container-wide relative mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/45 uqhd:mt-16 uqhd:text-sm">
        © 2026 {BRAND_CONFIG.companyName}. All rights reserved.
      </div>
    </footer>
  );
}
