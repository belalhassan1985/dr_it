"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StoreBanner } from "@/lib/banners";

type HeroSliderProps = {
  banners: StoreBanner[];
  fallback: {
    title: string;
    subtitle: string;
    description: string;
  };
};

function imgVal(s: string | null | undefined): string {
  if (!s) return "";
  const v = String(s).trim();
  return (v && v !== "null" && v !== "undefined") ? v : "";
}

function bestUrl(b: StoreBanner): string {
  return imgVal(b.desktopImageUrl) || imgVal(b.imageUrl) || imgVal(b.mobileImageUrl);
}

export function HeroSlider({ banners, fallback }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const validBanners = banners.filter(b => bestUrl(b) !== "");
  const len = validBanners.length;
  const banner = validBanners[current];
  const src = banner ? bestUrl(banner) : "";

  const goTo = useCallback((index: number) => {
    setCurrent(((index % len) + len) % len);
    setImgFailed(false);
  }, [len]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (len <= 1 || isPaused) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [len, isPaused, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (len === 0) {
    return (
      <section className="hero-slider">
        <div className="hero-copy">
          <p>{fallback.subtitle}</p>
          <h1>{fallback.title}</h1>
          <span>{fallback.description}</span>
        </div>
        <div className="hero-products" aria-hidden="true" />
      </section>
    );
  }

  return (
    <section
      className="hero-slider hero-slider--carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      <div className="hero-slider__slide">
        {!src || imgFailed ? (
          <div className="hero-slider__error">تعذر تحميل صورة البنر</div>
        ) : (
          <img
            src={src}
            alt={banner?.title || ""}
            className="hero-slider__img"
            onError={() => setImgFailed(true)}
            fetchPriority={current === 0 ? "high" : undefined}
          />
        )}
        <div className="hero-slider__overlay">
          <div className="hero-slider__content">
            <p className="hero-slider__subtitle">{banner?.subtitle || fallback.subtitle}</p>
            <h2 className="hero-slider__title">{banner?.title || fallback.title}</h2>
            {banner?.linkUrl ? (
              <Link href={banner.linkUrl} className="hero-cta">{banner.buttonText || "إضغط هنا"}</Link>
            ) : null}
          </div>
        </div>
      </div>

      {len > 1 ? (
        <>
          <button className="hero-slider__arrow hero-slider__arrow--prev" onClick={prev} aria-label="السابق">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="hero-slider__arrow hero-slider__arrow--next" onClick={next} aria-label="التالي">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div className="hero-slider__dots">
            {validBanners.map((_, i) => (
              <button
                key={i}
                className={`hero-slider__dot${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`الانتقال إلى الشريحة ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
