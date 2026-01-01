import { useEffect } from "react";
import {
  ResponsivePicture,
  ManifestItem,
} from "@/components/ResponsivePicture";

type Props = {
  title: string;
  items: ManifestItem[];
  onClose: () => void;
};

export default function ProjectGalleryModal({ title, items, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose} // closes on any click that bubbles up
    >
      <div className="mx-auto max-w-6xl h-full overflow-y-auto px-4 py-16">
        {/* Header (clicking here will close too, since it's outside images) */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">{title}</h2>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close gallery"
            className="rounded-full bg-black/60 px-4 py-2 text-white hover:bg-black transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Images (ONLY area that should NOT close when clicked) */}
        <div
          className="grid gap-6 grid-cols-1 md:grid-cols-2"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <div key={item.id} className="contents">
              <ResponsivePicture
                item={item}
                eager={idx < 2}
                className="w-full h-auto rounded-xl object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
