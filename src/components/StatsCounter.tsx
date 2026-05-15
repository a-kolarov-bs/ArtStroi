import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix?: string;
  label: string;
  caption?: string;
}

const stats: Stat[] = [
  { value: 55, suffix: '+', label: 'Реализирани проекта', caption: 'из цяла България' },
  { value: 32, suffix: ' г.', label: 'Опит на пазара', caption: 'основани 1992' },
  { value: 14, suffix: '', label: 'Общини партньори', caption: 'разчитали на нас' },
];

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function StatsCounter() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-cream-50 pt-5 md:pt-12 lg:pt-14 pb-2 md:pb-6 lg:pb-6"
      aria-label="Числа за компанията"
    >
      {/* Architectural sheet — back layer */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bp-sheet bp-sheet-c" />
      <div className="container-page relative !px-3 md:!px-10 lg:!px-12">
        <div className="grid grid-cols-3 gap-px bg-ink-200">
          {stats.map((s, i) => (
            <StatCell key={i} stat={s} active={active} delay={i * 180} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCell({ stat, active, delay }: { stat: Stat; active: boolean; delay: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setN(stat.value);
      return;
    }
    const duration = 2800;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, (now - start) / duration);
      const v = Math.min(1, t);
      setN(Math.round(stat.value * easeOutExpo(v)));
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, stat.value, delay]);

  return (
    <div className="bg-cream-50 px-3 md:px-5 lg:px-6 py-4 md:py-8 lg:py-10 group flex flex-col items-center text-center">
      <div
        className="font-display tabular-nums tracking-[-0.02em] leading-none text-ink-950"
        style={{ fontSize: 'clamp(2rem, 1.2rem + 3.5vw, 4.25rem)' }}
      >
        {n}
        <span className="text-brand">{stat.suffix}</span>
      </div>
      <div className="mt-3 md:mt-4 h-px w-10 md:w-12 bg-brand transition-[width] duration-700 ease-out group-hover:w-24" />
      <p className="mt-3 md:mt-4 text-[13px] md:text-sm lg:text-base font-medium text-ink-900 leading-tight">{stat.label}</p>
      {stat.caption && (
        <p className="mt-1 text-[8.5px] md:text-[11px] lg:text-xs text-ink-600 uppercase tracking-eyebrow leading-tight">{stat.caption}</p>
      )}
    </div>
  );
}
