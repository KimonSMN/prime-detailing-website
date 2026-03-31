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


// Route-split everything else
const AdminBookings = React.lazy(() => import("./pages/AdminBookings"));
const Booking = React.lazy(() => import("./pages/Booking"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const ServicesNew = React.lazy(() => import("./pages/ServicesNew"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

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
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminBookings />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/services" element={<ServicesNew />} />
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
