import { useEffect, useState, useCallback } from 'react';

interface Slide {
  image: string;
  title: string;
  href: string;
}

const slides: Slide[] = [
  {
    image: 'https://www.artstroismolian.com/projects/55/2.jpg',
    title: 'Хотел за винарска изба и дестилерия в с. Старосел',
    href: '/proekti#hotel-za-vinarska-izba-i-destileriya-proizvodstveni-deynosti-i-obshtestveno-osbl',
  },
  {
    image: 'https://www.artstroismolian.com/projects/7.jpg',
    title: 'Бутиков хотел „Ива и Елена", к.к. Пампорово',
    href: '/proekti#butikov-hotel-iva-i-elena-k-k-pamporovo',
  },
  {
    image: 'https://www.artstroismolian.com/projects/5.jpg',
    title: 'Реконструкция Сектор А, стадион „Георги Аспарухов"',
    href: '/proekti#rekonstruktsiya-sektor-a-stadion-georgi-asparuhov',
  },
  {
    image: 'https://www.artstroismolian.com/projects/41.jpg',
    title: 'Дом на културата, гр. Рудозем',
    href: '/proekti#dom-na-kulturata-gr-rudozem',
  },
  {
    image: 'https://www.artstroismolian.com/projects/3.jpg',
    title: 'Жилищна сграда в София, бул. „П.К.Яворов" №44',
    href: '/proekti#zhilishtna-sgrada-v-sofiya-bul-p-k-yavorov-44',
  },
];

const AUTOPLAY_MS = 8500;
// Bechtel-style layered peek: one card centred, neighbours barely visible
// behind. Offsets are modest, no rotation — clean and architectural.
const PEEK_OFFSET = 7;        // % translateX for prev/next slides
const HIDDEN_OFFSET = 11;     // % for slides waiting off-stage
const PEEK_SCALE = 0.94;

export default function HeroNewsCard() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Modular index helper — makes prev/next safe at the boundaries
  const goTo = useCallback((i: number) => {
    const n = slides.length;
    setActive(((i % n) + n) % n);
  }, []);
  const prev = useCallback(() => setActive((a) => (a - 1 + slides.length) % slides.length), []);
  const next = useCallback(() => setActive((a) => (a + 1) % slides.length), []);

  // Infinite autoplay loop — wraps from last back to first.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion]);

  // Position of slide `i` relative to the active one, normalised to
  // [-half, +half] so wrap-around is taken as the shortest path.
  const positionOf = (i: number) => {
    const n = slides.length;
    const half = Math.floor(n / 2);
    let diff = i - active;
    if (diff > half) diff -= n;
    if (diff < -half) diff += n;
    return diff;
  };

  // Visual styling per relative position. Active is centred; ±1 sit slightly
  // behind, scaled and faded so only their edges read against the hero bg.
  const styleFor = (pos: number) => {
    if (pos === 0) {
      return { opacity: 1, transform: 'translateX(0) scale(1)', zIndex: 30 };
    }
    if (pos === -1) {
      return {
        opacity: 0.7,
        transform: `translateX(-${PEEK_OFFSET}%) scale(${PEEK_SCALE})`,
        zIndex: 20,
      };
    }
    if (pos === 1) {
      return {
        opacity: 0.7,
        transform: `translateX(${PEEK_OFFSET}%) scale(${PEEK_SCALE})`,
        zIndex: 20,
      };
    }
    if (pos < -1) {
      return { opacity: 0, transform: `translateX(-${HIDDEN_OFFSET}%) scale(0.88)`, zIndex: 10 };
    }
    return { opacity: 0, transform: `translateX(${HIDDEN_OFFSET}%) scale(0.88)`, zIndex: 10 };
  };

  return (
    <div
      className="relative w-full max-w-[280px] sm:max-w-[290px] lg:max-w-[300px] xl:max-w-[320px] mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Prev arrow — outside card, on hero background */}
      <button
        type="button"
        onClick={prev}
        aria-label="Предишен слайд"
        className="hidden lg:grid absolute left-[-40px] top-[44%] -translate-y-1/2 z-40 h-10 w-10 place-items-center text-white/80 hover:text-white transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Cards stage — fixed height so absolutely-positioned cards sit cleanly */}
      <div className="relative h-[300px] sm:h-[320px] lg:h-[340px]">
        {slides.map((s, i) => {
          const pos = positionOf(i);
          const style = styleFor(pos);
          const isActive = pos === 0;
          return (
            <a
              key={i}
              href={s.href}
              tabIndex={isActive ? 0 : -1}
              aria-hidden={!isActive}
              className="group absolute inset-0 rounded-2xl bg-white text-ink-950 shadow-2xl overflow-hidden transition-all duration-[1300ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] will-change-transform"
              style={style}
            >
              <div className="p-2.5 pb-0">
                <div className="overflow-hidden rounded-lg bg-ink-100">
                  <img
                    src={s.image}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-[140px] sm:h-[150px] lg:h-[160px] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-3 px-1 text-[12.5px] leading-[1.4] text-ink-950 line-clamp-3 font-medium">
                  {s.title}
                </h3>
              </div>
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-3 px-3.5 pb-3.5">
                <div className="flex items-center gap-1">
                  {slides.map((_, j) => (
                    <span
                      key={j}
                      className={`h-1 rounded-full transition-all duration-300 ease-out-expo ${
                        active === j ? 'w-5 bg-brand' : 'w-1.5 bg-ink-200'
                      }`}
                    />
                  ))}
                </div>
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 10.5L10.5 3.5M10.5 3.5H5M10.5 3.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Next arrow — outside card */}
      <button
        type="button"
        onClick={next}
        aria-label="Следващ слайд"
        className="hidden lg:grid absolute right-[-40px] top-[44%] -translate-y-1/2 z-40 h-10 w-10 place-items-center text-white/80 hover:text-white transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Mobile / tablet dots */}
      <div className="lg:hidden mt-6 flex justify-center items-center gap-2.5" role="tablist" aria-label="Слайдове">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-label={`Слайд ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ease-out-expo ${
              active === i ? 'h-2 w-7 bg-brand' : 'h-2 w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
