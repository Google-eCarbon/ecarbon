import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Guidelines from "./pages/Guidelines";
import Stats from "./pages/Stats";
import CategoryStats from "./pages/Categorystats";
import Home from "./pages/Home";
import AuthCallback from "./pages/auth/AuthCallback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes> 
            <Route path="/" element={<Home />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/category-stats" element={<CategoryStats />} />
            <Route path="/carbon-analysis" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
