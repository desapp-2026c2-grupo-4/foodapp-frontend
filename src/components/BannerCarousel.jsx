import { useEffect, useState } from "react";

export default function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIdx(0);
    setImgError(false);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % banners.length);
      setImgError(false);
    }, 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[idx % banners.length];

  const go = (dir) => {
    setImgError(false);
    setIdx((i) => (i + dir + banners.length) % banners.length);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-border shadow-sm">
      <div className="h-44 md:h-72 bg-background flex items-center justify-center overflow-hidden">
        {banner.imagen && !imgError ? (
          <img
            key={banner.id_banner}
            src={banner.imagen}
            alt={banner.titulo}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-text-soft text-sm">Sin imagen</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
        <p className="font-extrabold text-white text-lg md:text-2xl leading-tight">{banner.titulo}</p>
        {banner.descripcion && <p className="text-white/85 text-xs md:text-sm line-clamp-1">{banner.descripcion}</p>}
      </div>
      {banners.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            ›
          </button>
          <div className="absolute top-2 right-3 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id_banner}
                onClick={() => { setImgError(false); setIdx(i); }}
                aria-label={`Banner ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full ${i === idx % banners.length ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
