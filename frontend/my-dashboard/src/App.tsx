import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/header";

import Index from "./pages/Index";
import Guidelines from "./pages/Guidelines";
import Stats from "./pages/Stats";
import CategoryStats from "./pages/Categorystats";
import Home from "./pages/Home";

import GlobeHome from "./pages/GlobeHome";
import About from "./pages/About";
import Ranking from "./pages/Ranking";
import UserPage from "./pages/UserPage";
import Measure from "./pages/Measure";

import AuthCallback from "./pages/auth/AuthCallback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Header />
          <main className="flex-1">
            <Routes> 
              <Route path="/" element={<GlobeHome />} />
              <Route path="/about" element={<About />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/measure" element={<Measure />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
