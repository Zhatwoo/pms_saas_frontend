"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatedGradient } from "@/components/shared/animated-gradient";

interface AuthLandingPageProps {
  onLoginClick: () => void;
}

const navItems = ["HOME", "HOW IT WORKS", "CATEGORIES", "WHY US", "REVIEWS", "BRANCHES", "CONTACT US"];

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
    desc: "Our team reviews your submission and gives you a fair, competitive buy-back price — usually within the same day.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Get Paid Instantly",
    desc: "Agree to the offer, drop off or ship your item, and get paid instantly. Cash on hand or digital transfer — your choice.",
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
    desc: "Ask us — we might buy it!",
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
    desc: "We respond fast. Submit your item in the morning and have an offer by afternoon — no waiting around.",
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const lastScrollY = useRef(0);

  const totalSlides = allReviews.length;

  const goToReview = (next: number) => {
    setReviewIndex((next + totalSlides) % totalSlides);
  };

  const prevReview = () => goToReview(reviewIndex - 1);
  const nextReview = () => goToReview(reviewIndex + 1);

  // For seamless sliding, we wrap the reviews
  const extendedReviews = [
    allReviews[allReviews.length - 1],
    ...allReviews,
    allReviews[0],
  ];

  const handleScroll = (e: React.MouseEvent, id: string, item: string) => {
    e.preventDefault();
    setActiveNavItem(item);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
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
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 60) {
        setActiveNavItem("CONTACT US"); return;
      }
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 100) {
          const mapped = navItems.find((item) => item.toLowerCase().replace(/ /g, "-") === section.id);
          if (mapped) setActiveNavItem(mapped);
        }
      });
    };
    window.addEventListener("scroll", handleScrollSync);
    return () => { window.removeEventListener("scroll", handleScrollSync); };
  }, []);

  useEffect(() => {
    const activeRef = navRefs.current[navItems.indexOf(activeNavItem)];
    if (activeRef) { setUnderlineLeft(activeRef.offsetLeft); setUnderlineWidth(activeRef.offsetWidth); }
  }, [activeNavItem]);

  return (
    <div className="min-h-screen bg-white selection:bg-amber-300 selection:text-emerald-900">
      {/* Plain white background */}

      <div className="relative z-10">
        {/* ── NAV ── */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-emerald-900/90 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 md:px-12">
            <Image src="/logo.png" alt="JCLB" width={48} height={48} className="rounded-lg cursor-pointer" onClick={(e) => handleScroll(e as any, "home", "HOME")} />

            {/* Desktop nav links */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
              {navItems.map((item, index) => {
                const id = item.toLowerCase().replace(/ /g, "-");
                return (
                  <a key={item} ref={(el) => { navRefs.current[index] = el; }} href={`#${id}`}
                    onClick={(e) => handleScroll(e, id, item)}
                    className={`whitespace-nowrap text-sm font-bold tracking-wider transition-colors ${activeNavItem === item ? "text-amber-300" : "text-white hover:text-amber-300"}`}>
                    {item}
                  </a>
                );
              })}
              <span className="absolute -bottom-1 h-0.5 bg-amber-300 transition-all duration-300" style={{ left: `${underlineLeft}px`, width: `${underlineWidth}px` }} />
            </div>

            {/* Right side: hamburger */}
            <div className="flex items-center gap-2">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 md:hidden"
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

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="border-t border-white/10 bg-emerald-900 px-4 pb-4 md:hidden">
              {navItems.map((item) => {
                const id = item.toLowerCase().replace(/ /g, "-");
                return (
                  <a
                    key={item}
                    href={`#${id}`}
                    onClick={(e) => {
                      handleScroll(e, id, item);
                      setMobileMenuOpen(false);
                    }}
                    className={`block py-3 text-sm font-bold tracking-wider transition-colors border-b border-white/10 last:border-0 ${activeNavItem === item ? "text-amber-300" : "text-white/80 hover:text-amber-300"}`}
                  >
                    {item}
                  </a>
                );
              })}
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section id="home" className="relative overflow-hidden bg-white px-4 pt-24 pb-10 md:px-12 md:pt-28 md:pb-16">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="z-10 flex-1 text-center lg:max-w-xl lg:text-left reveal-on-scroll">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-amber-400 md:px-5 md:text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-emerald-900">★</span>
                TRUSTED BUY BACK SHOP FOR FILIPINO FAMILIES
              </div>
              <h1 className="text-4xl font-black leading-tight text-emerald-900 sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">Sell Your Items.</span>
                <span className="block text-emerald-800">Get Paid Today.</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-emerald-900/70 sm:text-base md:text-lg mx-auto lg:mx-0">
                JCLB Buy Back Shop provides honest, secure, and compassionate financial solutions that uplift lives and build lasting relationships within our community.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:mt-8 md:gap-4 lg:justify-start">
                <button type="button" onClick={handleContactUsClick}
                  className="rounded-xl bg-emerald-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-800 hover:shadow-lg active:scale-95 md:px-8 md:py-4">
                  CONTACT US
                </button>
                <a href="#how-it-works" onClick={(e) => handleScroll(e, "how-it-works", "HOW IT WORKS")}
                  className="rounded-xl border-2 border-emerald-900 px-6 py-3 text-sm font-bold text-emerald-900 transition-all hover:bg-emerald-900 hover:text-white md:px-8 md:py-4">
                  HOW IT WORKS
                </a>
              </div>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-emerald-900/20 pt-6 md:mt-12 md:gap-10 md:pt-8 lg:justify-start">
                {[
                  { value: "100", unit: "%", label: "TRUSTED & LEGIT" },
                  { value: "24", unit: "hrs", label: "QUICK PAYOUT" },
                  { value: "500", unit: "+", label: "HAPPY SELLERS" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="flex items-end justify-center gap-1 lg:justify-start">
                      <span className="text-3xl font-black text-emerald-900 sm:text-4xl md:text-5xl">{stat.value}</span>
                      <span className="mb-1 text-lg font-bold text-emerald-900 sm:text-xl md:text-2xl">{stat.unit}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-900">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo with rays + cloud glow — hidden on small mobile, visible from sm up */}
            <div className="relative hidden flex-1 sm:flex lg:flex-[1.2] justify-center lg:justify-end lg:translate-x-16">
              <div className="relative w-full flex justify-center lg:justify-end">
                {/* Rotating rays */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[80%] animate-[spin_20s_linear_infinite] opacity-30">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute inset-0 flex items-center justify-center"
                        style={{ transform: `rotate(${i * 30}deg)` }}>
                        <div className="w-1 bg-gradient-to-t from-transparent via-white to-transparent" style={{ height: "50%", transformOrigin: "bottom center" }} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Cloud glows */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-[60%] h-[60%] rounded-full bg-white/70 blur-2xl animate-[logoOrbit_8s_ease-in-out_infinite]" />
                  <div className="absolute w-[45%] h-[45%] rounded-full bg-white/50 blur-2xl animate-[logoOrbitReverse_6s_ease-in-out_infinite]" />
                  <div className="absolute w-[50%] h-[50%] rounded-full bg-white/60 blur-3xl animate-[logoPulse_3s_ease-in-out_infinite]" />
                </div>
                <Image src="/logo.png" alt="JCLB" width={1000} height={1000}
                  className="relative h-auto w-full max-w-[280px] drop-shadow-2xl sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px] xl:max-w-[900px] animate-slow-pulse" priority />
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="bg-white px-4 py-20 md:px-12 md:py-32 lg:py-48">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <h2 className="text-3xl font-black text-emerald-900 md:text-4xl lg:text-5xl">
              <span className="text-amber-400">3</span> Steps to Get Your Cash
            </h2>
            <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
              {steps.map((item, index) => (
                <div key={item.step}
                  className="reveal-on-scroll flex flex-col rounded-2xl bg-emerald-900 p-6 text-white shadow-xl h-full md:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      {item.icon}
                    </div>
                    <span className="text-3xl font-black text-amber-400">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75 flex-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section id="categories" className="bg-emerald-900/90 px-4 py-16 md:px-12 md:py-24 lg:pt-32 lg:pb-32">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center reveal-on-scroll">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-400">WHAT WE BUY</p>
            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl lg:text-5xl">
              We Accept a <span className="text-amber-400">WIDE RANGE</span> of items
            </h2>
            <p className="mt-3 text-base text-white/70">
              From the latest smartphones to vintage electronics — if it has value, <span className="text-amber-400">we want it.</span>
            </p>
            <div className="mt-8 grid w-full grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 justify-items-center">
              {categories.map((cat) => (
                <div key={cat.name}
                  className="flex h-full w-full max-w-[220px] flex-col items-center rounded-2xl bg-emerald-50 p-4 text-center shadow-md transition-transform hover:scale-105 hover:shadow-xl md:p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100 mb-3 md:mb-4">
                    {cat.icon}
                  </div>
                  <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wide md:text-sm">{cat.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY US ── */}
        <section id="why-us" className="bg-white px-4 py-16 md:px-12 md:py-24 lg:pt-48 lg:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:gap-12 reveal-on-scroll">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-widest text-amber-500">WHY CHOOSE US?</p>
              <h2 className="mt-2 text-4xl font-black leading-tight text-emerald-900 md:text-5xl">
                Fair Prices. Fast Cash.<br /><span className="text-emerald-700">ZERO HASSLE.</span>
              </h2>
              <div className="mt-8 rounded-2xl bg-emerald-900 p-8 shadow-2xl">
                <p className="text-base leading-relaxed text-white">
                  We believe everyone deserves a fair price for their pre-loved items — no low-balling, no runarounds.
                </p>
                <p className="mt-4 text-xs text-amber-300">— JCLB Buy Back Shop Team</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5">
                  <span className="text-sm font-black text-emerald-900">5.0</span>
                  <span className="text-[10px] font-bold text-emerald-900">CUSTOMER RATING</span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              {reasons.map((item) => (
                <div key={item.title}
                  className="flex items-start gap-4 rounded-xl bg-emerald-50/80 p-5 shadow-sm transition-colors hover:bg-emerald-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-900">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVIEWS CAROUSEL ── */}
        <section id="reviews" className="bg-white px-4 py-16 md:px-12 md:py-24 lg:pt-20 lg:pb-48">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-500">CUSTOMER REVIEWS</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-900 md:text-4xl lg:text-5xl">What Our Sellers Say</h2>

            <div className="mt-8 relative flex items-center gap-2 md:mt-12 md:gap-4">
              {/* Left arrow */}
              <button onClick={prevReview}
                className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-white shadow-lg transition hover:bg-emerald-800 active:scale-95 md:h-12 md:w-12">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Mobile: single card */}
              <div className="flex-1 md:hidden">
                <div className="rounded-2xl bg-emerald-900 p-5 text-white shadow-2xl">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, si) => (
                      <svg key={si} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-white/90">&ldquo;{allReviews[reviewIndex].quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-emerald-900">
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
              <div className="hidden flex-1 overflow-hidden py-10 md:block">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${(1 - (reviewIndex + 1)) * 33.333}%)` }}
                >
                  {extendedReviews.map((review, i) => {
                    const isCenter = i === reviewIndex + 1;
                    return (
                      <div key={`${review.name}-${i}`} className="w-1/3 shrink-0 px-4 transition-all duration-500">
                        <div className={`h-full rounded-2xl p-6 shadow-lg transition-all duration-500 ${
                          isCenter
                            ? "bg-emerald-900 text-white scale-105 shadow-2xl z-10"
                            : "bg-emerald-50/80 text-emerald-900 scale-95 opacity-50"
                        }`}>
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, si) => (
                              <svg key={si} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className={`text-sm leading-relaxed mb-6 ${isCenter ? "text-white/90" : "text-zinc-600"}`}>
                            &ldquo;{review.quote}&rdquo;
                          </p>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${isCenter ? "bg-amber-400 text-emerald-900" : "bg-emerald-900 text-white"}`}>
                              {review.initials}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isCenter ? "text-white" : "text-emerald-900"}`}>{review.name}</p>
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
                className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-white shadow-lg transition hover:bg-emerald-800 active:scale-95 md:h-12 md:w-12">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 md:h-5 md:w-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Dots */}
            <div className="mt-4 flex justify-center gap-2 md:mt-6">
              {allReviews.map((_, i) => (
                <button key={i} onClick={() => goToReview(i)}
                  className={`h-2 rounded-full transition-all ${i === reviewIndex ? "w-6 bg-emerald-900" : "w-2 bg-emerald-900/30"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ── BRANCH LOCATIONS ── */}
        <section id="branches" className="bg-white px-6 pt-20 pb-32 md:px-12 md:pt-28 md:pb-40">
          <div className="mx-auto max-w-6xl reveal-on-scroll">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-500">FIND US</p>
            <h2 className="mt-2 text-4xl font-black text-emerald-900 md:text-5xl">Our Branch Locations</h2>
            <p className="mt-3 text-base text-emerald-900/60">Visit us at any of our branches across Metro Manila.</p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Pasig Branch", address: "123 Ortigas Ave, Pasig City", hours: "Mon–Sat 9AM–6PM", phone: "+63 912 345 6789" },
                { name: "Taguig Branch", address: "456 BGC High Street, Taguig City", hours: "Mon–Sat 9AM–6PM", phone: "+63 912 345 6790" },
                { name: "Makati Branch", address: "789 Ayala Ave, Makati City", hours: "Mon–Sat 9AM–6PM", phone: "+63 912 345 6791" },
              ].map((branch) => (
                <div key={branch.name} className="rounded-2xl bg-emerald-900 overflow-hidden shadow-xl">
                  {/* Map placeholder */}
                  <div className="relative h-40 bg-emerald-800 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,.1) 20px,rgba(255,255,255,.1) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(255,255,255,.1) 20px,rgba(255,255,255,.1) 21px)" }} />
                    <div className="relative flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-emerald-900">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-widest">View on Map</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-white text-lg">{branch.name}</h3>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 mt-0.5 text-amber-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {branch.address}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-amber-400">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {branch.hours}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-amber-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {branch.phone}
                      </div>
                    </div>
                    <button className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-black text-emerald-900 hover:bg-amber-300 transition-colors">
                      Get Directions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT CTA ── */}
        <section id="contact-us" className="bg-red-600 px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 text-center reveal-on-scroll">
            <div>
              <h2 className="text-4xl font-black text-white md:text-5xl">Ready to Turn Your Items Into Cash?</h2>
              <p className="mt-3 text-xl text-white/60">It only takes a minute to start.</p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-emerald-900 px-8 py-12 md:px-16">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-16 lg:gap-24">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/logo.png" alt="JCLB" width={48} height={48} className="rounded-lg" />
                  <div>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">BUY BACK</p>
                    <p className="text-xl font-black text-white leading-none">Pawnshop</p>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  Your trusted partner for buying back pre-loved gadgets and electronics. Fast, fair, and friendly — that&apos;s the{" "}
                  <span className="text-amber-400 font-bold">JCLB promise.</span>
                </p>
              </div>

              {/* Quick Links */}
              <div className="md:flex md:justify-center">
                <div className="w-fit">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">QUICK LINKS</p>
                  <ul className="space-y-2.5">
                    {["How It Works", "What We Buy", "Why Choose Us", "Reviews", "Contact Us"].map((link) => {
                      const href = `#${link.toLowerCase().replace(/ /g, "-")}`;
                      return (
                        <li key={link}>
                          <a href={href} className="flex items-center gap-2 text-sm text-white/60 hover:text-amber-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            {link}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* What We Buy */}
              <div className="md:flex md:justify-center">
                <div className="w-fit">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">WHAT WE BUY</p>
                  <div className="flex flex-wrap gap-2 max-w-[200px]">
                    {["Smartphones", "Laptops", "Gaming Consoles", "Cameras", "Tablets", "Watches"].map((item) => (
                      <span key={item} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">CONTACT US</p>
                <div className="space-y-3">
                  {[
                    { icon: "f", label: "Facebook", sub: "JCLB Buy Back Shop", color: "bg-blue-600" },
                    { icon: "@", label: "Email Us", sub: "jclbbuybackshop@gmail.com", color: "bg-red-500" },
                    { icon: "📍", label: "Visit Us", sub: "Metro Manila, Philippines", color: "bg-emerald-600" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.color} text-white text-sm font-black`}>
                        {c.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{c.label}</p>
                        <p className="text-xs text-white/50">{c.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/40">
              {/* Left: Badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {["✓ 100% Legit", "✓ BSP Registered", "✓ 24hr Quick Payout"].map((badge) => (
                  <span key={badge} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 font-bold text-amber-400 whitespace-nowrap">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Middle: Copyright */}
              <div className="text-center whitespace-nowrap">
                <span>&copy; 2026 JCLB Buy Back Shop. All rights reserved.</span>
              </div>

              {/* Right: Slogans */}
              <div className="flex items-center gap-4 text-center md:text-right whitespace-nowrap">
                <span>Made with ❤️ for our customers</span>
                <button type="button" onClick={onLoginClick} className="italic text-amber-400/60 transition hover:text-amber-300 hover:underline">
                  &ldquo;Madaling Kausap&rdquo;
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
