import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuActive) {
        setMenuActive(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuActive]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/svg/greenee_logo_big_w.svg" alt="Greenee Logo" className="w-8 h-8" />
          <span className="text-white text-xl font-semibold">Greenee</span>
        </Link>
        
        <div 
          className={`lg:hidden cursor-pointer ${menuActive ? 'active' : ''}`} 
          onClick={toggleMenu}
        >
          <div className="space-y-2">
            <span className="block w-8 h-0.5 bg-white transform transition duration-300"></span>
            <span className="block w-8 h-0.5 bg-white transform transition duration-300"></span>
            <span className="block w-8 h-0.5 bg-white transform transition duration-300"></span>
          </div>
        </div>
        
        <nav className={`${menuActive ? 'flex' : 'hidden'} lg:flex absolute lg:relative top-full left-0 right-0 bg-black/80 lg:bg-transparent flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-8 py-4 lg:py-0`}>
          <Link 
            to="/measure" 
            onClick={() => setMenuActive(false)}
            className="text-white hover:text-green-400 transition-colors"
          >
            측정하기
          </Link>
          <Link 
            to="/ranking" 
            onClick={() => setMenuActive(false)}
            className="text-white hover:text-green-400 transition-colors"
          >
            순위보기
          </Link>
          <Link 
            to="/about" 
            onClick={() => setMenuActive(false)}
            className="text-white hover:text-green-400 transition-colors"
          >
            About us
          </Link>
          <Link 
            to="/user" 
            onClick={() => setMenuActive(false)}
            className="text-white hover:text-green-400 transition-colors"
          >
            User Page
          </Link>
        </nav>
        
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="ghost" className="text-white hover:text-green-400">
            Sign in
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
