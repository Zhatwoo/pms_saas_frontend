"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface AuthLandingPageProps {
  onLoginClick: () => void;
  onSignUpClick?: () => void;
}

const navItems = ["HOME", "HOW IT WORKS", "CATEGORIES", "WHY US", "REVIEWS", "CONTACT US"];

const steps = [
  {
    step: "01",
    title: "Send Your Item Details",
    desc: "Message us on Facebook with photos and details of your item. We accept gadgets, appliances, accessories, and more.",
  },
  {
    step: "02",
    title: "Get a Fair Offer",
    desc: "Our team reviews your submission and gives you a fair, competitive buy-back price - usually within the same day.",
  },
  {
    step: "03",
    title: "Get Paid Instantly",
    desc: "Agree to the offer, drop off or ship your item, and get paid instantly. Cash on hand or digital transfer - your choice.",
  },
];

const categories = [
  { name: "SMARTPHONES", desc: "iPhone, Samsung and More" },
  { name: "LAPTOP & PCs", desc: "All brands accepted" },
  { name: "APPLIANCES", desc: "Smart and Large Electronics" },
  { name: "GAMING CONSOLES", desc: "PSP, Xbox or Nintendo" },
  { name: "CAMERAS", desc: "DSLR, mirrorless and action cams" },
  { name: "SMARTWATCHES", desc: "Apple Watch or Galaxy Watch" },
  { name: "AUDIO & EARPHONES", desc: "Headphones, TWS or Speakers" },
  { name: "OTHER ITEMS", desc: "Ask us - we might buy it!" },
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

const reviews = [
  {
    name: "Manon M.",
    sold: "Sold an iPhone 12",
    quote:
      "Super fast response! I messaged them about my old iPhone and got an offer within a few hours. Payment was smooth and no issues at all.",
  },
  {
    name: "Carlos R.",
    sold: "Sold a MacBook Pro",
    quote:
      "Best buy-back shop I've tried. They gave me a fair price for my laptop and the whole process took less than a day. Highly recommend!",
  },
  {
    name: "Mindy Meeks",
    sold: "Sold a Samsung Galaxy",
    quote:
      "Very professional and trustworthy. They explained everything clearly and I felt comfortable with the whole transaction. Will sell again!",
  },
];

export function AuthLandingPage({
  onLoginClick,
  onSignUpClick,
}: AuthLandingPageProps) {
  const [activeNavItem, setActiveNavItem] = useState("HOME");
  const [underlineLeft, setUnderlineLeft] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleScroll = (e: React.MouseEvent, id: string, item: string) => {
    e.preventDefault();
    setActiveNavItem(item);
    const element = document.getElementById(id);
    if (element) {
      const offset = 64; // Fixed header height (h-16)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash without jumping
      window.history.pushState(null, "", `#${id}`);
    }
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    const handleScrollSync = () => {
      const sections = document.querySelectorAll("section[id]");
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Force "CONTACT US" at the very bottom
      if (scrollPos + windowHeight >= documentHeight - 60) {
        setActiveNavItem("CONTACT US");
        return;
      }

      let currentSection = activeNavItem;
      let minDistance = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const id = section.id;
        
        // We look for sections whose top is near the header (64px)
        // or which occupy the top portion of the screen
        const distance = Math.abs(rect.top - 64);
        
        if (rect.top <= 120 && rect.bottom >= 100) {
          if (distance < minDistance) {
            minDistance = distance;
            const mappedItem = navItems.find(
              (item) => item.toLowerCase().replace(/ /g, "-") === id
            );
            if (mappedItem) {
              currentSection = mappedItem;
            }
          }
        }
      });

      if (currentSection !== activeNavItem) {
        setActiveNavItem(currentSection);
      }
    };

    window.addEventListener("scroll", handleScrollSync);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollSync);
    };
  }, [activeNavItem]);

  useEffect(() => {
    const activeIndex = navItems.indexOf(activeNavItem);
    const activeRef = navRefs.current[activeIndex];
    if (activeRef) {
      setUnderlineLeft(activeRef.offsetLeft);
      setUnderlineWidth(activeRef.offsetWidth);
    }
  }, [activeNavItem]);

  return (
    <div className="min-h-screen bg-emerald-50 selection:bg-amber-300 selection:text-emerald-900">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between bg-emerald-900 px-12 transition-all">
        <Image
          src="/logo.png"
          alt="JCLB"
          width={56}
          height={56}
          className="rounded-lg cursor-pointer"
          onClick={(e) => handleScroll(e, "home", "HOME")}
        />
        <div className="relative hidden items-center gap-8 md:flex">
          {navItems.map((item, index) => {
            const id = item.toLowerCase().replace(/ /g, "-");
            return (
              <a
                key={item}
                ref={(el) => {
                  navRefs.current[index] = el;
                }}
                href={`#${id}`}
                onClick={(e) => handleScroll(e, id, item)}
                className={`group relative text-sm font-bold tracking-wider transition-colors ${
                  activeNavItem === item ? "text-amber-300" : "text-white hover:text-amber-300"
                }`}
              >
                {item}
              </a>
            );
          })}
          <span
            className="absolute -bottom-1 h-0.5 bg-amber-300 transition-all duration-300 ease-in-out"
            style={{
              left: `${underlineLeft}px`,
              width: `${underlineWidth}px`,
            }}
          />
        </div>
        <button
          onClick={onLoginClick}
          className="rounded-lg bg-amber-300 px-6 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-amber-400"
        >
          LOGIN
        </button>
      </nav>

      <section id="home" className="relative overflow-hidden bg-emerald-50 px-6 pb-0 pt-8 md:px-12 md:pb-0 md:pt-12 lg:pb-0 lg:pt-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:text-left reveal-on-scroll">
          <div className="z-10 flex-1 shrink-0 text-center lg:max-w-xl lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-amber-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-emerald-900">
                ★
              </div>
              TRUSTED BUY BACK SHOP FOR FILIPINO FAMILIES
            </div>
            <h1 className="text-4xl font-black leading-tight text-emerald-900 md:text-6xl lg:text-8xl">
              <span className="lg:block lg:whitespace-nowrap">Sell Your Items.</span>
              <span className="text-slate-800 lg:block lg:whitespace-nowrap">Get Paid Today.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-700 md:text-lg lg:mx-0 mx-auto">
              JCLB Buy Back Shop provides honest, secure, and compassionate
              financial solutions that uplift lives and build lasting
              relationships within our community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <button
                type="button"
                onClick={onSignUpClick ?? onLoginClick}
                className="rounded-xl bg-emerald-900 px-8 py-4 font-bold text-white transition-all hover:bg-emerald-800 hover:shadow-lg active:scale-95"
              >
                GET STARTED
              </button>
              <a
                href="#how-it-works"
                onClick={(e) => handleScroll(e, "how-it-works", "HOW IT WORKS")}
                className="rounded-xl border-2 border-emerald-900 px-8 py-4 font-bold text-emerald-900 transition-all hover:bg-emerald-900 hover:text-white"
              >
                HOW IT WORKS
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 border-t border-emerald-900/10 pt-8 lg:justify-start lg:gap-12">
              <div className="text-center lg:text-left">
                <div className="flex items-end justify-center gap-1 lg:justify-start">
                  <span className="text-4xl font-bold text-emerald-900 md:text-5xl">
                    100
                  </span>
                  <span className="mb-1 text-xl font-bold text-emerald-900 md:text-2xl">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  TRUSTED & LEGIT
                </p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-end justify-center gap-1 lg:justify-start">
                  <span className="text-4xl font-bold text-emerald-900 md:text-5xl">24</span>
                  <span className="mb-1 text-xl font-bold text-emerald-900 md:text-2xl">
                    hrs
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  QUICK PAYOUT
                </p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-end justify-center gap-1 lg:justify-start">
                  <span className="text-4xl font-bold text-emerald-900 md:text-5xl">
                    500
                  </span>
                  <span className="mb-1 text-xl text-emerald-900 md:text-2xl">+</span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  HAPPY SELLERS
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative flex-1 lg:flex-[1.2] flex justify-center lg:justify-end lg:translate-x-32">
            <div className="animate-slow-pulse transition-transform duration-700 hover:scale-105 w-full flex justify-center lg:justify-end">
              <Image
                src="/logo.png"
                alt="JCLB"
                width={1000}
                height={1000}
                className="h-auto w-full max-w-[400px] drop-shadow-2xl md:max-w-[600px] lg:max-w-[800px] xl:max-w-[1000px]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-emerald-50 px-6 pb-20 pt-0 md:px-12 md:pb-32 md:pt-0 lg:pb-48 lg:pt-0">
        <div className="mx-auto max-w-7xl reveal-on-scroll">
          <h2 className="text-4xl font-bold text-emerald-900 md:text-6xl">
            <span className="text-amber-500">3</span> Steps to Get Your Cash
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className={`reveal-on-scroll reveal-delay-${(index + 1) * 100} rounded-xl bg-emerald-900 p-8 text-white`}
              >
                <span className="text-4xl font-bold text-amber-400">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="bg-emerald-900 px-6 py-20 md:px-12 md:py-32 lg:py-48">
        <div className="mx-auto max-w-7xl reveal-on-scroll">
          <p className="text-sm font-bold text-amber-400">WHAT WE BUY</p>
          <h2 className="mt-2 text-4xl font-black text-white md:text-5xl">
            We Accept a <span className="text-amber-400">WIDE RANGE</span> of
            items
          </h2>
          <p className="mt-4 text-xl text-white">
            From the latest smartphones to vintage electronics - if it has value,
            <span className="text-amber-400"> we want it.</span>
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((cat, index) => (
              <div
                key={cat.name}
                className={`reveal-on-scroll reveal-delay-${(index % 4) * 100} rounded-xl border border-amber-300 bg-emerald-50/75 p-6 shadow-lg transition-transform hover:scale-105`}
              >
                <h3 className="font-bold text-zinc-900">{cat.name}</h3>
                <p className="mt-1 text-sm text-zinc-600">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="bg-emerald-50 px-6 py-20 md:px-12 md:py-32 lg:py-48">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 lg:flex-row reveal-on-scroll">
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-500">WHY CHOOSE US?</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight text-emerald-900 md:text-5xl">
              Fair Prices. Fast Cash.
              <br />
              <span className="text-slate-700">ZERO HASSLE.</span>
            </h2>
            <div className="mt-8 rounded-2xl bg-emerald-900 p-8 shadow-2xl reveal-on-scroll">
              <p className="text-lg leading-relaxed text-white">
                We believe everyone deserves a fair price for their pre-loved
                items - no low-balling, no runarounds.
              </p>
              <p className="mt-4 text-xs text-red-300">
                - JCLB Buy Back Shop Team
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5">
                <span className="text-sm font-bold text-emerald-900">5.0</span>
                <span className="text-[10px] font-bold text-emerald-900">
                  CUSTOMER RATING
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6">
            {reasons.map((item, index) => (
              <div
                key={item.title}
                className={`reveal-on-scroll reveal-delay-${(index + 1) * 100} flex gap-4 rounded-lg bg-amber-400/20 p-5 transition-colors hover:bg-amber-400/30`}
              >
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-emerald-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="white"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-emerald-50 px-6 py-20 md:px-12 md:py-32 lg:py-48">
        <div className="mx-auto max-w-7xl reveal-on-scroll">
          <p className="text-sm font-bold text-amber-500">CUSTOMER REVIEWS</p>
          <h2 className="mt-2 text-4xl font-bold text-emerald-900 md:text-5xl">
            What Our Sellers Say
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {reviews.map((review, index) => (
              <div key={review.name} className={`reveal-on-scroll reveal-delay-${(index + 1) * 100} overflow-hidden rounded-2xl shadow-xl transition-transform hover:scale-[1.02]`}>
                <div className="bg-white p-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="rounded-t-[40px] bg-emerald-900 px-6 pb-8 pt-6">
                  <p className="text-sm leading-relaxed text-white">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                  <div className="mt-4">
                    <p className="font-semibold text-white">{review.name}</p>
                    <p className="text-sm text-white/70">{review.sold}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact-us" className="bg-red-700 px-6 py-20 md:px-12 md:py-32 lg:py-48">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row reveal-on-scroll">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Ready to Turn Your Items Into Cash?
            </h2>
            <p className="mt-4 text-3xl font-bold text-white/60 md:text-4xl lg:text-5xl">
              It only takes a minute to start.
            </p>
          </div>
          <button
            onClick={onSignUpClick ?? onLoginClick}
            className="flex-shrink-0 rounded-xl bg-white px-10 py-5 font-bold text-emerald-900 shadow-2xl transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95"
          >
            CONTACT US
          </button>
        </div>
      </section>

      <footer className="bg-emerald-900 px-12 py-10 text-center text-sm text-white/50">
        <p>&copy; 2026 JCLB Buy Back Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}
