"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { legalModalContent } from "@/lib/legal-content";
import { SocialAccountCard } from "@/lib/social-links";
import { LandingLightFooter } from "@/app/(auth)/_components/landing-layout-sections";
import { LoginModal } from "@/app/(auth)/_components/login-modal";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";

type LegalModalType = "privacy" | "terms" | null;

export function SocialPage() {
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
            <QuickPawnLogo className="h-9 w-auto brightness-0 invert" />
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
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">Connect</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-white md:text-6xl">
            Social <span className="text-brand-gold">Media</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Follow {BRAND_CONFIG.shortCompanyName} and {ingi.shortName} for updates, product news, and
            announcements.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[1px]">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-16 w-full md:h-24" aria-hidden="true">
            <path d="M0,64 C360,120 720,0 1080,48 C1260,72 1380,96 1440,80 L1440,120 L0,120 Z" fill="#f4f2ee" />
          </svg>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
            {BRAND_CONFIG.shortCompanyName}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-brand-green">Official product accounts</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-green/65">
            Product updates, feature highlights, and pawnshop management tips from the QuickPawn team.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {BRAND_CONFIG.socialMedia.map((account) => (
            <SocialAccountCard key={account.url} account={account} />
          ))}
        </div>

        <div className="mb-10 mt-16 md:mt-20">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">{ingi.shortName}</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-brand-green">
            {ingi.legalName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-green/65">
            Company news and behind-the-scenes from the team behind QuickPawn.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ingi.socialMedia.map((account) => (
            <SocialAccountCard key={account.url} account={account} />
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full border border-brand-green/20 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-green transition hover:border-brand-green/40"
          >
            About us
          </Link>
          <Link
            href="/#contact-us"
            className="inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
          >
            Contact QuickPawn
          </Link>
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
                {legalModalContent[legalModal].sections.map((section) => (
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
