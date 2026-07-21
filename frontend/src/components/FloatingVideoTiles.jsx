import React, { useEffect, useRef, useState } from 'react';

// Scattered tile layout around (behind) the central card. `depth` = mouse-parallax strength (px).
const TILES = [
  { top: '7%',  left: '5%',   w: 210, depth: 26, dur: 9,  delay: 0,   mobile: true },
  { top: '12%', left: '70%',  w: 240, depth: 34, dur: 11, delay: 0.6, mobile: true },
  { top: '4%',  left: '39%',  w: 170, depth: 16, dur: 8,  delay: 1.2, mobile: false },
  { top: '33%', left: '81%',  w: 160, depth: 38, dur: 10, delay: 0.3, mobile: false },
  { top: '36%', left: '1%',   w: 165, depth: 30, dur: 12, delay: 0.9, mobile: false },
  { top: '24%', left: '21%',  w: 180, depth: 18, dur: 9.5,delay: 1.6, mobile: false },
  { top: '62%', left: '4%',   w: 195, depth: 22, dur: 10.5,delay: 0.2, mobile: true },
  { top: '67%', left: '73%',  w: 220, depth: 28, dur: 8.5, delay: 1.1, mobile: true },
  { top: '79%', left: '43%',  w: 200, depth: 20, dur: 11.5,delay: 0.5, mobile: false },
];

function pickSrc(v) {
  const files = (v.video_files || []).filter((f) => f.file_type === 'video/mp4' && f.link);
  if (!files.length) return null;
  const sd = files.filter((f) => (f.width || 0) >= 400 && (f.width || 0) <= 960);
  const pool = (sd.length ? sd : files).sort((a, b) => (a.width || 0) - (b.width || 0));
  return pool[Math.floor(pool.length / 2)]?.link || pool[0].link;
}

const FloatingVideoTiles = () => {
  const containerRef = useRef(null);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const QUERIES = [
      'server room',
      'data center',
      'network cables',
      'programming code',
      'cyber security',
      'circuit board',
    ];
    (async () => {
      try {
        const results = await Promise.all(
          QUERIES.map((q) =>
            fetch(
              `${process.env.REACT_APP_BACKEND_URL}/api/pexels/videos?query=${encodeURIComponent(
                q
              )}&per_page=6&orientation=landscape`
            )
              .then((r) => r.json())
              .catch(() => ({ videos: [] }))
          )
        );
        const seen = new Set();
        const vids = [];
        results.forEach((data) => {
          (data.videos || []).forEach((v) => {
            const src = pickSrc(v);
            if (src && !seen.has(src)) {
              seen.add(src);
              vids.push({ src, poster: v.image || '' });
            }
          });
        });
        // shuffle for a fresh mix each visit
        for (let i = vids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [vids[i], vids[j]] = [vids[j], vids[i]];
        }
        if (!cancelled) setSources(vids.slice(0, TILES.length));
      } catch (e) {
        // fail silently — homepage still works without tiles
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', nx.toFixed(3));
        el.style.setProperty('--my', ny.toFixed(3));
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [sources.length]);

  if (!sources.length) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] overflow-hidden pointer-events-none"
      style={{ '--mx': 0, '--my': 0 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes fvtFloat {
          0%   { transform: translateY(0px) rotate(0deg); }
          50%  { transform: translateY(-16px) rotate(1.3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fvt-inner { animation: none !important; }
        }
      `}</style>

      {TILES.map((t, i) => {
        const item = sources[i % sources.length];
        return (
          <div
            key={i}
            className={t.mobile ? 'absolute' : 'absolute hidden md:block'}
            style={{
              top: t.top,
              left: t.left,
              width: `${t.w}px`,
              maxWidth: '42vw',
              transform: `translate3d(calc(var(--mx, 0) * ${t.depth}px), calc(var(--my, 0) * ${t.depth}px), 0)`,
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            }}
          >
            <div
              className="fvt-inner rounded-2xl overflow-hidden"
              style={{
                animation: `fvtFloat ${t.dur}s ease-in-out ${t.delay}s infinite`,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)',
                opacity: 0.72,
              }}
            >
              <div className="relative aspect-video bg-[#11151f]">
                <video
                  src={item.src}
                  poster={item.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(1.45) saturate(1.15) contrast(1.02)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(120% 120% at 50% 50%, rgba(11,15,25,0) 65%, rgba(11,15,25,0.22) 100%)' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingVideoTiles;
