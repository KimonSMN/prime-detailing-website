import React, { useEffect, useState } from "react";
import { X, Calendar, Sun } from "lucide-react"; // Ensure lucide-react is installed

export default function SummerClosurePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 1.2 second initial delay before triggering the open transition
    const timer = setTimeout(() => {
      setShouldRender(true);
      // Small micro-task delay to allow DOM mounting before changing opacity/scale
      setTimeout(() => setIsOpen(true), 50);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Wait 300ms for the tailwind transition duration to finish before unmounting
    setTimeout(() => setShouldRender(false), 300);
  };

  if (!shouldRender) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
        className={`relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 ease-out ${
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors group"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Summer Banner Image with Text Overlay */}
        <div 
          className="relative h-48 bg-cover bg-center flex items-end justify-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-black/20" />
          <div className="relative z-10 text-center pb-4 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sun className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} /> Summer Notice
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Summer Holidays Schedule
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center text-zinc-300">
          <p className="text-sm leading-relaxed text-zinc-400 mb-6">
            Our team is taking a short break to recharge and prepare for a shiny rest of the year!
          </p>

          {/* Dates Cards */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3.5 bg-zinc-800/50 border border-zinc-800 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-medium text-white text-sm sm:text-base">July Break</span>
              </div>
              <span className="text-amber-400 font-semibold tracking-wide bg-amber-500/5 px-3 py-1 rounded-md border border-amber-500/10 text-sm sm:text-base">
                12/07 – 18/07
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-800/50 border border-zinc-800 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-medium text-white text-sm sm:text-base">August Break</span>
              </div>
              <span className="text-amber-400 font-semibold tracking-wide bg-amber-500/5 px-3 py-1 rounded-md border border-amber-500/10 text-sm sm:text-base">
                28/07 – 10/08
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full py-3 bg-white text-black hover:bg-zinc-200 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}