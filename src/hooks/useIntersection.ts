// src/hooks/useIntersection.ts
import { useEffect, useRef, useState } from "react";
export function useIntersection<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "200px"
) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, set] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => set(e.isIntersecting), {
      root: null,
      rootMargin,
      threshold: 0.01,
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, isIntersecting };
}
