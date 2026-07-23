"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatPeso } from "@/lib/currency";

interface PublicSaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  branchLocation: string;
  availableDate: string;
  price: number;
  status: string;
  imageUrl: string;
}

const ITEM_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "Appliances",
  "Gaming Console",
  "Camera",
  "Smartwatch",
  "Audio and Earphone",
  "Others",
];

const PAGE_SIZE = 9;

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function SaleSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-xl shadow-black/10">
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-brand-green/10 via-brand-green/5 to-pawn-gold/10" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-brand-green/10" />
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-brand-green/10" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-brand-green/5" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-8 animate-pulse rounded-xl bg-brand-green/5" />
          <div className="h-8 animate-pulse rounded-xl bg-brand-green/5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="font-bold uppercase tracking-[0.18em] text-brand-green/40">{label}</span>
      <span className="text-right font-semibold text-brand-green/80">{value}</span>
    </div>
  );
}

export function FeaturedSaleItems() {
  const [items, setItems] = useState<PublicSaleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<{ items: PublicSaleItem[]; total?: number }>("/inventory/public/for-sale");
        if (!mounted) {
          return;
        }

        setItems(Array.isArray(response.items) ? response.items : []);
      } catch (fetchError) {
        if (!mounted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load items for sale.");
        setItems([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const normalized = normalizeCategory(item.category || "Others");
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }

    return ITEM_CATEGORIES.map((label) => ({
      label,
      value: normalizeCategory(label),
      count: counts.get(normalizeCategory(label)) || 0,
    })).filter((category) => category.count > 0);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return items;
    }

    const normalizedSelected = normalizeCategory(selectedCategory);
    return items.filter((item) => normalizeCategory(item.category || "Others") === normalizedSelected);
  }, [items, selectedCategory]);

  const slides = useMemo(() => chunkItems(filteredItems, PAGE_SIZE), [filteredItems]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % slides.length);
    }, 9000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const branchCount = useMemo(() => {
    return new Set(items.map((item) => `${item.branch}-${item.branchLocation}`.trim())).size;
  }, [items]);

  const currentItems = slides[currentSlide] || [];
  const hasItems = currentItems.length > 0;
  const selectedCategoryLabel =
    selectedCategory === "all"
      ? "All categories"
      : ITEM_CATEGORIES.find((label) => normalizeCategory(label) === normalizeCategory(selectedCategory)) || selectedCategory;

  return (
    <section id="items-for-sale" className="landing-section-pad scroll-mt-20 bg-[#f4f2ee] lg:scroll-mt-32">
      <div className="landing-container reveal-on-scroll">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-gold uqhd:text-base">Available Items for Sale</p>
        <h2 className="font-display mt-2 text-3xl font-bold text-brand-green md:text-4xl lg:text-5xl uqhd:text-6xl uhd:text-7xl">
          Fresh Finds from <span className="text-brand-gold">Our Branches</span>
        </h2>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition-all ${selectedCategory === "all" ? "border-brand-gold bg-brand-gold text-brand-green" : "border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5"}`}
            >
              All
            </button>
            {ITEM_CATEGORIES.map((category) => {
              const count = categories.find((entry) => entry.label === category)?.count ?? 0;
              if (count === 0) {
                return null;
              }

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition-all ${normalizeCategory(selectedCategory) === normalizeCategory(category) ? "border-brand-gold bg-brand-gold text-brand-green" : "border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5"}`}
                >
                  {category} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-brand-green/60">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-gold" />
            <span>{filteredItems.length} items found</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSlide((previous) => (previous - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1))}
              disabled={slides.length <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green/20 bg-white text-brand-green transition hover:bg-brand-green hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous items"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((previous) => (previous + 1) % Math.max(slides.length, 1))}
              disabled={slides.length <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green/20 bg-white text-brand-green transition hover:bg-brand-green hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next items"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-6 min-h-[760px] rounded-[2rem] border border-brand-green/20 bg-brand-green/5 p-4 md:p-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <SaleSkeletonCard key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-brand-green/20 bg-brand-green/5 px-6 py-16 text-center">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-brand-green/80">Unable to load sale items</p>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-green/70" >{error}</p>
            </div>
          ) : hasItems ? (
            <div key={`${selectedCategory}-${currentSlide}`} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-brand-green/10 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.16)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-green/10 via-white to-pawn-gold/10">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-brand-green/50">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-white shadow-lg">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-8 w-8">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.22em]">Photo not available</p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-brand-green/80 via-brand-green/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-gold px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-green shadow-lg">
                        {item.category}
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                        {item.itemId}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold/90">{item.branch}</p>
                      <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight">{item.itemName}</h3>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-green/35">Price</p>
                        <p className="mt-1 text-2xl font-black text-brand-green">{formatPeso(item.price)}</p>
                      </div>
                      <div className="rounded-2xl bg-brand-green/5 px-3 py-2 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green/35">Listed</p>
                        <p className="mt-1 text-xs font-bold text-brand-green/75">{item.availableDate || "Recently"}</p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-2xl bg-brand-green/5 p-3">
                      <InfoRow label="Branch" value={item.branch} />
                      <InfoRow label="Location" value={item.branchLocation || "Address not available"} />
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-brand-green/60">
                      <span>Ready for purchase</span>
                      <span className="rounded-full bg-brand-green px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        Available
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-brand-green/20 bg-brand-green/5 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-white shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-8 w-8">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.28em] text-brand-green/80">No matching items</p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-green/70">Try another category filter to see other sale items across branches.</p>
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-brand-gold" : "w-2 bg-brand-green/25 hover:bg-brand-green/40"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
