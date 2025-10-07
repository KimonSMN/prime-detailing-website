import {
  ResponsivePicture,
  ManifestItem,
} from "@/components/ResponsivePicture";
import React, { useEffect, useState } from "react";

export default function GalleryPage() {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [visible, setVisible] = useState(8);

  useEffect(() => {
    fetch("/gallery-manifest.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const shown = items.slice(0, visible);

  return (
    <section className="px-4 py-14 md:py-20 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
          {shown.map((item, idx) => (
            <figure
              key={item.id}
              className="relative overflow-hidden rounded-2xl border bg-card"
            >
              <div className="relative w-full">
                <ResponsivePicture
                  item={item}
                  eager={idx < 2}
                  className="h-auto w-full object-cover"
                />
              </div>
            </figure>
          ))}

          {shown.length < items.length && (
            <div className="text-center mt-8 col-span-full">
              <button
                onClick={() => setVisible((v) => v + 8)}
                className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3 text-sm md:text-base font-semibold hover:bg-card/80"
              >
                Show more photos
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
