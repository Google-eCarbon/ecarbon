import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    const handleAuthCallback = () => {
      try {


        // URL 쿼리 파라미터에서 인증 성공 여부 확인
        const params = new URLSearchParams(location.search);
        const success = params.get('success') === 'true';
        const error = params.get('error');

        if (success) {
          console.log('welcome to my page!');

          // 로딩 상태 해제
          setLoading(false);

          // 홈 페이지로 리디렉션 (1초 후)
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          console.error('error occurred during login:', error);
          
          setLoading(false);
          
          // 홈페이지로 리디렉션 (2초 후)
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        console.error('error occurred during authentication:', error);
        setLoading(false);
        
        // 홈페이지로 리디렉션 (2초 후)
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <h2 className="text-xl font-semibold">processing login...</h2>
        <p className="text-gray-500 mt-2">please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">welcome</h1>
        <p className="text-sm text-gray-500">welcome</p>
      </div>
    </div>
  );
};

export default AuthCallback;
