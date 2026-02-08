// src/App.tsx
import React, { Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import TopNavbar from "./components/TopNavbar";
import { Hreflang } from "./components/Hreflang";

// Home stays eager
import Index from "./pages/Index";

// Route-split everything else
const AdminBookings = React.lazy(() => import("./pages/AdminBookings"));
const Booking = React.lazy(() => import("./pages/Booking"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const ServicesNew = React.lazy(() => import("./pages/ServicesNew"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Chatbot split
const FloatingChatbot = React.lazy(() => import("./components/FloatingChatbot"));

const queryClient = new QueryClient();

function MountAfterInteraction({
  children,
  timeoutMs = 3000,
}: {
  children: React.ReactNode;
  timeoutMs?: number;
}) {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const enable = () => setOn(true);

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ];

    events.forEach((e) =>
      window.addEventListener(e, enable, { once: true, passive: true }),
    );

    const t = window.setTimeout(enable, timeoutMs);

    return () => {
      window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, enable));
    };
  }, [timeoutMs]);

  return on ? <>{children}</> : null;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Hreflang />
          <TopNavbar />

          {/* Keep route suspense minimal */}
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminBookings />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/services" element={<ServicesNew />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Chatbot loads only after interaction/timeout
          <MountAfterInteraction timeoutMs={4000}>
            <Suspense fallback={null}>
              <FloatingChatbot />
            </Suspense>
          </MountAfterInteraction> */}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
