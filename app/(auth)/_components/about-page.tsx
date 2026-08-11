"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { legalModalContent } from "@/lib/legal-content";
import { LandingLightFooter } from "@/app/(auth)/_components/landing-layout-sections";
import { LoginModal } from "@/app/(auth)/_components/login-modal";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";

type LegalModalType = "privacy" | "terms" | null;

const highlights = [
  {
    title: "Built for pawnshops",
    body: `${BRAND_CONFIG.shortCompanyName} is designed to help pawnshop owners and staff manage customers, transactions, inventory, and daily operations in one organized cloud platform.`,
  },
  {
    title: "Backed by experience",
    body: `Developed by ${BRAND_CONFIG.parentCompany.legalName}, a company focused on bringing trusted technology and meaningful solutions to Filipino businesses.`,
  },
  {
    title: "Grow with confidence",
    body: "From single-branch shops to multi-location networks, QuickPawn aims to give teams better visibility, cleaner records, and smoother day-to-day workflows.",
  },
];

export function AboutPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const handleFooterScroll = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: string) => {
      event.preventDefault();
      router.push(`/#${id}`);
    },
    [router],
  );

  const ingi = BRAND_CONFIG.parentCompany;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f2ee] text-brand-green">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#0d6b45_0%,#0B5D3B_42%,#063827_100%)] pb-28 pt-6 md:pb-36">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-brand-gold/10 blur-3xl" />
          <div className="absolute -right-20 top-32 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-3 text-white transition hover:opacity-90">
            <QuickPawnLogo className="h-10 md:h-12 lg:h-14 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="rounded-full bg-brand-gold px-4 py-2 text-[11px] font-black uppercase tracking-wider text-brand-green transition hover:brightness-105"
            >
              Login
            </button>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl px-6 text-center md:mt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">Company</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-white md:text-6xl">
            About{" "}
            <span className="text-brand-gold">{BRAND_CONFIG.shortCompanyName}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            {BRAND_CONFIG.shortCompanyName} is a pawnshop management platform from{" "}
            {ingi.legalName} — built to help Filipino pawnshops run smarter, stay organized, and grow
            with confidence.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[1px]">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-16 w-full md:h-24" aria-hidden="true">
            <path d="M0,64 C360,120 720,0 1080,48 C1260,72 1380,96 1440,80 L1440,120 L0,120 Z" fill="#f4f2ee" />
          </svg>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-brand-green/10 bg-white p-6 shadow-[0_8px_30px_rgba(11,93,59,0.08)]"
            >
              <h2 className="font-display text-xl font-bold text-brand-green">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-green/70">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-brand-green/10 bg-white shadow-[0_16px_50px_rgba(11,93,59,0.10)]">
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-10 lg:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-gold">
                About {ingi.shortName}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-brand-green md:text-4xl">
                {ingi.legalName}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-green/70 md:text-base">
                {ingi.tagline}. {ingi.legalName} bridges Japanese innovation with the evolving needs of
                Filipino individuals, families, and businesses — introducing trusted systems that help
                teams work smarter and serve customers better.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-brand-green/70 md:text-base">
                {BRAND_CONFIG.shortCompanyName} is part of that mission: practical software that supports
                real pawnshop operations, from new pawns and renewals to inventory, reporting, and branch
                management.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={ingi.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
                >
                  Visit {ingi.shortName} Website
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  href="/social"
                  className="inline-flex items-center justify-center rounded-full border border-brand-green/20 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-green transition hover:border-brand-green/40"
                >
                  Social media
                </Link>
                <Link
                  href="/#contact-us"
                  className="inline-flex items-center justify-center rounded-full border border-brand-green/20 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-green transition hover:border-brand-green/40"
                >
                  Contact QuickPawn
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-green to-[#063827] p-8 text-white md:p-10 lg:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">Office</p>
              <h3 className="mt-3 text-2xl font-bold">Get in touch</h3>
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                <li>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">Address</p>
                  <p className="mt-1 leading-relaxed">{BRAND_CONFIG.address}</p>
                </li>
                <li>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">Email</p>
                  <a href={`mailto:${BRAND_CONFIG.email}`} className="mt-1 inline-block hover:text-brand-gold">
                    {BRAND_CONFIG.email}
                  </a>
                </li>
                <li>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">Phone</p>
                  <a href={`tel:${BRAND_CONFIG.phone.replace(/\s/g, "")}`} className="mt-1 inline-block hover:text-brand-gold">
                    {BRAND_CONFIG.phone}
                  </a>
                </li>
              </ul>
              <p className="mt-8 text-xs leading-relaxed text-white/55">
                For careers, partnerships, and company news, visit the official {ingi.shortName} website.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingLightFooter
        onScroll={handleFooterScroll}
        onLoginClick={() => setShowLogin(true)}
        onOpenLegal={(type) => setLegalModal(type)}
      />

      {showLogin ? <LoginModal onClose={() => setShowLogin(false)} /> : null}

      {legalModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          onClick={() => setLegalModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              aria-label={legalModalContent[legalModal].ariaLabel}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              ×
            </button>
            <div className="bg-brand-green/90 px-6 pb-6 pt-7 text-white sm:px-8">
              <h3 className="text-2xl font-bold">{legalModalContent[legalModal].title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">{legalModalContent[legalModal].intro}</p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
              <div className="space-y-4">
                {legalModalContent[legalModal].sections.map((section, index) => (
                  <section key={section.title} className="border-b border-zinc-200 pb-4 last:border-0">
                    <h4 className="text-sm font-bold text-brand-green">{section.title}</h4>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{section.body}</p>
                    {section.items?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-200 bg-white/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full bg-brand-green/90 py-3 text-sm font-bold text-white"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
