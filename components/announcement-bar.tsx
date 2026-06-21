import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AnnouncementBar({ dict }: { dict: Dictionary }) {
  const items = dict.announcement.items;
  const line = [...items, ...items];
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
