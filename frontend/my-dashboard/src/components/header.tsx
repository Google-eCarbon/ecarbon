import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './Header.css';


const GOOGLE_LOGIN_URL = '/api/auth/login/google';
const LOGOUT_URL = '/api/auth/logout';
const USER_INFO_URL = '/api/user/me';

interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  level?: number;
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
        throw new Error('User info fetch failed');
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
    <header>
        <Link to="/" className="logo-container">
          <img src="/svg/greenee_logo_big_w.svg" alt="Greenee Logo" className="w-8 h-8" />
          <span className="company-name">Greenee</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div 
            className={`lg:hidden cursor-pointer ${menuActive ? 'active' : ''}`} 
            onClick={toggleMenu}
          >
            <div className={`menu-toggle ${menuActive ? 'active' : ''}`} onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        
        <nav className={menuActive ? 'active' : ''}>
          <Link to="/measure" onClick={() => setMenuActive(false)}>Measure</Link>
          <Link to="/ranking" onClick={() => setMenuActive(false)}>Rankings</Link>
          <Link to="/about" onClick={() => setMenuActive(false)}>About us</Link>
          <Link to="/user" onClick={() => setMenuActive(false)}>User Page</Link>
        </nav>
        
        <div className="auth-buttons">
          {loading ? (
            <div className="text-white/70 flex items-center gap-2">
              <div className="level-badge">
                <span className="level-number">...</span>
              </div>
              <span className="user-name">Loading...</span>
            </div>
          ) : userInfo ? (
            <div className="user-info">
              <div className="level-badge">
                <span className="level-number">{userInfo.level || 1}</span>
              </div>
              <span className="user-name">{userInfo.username || 'User'}</span>
              <button
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleLogin} className="login-btn">Login</button>
            </>
          )}
        </div>
    </header>
  );
};

export default Header;
