"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

let widgetsPromise: Promise<void> | null = null;

function loadTwitterWidgets(): Promise<void> {
  if (window.twttr) return Promise.resolve();
  if (widgetsPromise) return widgetsPromise;
  widgetsPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return widgetsPromise;
}

/**
 * Incrusta un tuit con el embed oficial de X: blockquote + su propio
 * widgets.js. No es scraping (no leemos ni copiamos su base de datos): es el
 * mismo mecanismo que usa cualquier sitio de noticias para insertar un tuit,
 * servido y renderizado por X.
 */
export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadTwitterWidgets().then(() => {
      if (!cancelled && ref.current) window.twttr?.widgets.load(ref.current);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div ref={ref} className="mt-3 max-w-full overflow-hidden [&_iframe]:max-w-full">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url}>Ver publicación en X</a>
      </blockquote>
    </div>
  );
}
