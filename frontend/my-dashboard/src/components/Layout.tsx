import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-full relative">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-white"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar - 모바일에서는 조건부 렌더링, lg에서는 항상 표시 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out w-72",
        "lg:transform-none lg:opacity-100",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:flex"
      )}>
        <Sidebar />
      </div>
      
      {/* Backdrop - 모바일에서 사이드바가 열렸을 때만 표시 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-72 h-full">
        <main className="h-full">
          <div className="px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;