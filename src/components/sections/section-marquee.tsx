'use client';

type Props = { items: ReadonlyArray<string> };

export function SectionMarquee({ items }: Props) {
  const doubled = [...items, ...items];
  return (
    <section
      aria-hidden
      className="relative border-y border-border-soft py-7"
    >
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="display flex items-center gap-12 text-[44px] leading-none text-ink md:text-[72px]"
            >
              {item}
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
