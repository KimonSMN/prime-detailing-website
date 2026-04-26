// src/App.tsx
import React, { Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import TopNavbar from "./components/TopNavbar";
import { Hreflang } from "./components/Hreflang";

// Home stays eager
import Index from "./pages/Index";
import CoolServices from "./pages/CoolServices";

// Route-split everything else
const AdminBookings = React.lazy(() => import("./pages/AdminBookings"));
const Booking = React.lazy(() => import("./pages/Booking"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const ServicesNew = React.lazy(() => import("./pages/ServicesNew"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Services = React.lazy(() => import("./pages/Services"));
const PaintCorrection = React.lazy(() => import("./pages/information/PaintCorrection"));
const PaintCorrectionBooking = React.lazy(() => import("./pages/PaintCorrectionBooking"));
const FullDetail = React.lazy(() => import("./pages/information/FullDetail"));
const Maintenance = React.lazy(() => import("./pages/information/Maintenance"));
const Ultimate = React.lazy(() => import("./pages/information/Ultimate"));

// Chatbot split

const queryClient = new QueryClient();

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
              <Route path="/" element={<Index/>} />

              <Route path="/admin" element={<AdminBookings />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/gallery" element={<Gallery />} />
              {/* <Route path="/services" element={<ServicesNew />} /> */}
              <Route path="/services" element={<Services />} />
              {/* <Route path="/services-cool" element={<CoolServices />} /> */}

              <Route path="/paint-correction-booking" element={<PaintCorrectionBooking />} />


              <Route path="/paint-correction" element={<PaintCorrection />} />
              <Route path="/ultimate-detail" element={<Ultimate />} />
              <Route path="/full-detail" element={<FullDetail />} />
              <Route path="/maintenance-wash" element={<Maintenance />} />

              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>
          <SpeedInsights />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
