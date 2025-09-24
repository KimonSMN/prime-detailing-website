import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Hreflang } from "./components/Hreflang";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminBookings from "./pages/AdminBookings";
import Services from "./pages/Services";
import TopNavbar from "./components/TopNavbar";
import Booking from "./pages/Booking";
import Gallery from "./pages/Gallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Hreflang />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopNavbar />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminBookings />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/gallery" element={<Gallery />} />

          {/* Services */}
          <Route path="/services" element={<Services />} />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
