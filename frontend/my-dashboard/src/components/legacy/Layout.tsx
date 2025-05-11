import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-full">
      <main className="h-full">
        <div className="px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;