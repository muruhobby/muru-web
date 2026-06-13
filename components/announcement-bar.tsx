const ITEMS = [
  "BLOKEES SERIES 04 — NOW IN STOCK",
  "FREE SHIPPING ABOVE RP 300K",
  "100% AUTHENTIC",
  "BISA COD",
  "SHIPPED NATIONWIDE",
];

export function AnnouncementBar() {
  const line = [...ITEMS, ...ITEMS];
  return (
    <div className="bg-ink text-white overflow-hidden">
      <div className="flex w-max animate-marquee">
        {line.map((item, i) => (
          <span
            key={i}
            className="eyebrow flex items-center gap-3 px-6 py-2.5 text-white/80"
          >
            {item}
            <span className="text-orange">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
