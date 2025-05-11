import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogOut } from 'lucide-react';

const GOOGLE_LOGIN_URL = '/api/auth/login/google';
const LOGOUT_URL = '/api/auth/logout';
const USER_INFO_URL = '/api/user/me';

interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
}

const Header: React.FC = () => {  
  const [menuActive, setMenuActive] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(USER_INFO_URL, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        setUserInfo(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('사용자 정보 가져오기 실패');
      }

      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  const handleLogout = async () => {
    try {
      await fetch(LOGOUT_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setUserInfo(null);
      window.location.href = '/';
    } catch (error) {
      setUserInfo(null);
      window.location.href = '/';
    }
  };

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

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/svg/greenee_logo_big_w.svg" alt="Greenee Logo" className="w-8 h-8" />
          <span className="text-white text-xl font-semibold">Greenee</span>
        </Link>
        
        <div className="flex items-center gap-4">
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
        
        <div className="hidden lg:flex items-center space-x-6">
          {loading ? (
            <div className="text-white/70 flex items-center gap-2">
              <User className="w-4 h-4" />
              로딩 중...
            </div>
          ) : userInfo ? (
            <div className="flex items-center gap-6">
              <div className="text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                {userInfo.username || '회원'}
              </div>
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-red-400 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="text-white/70 hover:text-green-400 flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
