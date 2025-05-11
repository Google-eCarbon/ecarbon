import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 로그인 상태 및 세션 확인
  useEffect(() => {
    fetch('/api/user/me', {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual' // 리디렉션 수동 처리
    })
    .then(response => {
      // 리디렉션 응답 확인
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get('Location');
        console.log('리디렉션 URL:', redirectUrl);
        // 리디렉션 URL이 홈('/')이면 무시 (현재 페이지가 이미 홈)
        if (redirectUrl && redirectUrl !== '/') {
          window.location.href = redirectUrl;
        }
        return null;
      }
      
      if (response.ok) {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json().catch(error => {
            console.error('JSON 파싱 오류:', error);
            return null;
          });
        } else {
          console.warn('JSON이 아닌 응답 수신:', contentType);
          return null;
        }
      }
      
      return null;
    })
    .then(data => {
      if (data) {
        console.log('인증된 사용자:', data);
        setIsAuthenticated(true);
        
        // 인증된 사용자의 경우 이전 분석 결과 확인
        return fetch('/api/carbon-analysis', {
          method: 'HEAD',
          credentials: 'include',
          redirect: 'manual' // 리디렉션 수동 처리
        });
      }
      return null;
    })
    .then(response => {
      if (response) {
        // 리디렉션 응답 확인
        if (response.status >= 300 && response.status < 400) {
          const redirectUrl = response.headers.get('Location');
          // 리디렉션 URL이 홈('/')이면 무시 (현재 페이지가 이미 홈)
          if (redirectUrl && redirectUrl !== '/') {
            console.log('분석 결과 리디렉션:', redirectUrl);
          }
          return;
        }
        
        if (response.ok) {
          // 이전 분석 결과가 있으면 carbon-analysis 페이지로 이동
          navigate('/carbon-analysis');
        }
        // 분석 결과가 없으면 URL 입력 화면 표시 (상태 유지)
      }
    })
    .catch(error => {
      console.error('인증 확인 오류:', error);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 분석 시작 요청
      const res = await fetch(`/api/start-analysis?url=${encodeURIComponent(url)}`, { 
        method: 'POST',
        credentials: 'include', // 세션 쿠키 포함
        redirect: 'manual' // 리디렉션 수동 처리
      });
      
      // 리디렉션 응답 확인
      if (res.status >= 300 && res.status < 400) {
        const redirectUrl = res.headers.get('Location');
        if (redirectUrl) {
          if (redirectUrl.includes('/carbon-analysis')) {
            navigate('/carbon-analysis');
          } else {
            window.location.href = redirectUrl;
          }
        }
        return;
      }
      
      if (!res.ok) {
        throw new Error('분석 시작에 실패했습니다.');
      }
      
      // 분석 페이지로 이동
      navigate('/carbon-analysis');
    } catch (err) {
      console.error('분석 시작 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-10">
        <Card className="max-w-xl w-full shadow-xl border-emerald-400 border-2">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-emerald-600">eCarbon 대시보드에 오신 것을 환영합니다!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mt-2 text-lg text-gray-700">
              분석할 웹사이트의 URL을 입력하세요.<br />
              친환경적인 웹 개발을 위한 인사이트를 얻어보세요.
            </p>
            {isAuthenticated && (
              <div className="mt-4 mb-2 p-2 bg-green-50 text-green-700 rounded">
                로그인 되었습니다. 분석할 URL을 입력해주세요.
              </div>
            )}
            <form className="mt-6 flex gap-2" onSubmit={handleSubmit}>
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2 text-lg"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
              />
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading ? '처리 중...' : '분석하기'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 p-2 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-10 text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} eCarbon. All rights reserved.
        </div>
      </div>
    </Layout>
  );
};

export default Home;
