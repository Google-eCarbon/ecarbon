import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  // 세션에 url이 있으면 바로 carbon-analysis로 이동
  useEffect(() => {
    const sessionUrl = sessionStorage.getItem('userUrl');
    if (sessionUrl) {
      navigate('/carbon-analysis');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    // 1. 분석 시작 요청
    const res = await fetch(`/api/start-analysis?url=${encodeURIComponent(url)}`, { method: 'POST' });
    if (!res.ok) {
      alert('분석 시작에 실패했습니다.');
      return;
    }
    sessionStorage.setItem('userUrl', url);
    // 2. 분석 페이지로 이동
    navigate('/carbon-analysis');
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
            {sessionStorage.getItem('userUrl') === null && (
              <form className="mt-6 flex gap-2" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 text-lg"
                  placeholder="https://example.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                />
                <Button type="submit" variant="default">분석하기</Button>
              </form>
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
