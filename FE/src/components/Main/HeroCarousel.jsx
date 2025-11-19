import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HeroCarousel({ slides, interval = 6000 }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(id);
  }, [slides, interval]);

  if (!slides || slides.length === 0) return null;
  const current = slides[index];

  return (
    <section className="mb-6 rounded-3xl bg-linear-to-r from-[#7B61FF] to-[#C17DFF] p-5 text-white shadow-md md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="mb-1 text-xs font-semibold tracking-[0.15em] text-violet-100 uppercase">
            {current.kicker}
          </p>
          <h2 className="mb-2 text-2xl leading-snug font-extrabold md:text-3xl">{current.title}</h2>
          <p className="mb-4 text-sm text-violet-100 md:text-base">{current.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {current.primaryAction && (
              <button
                type="button"
                onClick={() => current.primaryAction.onClick(navigate)}
                className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
              >
                {current.primaryAction.label}
                <ArrowRight size={14} className="ml-1" />
              </button>
            )}
            {current.secondaryAction && (
              <button
                type="button"
                onClick={() => current.secondaryAction.onClick(navigate)}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur transition hover:bg-white/20"
              >
                {current.secondaryAction.label}
                <ArrowRight size={14} className="ml-1" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end md:w-48">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 md:h-28 md:w-28">
            {current.icon}
          </div>
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="mt-4 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
