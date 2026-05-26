import { useEffect, useMemo, useState } from "react";

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);


  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;

    const onChange = () => setReduced(!!mq.matches);
    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    // Safari
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
};

export default function RadheAssistant() {

  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    // Pop once on mount
    if (reducedMotion) {
      setPopped(true);
      return;
    }

    const t = window.setTimeout(() => setPopped(true), 200);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  const ariaLabel = useMemo(() => "Radhe, your 2D animated assistant", []);

  if (!visible) return null;

  return (
    <div
      className={`fixed z-[45] bottom-5 right-5 sm:bottom-7 sm:right-7 select-none radhe-widget ${
        popped ? "radhe-widget--popped" : "radhe-widget--hidden"
      }`}
      aria-label={ariaLabel}
      role="button"
      tabIndex={-1}
    >
      <div className="radhe-popover" aria-hidden>
        <div className="radhe-title">Radhe</div>
        <div className="radhe-subtitle">Hi! ✨</div>
      </div>

      <button
        type="button"
        className="radhe-btn"
        aria-label="Hide Radhe"
        onClick={() => setVisible(false)}
      >
        <div className="radhe-spark" aria-hidden />

        <svg
          className="radhe-girl"
          width="88"
          height="88"
          viewBox="0 0 88 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {/* Shadow */}
          <ellipse cx="44" cy="74" rx="20" ry="7" fill="#000" fillOpacity="0.12" />

          {/* Hair (head) */}
          <path
            d="M22 36C22 20 34 12 44 12C54 12 66 20 66 36C66 45 62 55 56 59C51 62 37 62 32 59C26 55 22 45 22 36Z"
            fill="#2B1B14"
          />

          {/* Face */}
          <path
            d="M30 34C30 24 36 18 44 18C52 18 58 24 58 34C58 44 53 55 44 55C35 55 30 44 30 34Z"
            fill="#FFD7B8"
          />

          {/* Eyes */}
          <g>
            <path d="M35 38C37 36 40 36 42 38" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 38C48 36 51 36 53 38" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Blink eyelids (animated) */}
          <g className="radhe-blink">
            <path
              d="M35 38C37 39 40 39 42 38"
              stroke="#1A1A1A"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M46 38C48 39 51 39 53 38"
              stroke="#1A1A1A"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Cheeks */}
          <circle cx="37" cy="44" r="3" fill="#FF7A90" fillOpacity="0.22" />
          <circle cx="51" cy="44" r="3" fill="#FF7A90" fillOpacity="0.22" />

          {/* Nose */}
          <path d="M44 40C43 42 43 43 44 44" stroke="#B97B5B" strokeWidth="2" strokeLinecap="round" />

          {/* Mouth */}
          <path
            d="M40 47C41.5 49 42.5 50 44 50C45.5 50 46.5 49 48 47"
            stroke="#7A3B2E"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Neck */}
          <path d="M40 55C41 60 47 60 48 55" fill="#FFD7B8" />

          {/* Dress */}
          <path
            d="M26 77C28 64 34 58 44 58C54 58 60 64 62 77H26Z"
            fill="#6D7CFF"
          />

          {/* Belt */}
          <path
            d="M34 67C36 62 41 60 44 60C47 60 52 62 54 67C54 70 52 72 44 72C36 72 34 70 34 67Z"
            fill="#2F2E3D"
            fillOpacity="0.35"
          />

          {/* Arms */}
          <path d="M26 70C30 64 33 62 36 60" stroke="#FFD7B8" strokeWidth="5" strokeLinecap="round" />
          <path d="M62 70C58 64 55 62 52 60" stroke="#FFD7B8" strokeWidth="5" strokeLinecap="round" />

          {/* Head accessory */}
          <path
            d="M34 20C37 16 41 14 44 14C47 14 51 16 54 20"
            stroke="#FFB703"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

