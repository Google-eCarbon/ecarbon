import React from 'react';

const GOOGLE_LOGIN_URL = '/api/auth/login/google';

const GoogleLoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        backgroundColor: '#fff',
        color: '#444',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <g>
          <path fill="#4285F4" d="M24 9.5c3.54 0 6.17 1.53 7.59 2.82l5.6-5.6C33.62 3.44 29.3 1.5 24 1.5 14.81 1.5 6.97 7.86 3.69 16.12l6.87 5.33C12.38 15.07 17.74 9.5 24 9.5z"/>
          <path fill="#34A853" d="M46.15 24.56c0-1.63-.15-3.21-.42-4.74H24v9h12.44c-.54 2.93-2.18 5.41-4.66 7.09l7.24 5.63C43.59 37.13 46.15 31.32 46.15 24.56z"/>
          <path fill="#FBBC05" d="M10.56 28.09A14.5 14.5 0 0 1 9.5 24c0-1.42.24-2.8.67-4.09l-6.87-5.33A23.94 23.94 0 0 0 0 24c0 3.77.9 7.33 2.5 10.44l8.06-6.35z"/>
          <path fill="#EA4335" d="M24 46.5c6.48 0 11.93-2.14 15.91-5.85l-7.24-5.63c-2.01 1.35-4.59 2.18-8.67 2.18-6.26 0-11.62-5.57-13.44-12.95l-8.06 6.35C6.97 40.14 14.81 46.5 24 46.5z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </g>
      </svg>
      Google로 로그인
    </button>
  );
};

export default GoogleLoginButton;
