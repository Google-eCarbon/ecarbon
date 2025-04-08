import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-full relative">
      {/* Sidebar - lg 크기 이상에서는 고정, 그 이하에서는 absolute로 위치 */}
      <div className="hidden lg:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      
      {/* Main Content - Sidebar 너비만큼 여백 추가 */}
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