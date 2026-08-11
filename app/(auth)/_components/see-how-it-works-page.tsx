"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Play } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { legalModalContent } from "@/lib/legal-content";
import { allTutorialFeatures, type TutorialFeature } from "@/lib/tutorial-features";
import { LandingVideoPlaceholder } from "@/app/(auth)/_components/landing-video-placeholder";
import { LandingLightFooter } from "@/app/(auth)/_components/landing-layout-sections";
import { LoginModal } from "@/app/(auth)/_components/login-modal";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";

type LegalModalType = "privacy" | "terms" | null;

function LandingLegalModal({ type, onClose }: { type: Exclude<LegalModalType, null>; onClose: () => void }) {
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

  const content = legalModalContent[type];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="see-how-legal-modal-title"
        className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={content.ariaLabel}
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
            <h3 id="see-how-legal-modal-title" className="mt-2 text-2xl font-bold">
              {content.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">{content.intro}</p>
          </div>
        </div>

        <div className="relative bg-brand-green/90">
          <div className="h-2 rounded-t-xl bg-stone-100" />
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
          <div className="space-y-4">
            {content.sections.map((section, index) => (
              <section key={section.title} className="border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/90 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-green">{section.title}</h4>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{section.body}</p>
                    {section.items && section.items.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
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
            onClick={onClose}
            className="w-full bg-brand-green/90 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green/80"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function TutorialVideoModal({
  feature,
  onClose,
}: {
  feature: TutorialFeature;
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

  const Icon = feature.icon;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-brand-green/15 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`${feature.title} tutorial`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-green/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
              <Icon className="h-6 w-6 text-brand-green" strokeWidth={2} />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-brand-green">{feature.title}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">{feature.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green/10 text-brand-green transition hover:bg-brand-green/15"
            aria-label="Close tutorial"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <LandingVideoPlaceholder title={feature.title} label="Tutorial video" variant="light" />

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-brand-green/70">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}

function TutorialFeatureCard({
  feature,
  index,
  isOpen,
  onToggle,
  onPlayVideo,
}: {
  feature: TutorialFeature;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onPlayVideo: () => void;
}) {
  const Icon = feature.icon;
  const opensUpwards = feature.opensUpwards ?? index >= allTutorialFeatures.length - 4;
  const isLastRowPair = index >= allTutorialFeatures.length - 2;

  return (
    <div
      onClick={onToggle}
      className={`group relative flex cursor-pointer items-center gap-4 rounded-[1.5rem] border bg-white p-5 shadow-[0_8px_30px_rgba(11,93,59,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/35 hover:shadow-[0_16px_40px_rgba(11,93,59,0.12)] ${
        isOpen ? "z-50 border-brand-gold/50 shadow-2xl" : "z-0 border-white"
      } ${isLastRowPair ? "lg:col-span-1" : ""} ${index === allTutorialFeatures.length - 2 ? "lg:col-start-2" : ""}`}
    >
      <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green/12 to-brand-gold/10 transition-all duration-300 group-hover:from-brand-green/18 group-hover:to-brand-gold/20">
          <Icon className="h-6 w-6 text-brand-green" strokeWidth={2} />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="font-display truncate text-lg font-bold text-brand-green md:text-xl">{feature.title}</h3>
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold/90">{feature.subtitle}</p>
        </div>
      </div>

      <span className="pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/8 text-brand-green/50 transition-all duration-300 group-hover:bg-brand-gold group-hover:text-brand-green">
        <Play className="ml-0.5 h-4 w-4 fill-current" />
      </span>

      <div
        className={`absolute left-0 right-0 flex flex-col rounded-[1.5rem] border border-brand-green/10 bg-white p-6 text-center shadow-2xl transition-all duration-300 ${
          opensUpwards ? "bottom-[calc(100%+0.75rem)] origin-bottom" : "top-[calc(100%+0.75rem)] origin-top"
        } ${
          isOpen
            ? "visible scale-y-100 translate-y-0 opacity-100"
            : `invisible opacity-0 ${opensUpwards ? "translate-y-4 scale-y-95" : "-translate-y-4 scale-y-95"}`
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-brand-green/35 transition hover:text-brand-green"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          aria-label="Close preview"
        >
          <ChevronDown className={`h-5 w-5 ${opensUpwards ? "rotate-180" : ""}`} />
        </button>

        <h4 className="font-display text-lg font-bold text-brand-green">{feature.title}</h4>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">{feature.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-brand-green/65">{feature.description}</p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPlayVideo();
          }}
          className="mt-5 overflow-hidden rounded-xl border border-brand-green/10 shadow-inner"
          aria-label={`Preview ${feature.title} tutorial`}
        >
          <LandingVideoPlaceholder title={feature.title} label="Tutorial preview" variant="light" showPlayIcon />
        </button>
      </div>
    </div>
  );
}

export function SeeHowItWorksPage() {
  const router = useRouter();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [playingFeature, setPlayingFeature] = useState<TutorialFeature | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const closeVideo = useCallback(() => setPlayingFeature(null), []);

  const handleFooterScroll = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: string) => {
      event.preventDefault();
      router.push(`/#${id}`);
    },
    [router],
  );

  const fullDemoFeature: TutorialFeature = {
    id: "full-demo",
    title: `${BRAND_CONFIG.shortCompanyName} Full Demo`,
    subtitle: "Complete walkthrough",
    description: `Watch the full ${BRAND_CONFIG.shortCompanyName} demo to see how the platform connects your pawnshop operations in one system.`,
    icon: allTutorialFeatures[0].icon,
  };

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
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            Back to home
          </Link>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl px-6 text-center md:mt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">Tutorials</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-white md:text-6xl">
            See {BRAND_CONFIG.shortCompanyName}{" "}
            <span className="text-brand-gold">in Action</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Watch how each feature works and discover how {BRAND_CONFIG.shortCompanyName} can help organize
            your pawnshop operations.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-brand-gold" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              {allTutorialFeatures.length} platform features
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[1px]">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="block h-16 w-full md:h-24"
            aria-hidden="true"
          >
            <path
              d="M0,64 C360,120 720,0 1080,48 C1260,72 1380,96 1440,80 L1440,120 L0,120 Z"
              fill="#f4f2ee"
            />
          </svg>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 md:-mt-6 md:pt-0">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Feature walkthroughs</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-green/60">
            Click any feature to preview its tutorial placeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {allTutorialFeatures.map((feature, index) => (
            <TutorialFeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              isOpen={openCardId === feature.id}
              onToggle={() => setOpenCardId((current) => (current === feature.id ? null : feature.id))}
              onPlayVideo={() => {
                setOpenCardId(null);
                setPlayingFeature(feature);
              }}
            />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <button
            type="button"
            onClick={() => setPlayingFeature(fullDemoFeature)}
            className="group flex items-center overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(11,93,59,0.2)] transition hover:scale-[1.03] active:scale-[0.98]"
          >
            <span className="bg-brand-green px-8 py-4 text-sm font-black uppercase tracking-wider text-white md:px-10 md:text-base">
              Watch Full Demo
            </span>
            <span className="flex h-full items-center bg-[#004d40] px-5 py-4 transition group-hover:bg-[#003830]">
              <Play className="h-6 w-6 fill-brand-gold text-brand-gold" />
            </span>
          </button>
        </div>
      </section>

      <LandingLightFooter
        onScroll={handleFooterScroll}
        onLoginClick={() => setShowLogin(true)}
        onOpenLegal={(type) => setLegalModal(type)}
      />

      {playingFeature && <TutorialVideoModal feature={playingFeature} onClose={closeVideo} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {legalModal && <LandingLegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  );
}
