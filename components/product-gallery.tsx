"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useDict } from "@/components/i18n-provider";

/**
 * Product image carousel: swipe/scroll through all images (scroll-snap),
 * arrow buttons on hover, and a thumbnail strip for direct jumps.
 * Falls back to the emoji tile when the product has no images.
 */
export function ProductGallery({
  images,
  alt,
  emoji,
  badge,
}: {
  images: string[];
  alt: string;
  emoji: string;
  badge?: string | null;
}) {
  const dict = useDict();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const multi = images.length > 1;

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div>
      <div className="group grid-bg relative h-[420px] overflow-hidden rounded-2xl border border-line">
        {badge && (
          <span className="eyebrow absolute left-4 top-4 z-10 rounded bg-orange px-2 py-1 text-white">
            {badge}
          </span>
        )}

        {images.length === 0 ? (
          <div className="grid h-full place-items-center">
            <span className="text-[10rem] leading-none">{emoji}</span>
          </div>
        ) : (
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
          >
            {images.map((src, i) => (
              <div key={src} className="relative h-full w-full flex-none snap-center">
                <Image
                  src={src}
                  alt={images.length > 1 ? `${alt} — ${i + 1}/${images.length}` : alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  className="object-contain p-6"
                />
              </div>
            ))}
          </div>
        )}

        {multi && (
          <>
            <button
              type="button"
              aria-label={dict.product.prevImage}
              onClick={() => scrollToIndex(index - 1)}
              disabled={index === 0}
              className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-ink opacity-0 shadow-sm transition-opacity hover:border-ink focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 group-hover:opacity-100 group-hover:disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              aria-label={dict.product.nextImage}
              onClick={() => scrollToIndex(index + 1)}
              disabled={index === images.length - 1}
              className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-ink opacity-0 shadow-sm transition-opacity hover:border-ink focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 group-hover:opacity-100 group-hover:disabled:opacity-30"
            >
              →
            </button>
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-soft shadow-sm">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {multi && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`${alt} ${i + 1}`}
              aria-current={index === i}
              onClick={() => scrollToIndex(i)}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-lg border bg-white transition-colors ${
                index === i ? "border-orange" : "border-line hover:border-ink"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
