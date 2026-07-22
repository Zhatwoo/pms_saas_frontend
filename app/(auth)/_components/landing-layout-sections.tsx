"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BRAND_CONFIG } from "@/lib/brand-config";

type ScrollHandler = (e: React.MouseEvent<HTMLElement>, id: string, item: string) => void;

const bentoFeatures = [
  {
    title: "Fair Buy-Back Offers",
    desc: "Market-based pricing with clear explanations — no lowball games.",
    className: "md:col-span-2 md:row-span-1 min-h-[240px] md:min-h-[280px]",
    image: "/one.png",
  },
  {
    title: "What We Buy",
    desc: "Phones, laptops, consoles, cameras, and more.",
    className: "min-h-[220px]",
    image: "/two.png",
  },
  {
    title: "Same-Day Response",
    desc: "Submit in the morning, get an offer by afternoon.",
    className: "min-h-[220px]",
    image: "/three.png",
  },
  {
    title: "Secure Hand-off",
    desc: "Transparent deals with protected payment options.",
    className: "min-h-[220px]",
    image: "/itemsweaccept.png",
  },
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
    ctaNav: "CONTACT US",
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
    ctaNav: "CONTACT US",
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
    ctaNav: "CONTACT US",
  },
];

export function LandingHero({
  onScroll,
  heroSrc,
}: {
  onScroll: ScrollHandler;
  heroSrc: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="home" className="relative min-h-[100svh] overflow-hidden bg-[#f4f2ee] pt-16 uqhd:pt-20 uhd:pt-24">
      <div className="absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroSrc} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4f2ee] via-[#f4f2ee]/92 to-[#f4f2ee]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f2ee] via-transparent to-[#f4f2ee]/40" />
      </div>

      <div className="landing-container-wide relative z-10 grid min-h-[calc(100svh-4rem)] items-center gap-10 px-4 py-14 sm:px-6 md:px-12 lg:grid-cols-2 lg:gap-12 lg:py-20 uqhd:min-h-[calc(100svh-5rem)] uqhd:gap-16 uqhd:py-24 uhd:gap-24 uhd:py-32">
        <motion.div
          className="max-w-xl uqhd:max-w-2xl uhd:max-w-3xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-green/70 uqhd:text-sm uhd:text-base">
            {BRAND_CONFIG.tagline}
          </p>
          <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-brand-green uqhd:text-[4.5rem] uhd:text-[6rem]">
            The operating system for{" "}
            <span className="italic text-brand-gold">modern buy-back</span>.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-green/70 sm:text-lg uqhd:max-w-xl uqhd:text-xl uhd:max-w-2xl uhd:text-2xl">
            Fair cash for gadgets, jewelry, and pre-loved valuables. Send photos, get a clear offer,
            and walk away with cash — fast, transparent, and built for real people.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 uqhd:mt-10 uqhd:gap-4 uhd:mt-12">
            <a
              href="#pricing"
              onClick={(e) => onScroll(e, "pricing", "PRICING")}
              className="inline-flex items-center justify-center rounded-md bg-brand-gold px-6 py-3 text-xs font-black uppercase tracking-wider text-brand-green transition hover:brightness-105 uqhd:px-8 uqhd:py-3.5 uqhd:text-sm uhd:px-10 uhd:py-4 uhd:text-base"
            >
              View pricing
            </a>
            <a
              href="#items-for-sale"
              onClick={(e) => onScroll(e, "items-for-sale", "ITEMS FOR SALE")}
              className="inline-flex items-center justify-center rounded-md border border-brand-green/25 bg-white/70 px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand-green backdrop-blur-sm transition hover:border-brand-green uqhd:px-8 uqhd:py-3.5 uqhd:text-sm uhd:px-10 uhd:py-4 uhd:text-base"
            >
              Explore items
            </a>
          </div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Laptop mock */}
          <div className="relative mx-auto w-full max-w-[520px] uqhd:max-w-[720px] uhd:max-w-[960px]">
            <div className="rounded-t-xl border border-brand-green/15 bg-[#1a1f1c] p-2 shadow-2xl shadow-brand-green/20 uqhd:rounded-t-2xl uqhd:p-3 uhd:p-4">
              <div className="overflow-hidden rounded-lg bg-gradient-to-br from-brand-green to-[#083528] uqhd:rounded-xl">
                <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 uqhd:px-4 uqhd:py-3">
                  <span className="h-2 w-2 rounded-full bg-red-400/80 uqhd:h-2.5 uqhd:w-2.5" />
                  <span className="h-2 w-2 rounded-full bg-brand-gold/80 uqhd:h-2.5 uqhd:w-2.5" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80 uqhd:h-2.5 uqhd:w-2.5" />
                  <span className="ml-2 text-[10px] font-medium text-white/40 uqhd:text-xs uhd:text-sm">
                    {BRAND_CONFIG.shortCompanyName} Dashboard
                  </span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3 uqhd:gap-4 uqhd:p-6 uhd:gap-5 uhd:p-8">
                  {["Offers", "Inventory", "Branches"].map((label, i) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3 uqhd:p-4 uhd:rounded-xl uhd:p-5">
                      <p className="text-[10px] uppercase tracking-wider text-brand-gold/80 uqhd:text-xs uhd:text-sm">{label}</p>
                      <p className="mt-1 text-lg font-black text-white uqhd:text-2xl uhd:text-3xl">{["128", "64", "12"][i]}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10 uqhd:h-2">
                        <div
                          className="h-full rounded-full bg-brand-gold"
                          style={{ width: `${[72, 54, 88][i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 uqhd:px-6 uqhd:pb-6 uhd:px-8 uhd:pb-8">
                  <div className="h-24 rounded-lg border border-white/10 bg-white/5 p-3 uqhd:h-36 uhd:h-48">
                    <div className="flex h-full items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-brand-gold/80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-auto h-3 w-[88%] rounded-b-md bg-[#2a2f2c] uqhd:h-4" />
            <div className="mx-auto h-1.5 w-[60%] rounded-b-sm bg-[#3a3f3c] uqhd:h-2" />
          </div>

          {/* Floating metrics card */}
          <motion.div
            className="absolute -bottom-2 left-0 right-auto w-[200px] rounded-xl border border-brand-green/10 bg-white p-4 shadow-xl shadow-brand-green/10 sm:left-[-12px] sm:w-[220px] uqhd:w-[280px] uqhd:p-5 uhd:w-[340px] uhd:p-6"
            animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green/45 uqhd:text-xs">
              Live metrics
            </p>
            <p className="mt-2 text-2xl font-black text-brand-green uqhd:text-3xl uhd:text-4xl">₱2.4M</p>
            <p className="text-xs text-brand-green/55 uqhd:text-sm">Paid to sellers this month</p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-green/8 px-2 py-1 text-[10px] font-bold text-brand-green uqhd:text-xs">
              <span className="text-emerald-600">↑ 18%</span> vs last month
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingBentoFeatures({ onScroll }: { onScroll: ScrollHandler }) {
  return (
    <section id="categories" className="landing-section-pad bg-white">
      <div className="landing-container text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-gold uqhd:text-base uhd:text-lg">Unified experience</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl uqhd:text-6xl uhd:text-7xl">
          Everything you need to sell with confidence
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-brand-green/60 uqhd:max-w-3xl uqhd:text-xl uhd:max-w-4xl uhd:text-2xl">
          From first photo to final payout — {BRAND_CONFIG.shortCompanyName} keeps the process simple,
          fair, and transparent.
        </p>
      </div>

      <div className="landing-container mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2 uqhd:mt-16 uqhd:gap-6 uhd:mt-20 uhd:gap-8">
        {bentoFeatures.map((feature, index) => (
          <a
            key={feature.title}
            href={index === 1 ? "#categories" : "#pricing"}
            onClick={(e) =>
              onScroll(
                e,
                index === 1 ? "categories" : "pricing",
                index === 1 ? "WHAT WE BUY" : "PRICING"
              )
            }
            className={`group relative overflow-hidden rounded-2xl uqhd:rounded-3xl ${feature.className} ${
              index === 0 ? "md:col-span-2" : ""
            } ${index === 1 ? "md:col-span-1 md:row-span-2 md:min-h-full" : ""} uqhd:min-h-[320px] uhd:min-h-[420px]`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={feature.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/50 to-brand-green/20" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-left md:p-6 uqhd:p-8 uhd:p-10">
              <h3 className="font-display text-xl font-bold text-white md:text-2xl uqhd:text-3xl uhd:text-4xl">{feature.title}</h3>
              <p className="mt-1 text-sm text-white/75 uqhd:text-base uhd:text-lg">{feature.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function LandingProcessPricing({ onScroll }: { onScroll: ScrollHandler }) {
  return (
    <section id="pricing" className="landing-section-pad bg-[#f4f2ee]">
      <div className="landing-container text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-gold uqhd:text-base uhd:text-lg">Pricing</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl uqhd:text-6xl uhd:text-7xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-green/60 uqhd:max-w-2xl uqhd:text-xl uhd:max-w-3xl uhd:text-2xl">
          Choose the plan that fits your pawnshop. Scale as you grow — no hidden fees.
        </p>
      </div>

      <div className="landing-container mt-12 grid gap-6 md:grid-cols-3 md:items-stretch uqhd:mt-16 uqhd:gap-8 uhd:mt-20 uhd:gap-10">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-7 shadow-sm uqhd:rounded-3xl uqhd:p-9 uhd:p-11 ${
              plan.popular
                ? "border-brand-green bg-brand-green text-white shadow-xl shadow-brand-green/25 md:scale-[1.03]"
                : "border-brand-green/10 bg-white text-brand-green"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-green uqhd:px-4 uqhd:text-xs uhd:text-sm">
                Most popular
              </span>
            )}
            <p className={`text-xs font-bold uppercase tracking-widest uqhd:text-sm ${plan.popular ? "text-brand-gold" : "text-brand-green/50"}`}>
              {plan.name}
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <p className="font-display text-4xl font-bold uqhd:text-5xl uhd:text-6xl">{plan.price}</p>
              {plan.period ? (
                <span className={`text-sm font-semibold uqhd:text-base ${plan.popular ? "text-white/60" : "text-brand-green/45"}`}>
                  {plan.period}
                </span>
              ) : null}
            </div>
            <p className={`mt-2 text-sm uqhd:text-base ${plan.popular ? "text-white/70" : "text-brand-green/55"}`}>
              {plan.audience}
            </p>
            <ul className="mt-6 flex-1 space-y-3 uqhd:mt-8 uqhd:space-y-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm uqhd:text-base uhd:text-lg">
                  <span className={`mt-0.5 ${plan.popular ? "text-brand-gold" : "text-brand-green"}`}>✓</span>
                  <span className={plan.popular ? "text-white/85" : "text-brand-green/75"}>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={`#${plan.ctaTarget}`}
              onClick={(e) => onScroll(e, plan.ctaTarget, plan.ctaNav)}
              className={`mt-8 block rounded-md py-3 text-center text-xs font-black uppercase tracking-wider transition uqhd:mt-10 uqhd:py-3.5 uqhd:text-sm uhd:py-4 uhd:text-base ${
                plan.popular
                  ? "bg-brand-gold text-brand-green hover:brightness-105"
                  : "border border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-white"
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingSplitSection({ onScroll }: { onScroll: ScrollHandler }) {
  return (
    <section id="why-us" className="grid lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-white px-6 py-16 sm:px-10 md:px-16 md:py-24 lg:px-20 uqhd:px-24 uqhd:py-32 uhd:px-32 uhd:py-40">
        <div className="mx-auto w-full max-w-xl uqhd:max-w-2xl uhd:max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold uqhd:text-sm uhd:text-base">
            Next-gen service
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-brand-green md:text-4xl uqhd:text-5xl uhd:text-6xl">
            Built for the speed of cash
          </h2>
          <p className="mt-4 max-w-md text-brand-green/65 uqhd:max-w-lg uqhd:text-lg uhd:max-w-xl uhd:text-xl">
            We designed every step around speed and trust — so you spend less time waiting and more
            time getting paid fairly.
          </p>
          <ul className="mt-8 space-y-4 uqhd:mt-10 uqhd:space-y-5">
            {[
              { title: "Honest valuations", desc: "Offers based on real market value." },
              { title: "Protected hand-off", desc: "Clear process from drop-off to payout." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-gold uqhd:h-10 uqhd:w-10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 uqhd:h-5 uqhd:w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-brand-green uqhd:text-lg uhd:text-xl">{item.title}</p>
                  <p className="text-sm text-brand-green/55 uqhd:text-base">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href="#contact-us"
            onClick={(e) => onScroll(e, "contact-us", "CONTACT US")}
            className="mt-10 inline-flex w-fit items-center justify-center rounded-md bg-brand-green px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-brand-green/90 uqhd:px-9 uqhd:py-4 uqhd:text-sm uhd:text-base"
          >
            Contact us
          </a>
        </div>
      </div>
      <div className="relative min-h-[320px] lg:min-h-full uqhd:min-h-[640px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-brand-green/35" />
        <div className="absolute bottom-8 left-8 right-8 uqhd:bottom-12 uqhd:left-12 uhd:bottom-16 uhd:left-16">
          <p className="font-display text-2xl font-bold text-white md:text-3xl uqhd:text-5xl uhd:text-6xl">
            {BRAND_CONFIG.shortCompanyName}
          </p>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-brand-gold uqhd:text-base uhd:text-lg">Trusted buy-back partner</p>
        </div>
      </div>
    </section>
  );
}

export function LandingTrustBar() {
  const items = [
    "Fair market offers",
    "Same-day response",
    "Secure transactions",
    "Multi-branch support",
  ];
  return (
    <div className="border-y border-brand-green/10 bg-white px-4 py-8 uqhd:py-12 uhd:py-14">
      <div className="landing-container flex flex-wrap items-center justify-center gap-x-10 gap-y-4 uqhd:gap-x-16 uhd:gap-x-20">
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

export function LandingLightFooter({
  onScroll,
  onLoginClick,
  onOpenBranches,
  onOpenLegal,
  branchCountLabel,
}: {
  onScroll: ScrollHandler;
  onLoginClick: () => void;
  onOpenBranches: () => void;
  onOpenLegal: (type: "privacy" | "terms") => void;
  branchCountLabel: string;
}) {
  return (
    <footer className="bg-[#eceae6] px-6 py-14 md:px-12 lg:px-16 uqhd:px-20 uqhd:py-20 uhd:px-28 uhd:py-24">
      <div className="landing-container-wide grid gap-10 md:grid-cols-2 lg:grid-cols-4 uqhd:gap-14">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image src={BRAND_CONFIG.companyLogo} alt={BRAND_CONFIG.shortCompanyName} width={44} height={44} className="rounded-lg uqhd:h-14 uqhd:w-14" />
            <div>
              <p className="font-display text-xl font-bold text-brand-green uqhd:text-2xl uhd:text-3xl">{BRAND_CONFIG.shortCompanyName}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold uqhd:text-xs">{BRAND_CONFIG.tagline}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brand-green/55 uqhd:text-base uhd:text-lg">
            Your trusted partner for buying back pre-loved gadgets and valuables — fast, fair, and friendly.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-green">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-green/60">
            {[
              ["Pricing", "pricing", "PRICING"],
              ["What we buy", "categories", "WHAT WE BUY"],
              ["Items for sale", "items-for-sale", "ITEMS FOR SALE"],
            ].map(([label, id, nav]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => onScroll(e, id, nav)} className="hover:text-brand-green">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-green">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-green/60">
            <li>
              <a href="#why-us" onClick={(e) => onScroll(e, "why-us", "WHY US")} className="hover:text-brand-green">
                Why us
              </a>
            </li>
            <li>
              <a href="#branches" onClick={(e) => onScroll(e, "branches", "BRANCHES")} className="hover:text-brand-green">
                Branches ({branchCountLabel})
              </a>
            </li>
            <li>
              <button type="button" onClick={onOpenBranches} className="hover:text-brand-green">
                Visit us
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-green">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-green/60">
            <li>
              <a href="#contact-us" onClick={(e) => onScroll(e, "contact-us", "CONTACT US")} className="hover:text-brand-green">
                Contact
              </a>
            </li>
            <li>
              <button type="button" onClick={onLoginClick} className="hover:text-brand-green">
                Staff login
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal("privacy")} className="hover:text-brand-green">
                Privacy policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal("terms")} className="hover:text-brand-green">
                Terms of service
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="landing-container-wide mt-12 border-t border-brand-green/10 pt-6 text-center text-xs text-brand-green/45 uqhd:mt-16 uqhd:text-sm">
        © 2026 {BRAND_CONFIG.companyName}. All rights reserved.
      </div>
    </footer>
  );
}
