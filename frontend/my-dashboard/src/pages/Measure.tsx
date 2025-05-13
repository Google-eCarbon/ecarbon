import React, { useState, useEffect } from 'react';
import guidelineData from '../data/parsed_wsg_guidelines.json';
import { useLocation } from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; 
import './Measure.css';
import mockCaptureImage from '@/data/img_captured12.png';

interface CarbonEquivalents {
  coffeeCups: number;
  evKm: number;
  phoneCharges: number;
  trees: number;
}

interface ResourcePercentage {
  resourceType: string;
  size: number;
  percentage: number;
}

interface MeasurementResult {
  measuredAt: string;
  url: string;
  total_byte_weight: number;
  resourcePercentage: ResourcePercentage[];
  carbonEquivalents: CarbonEquivalents;
  carbonEmission: number;
  kbWeight: number;
  grade: string;
  globalAvgCarbon: number;
}

const Measure: React.FC = () => {
  const location = useLocation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [captureImage, setCaptureImage] = useState<string | null>(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const state = location.state as { url?: string; result?: MeasurementResult } | null;
    if (state?.url) {
      setUrl(state.url);
      if (state.result) {
        setResult(state.result);
        toast({
          title: "측정 완료",
          description: `탄소 등급: ${state.result.grade}`
        });
      }
    }
  }, [location.state, toast]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    try {
      setCaptureLoading(true);
      setCaptureError(null);
      setCaptureImage(mockCaptureImage);
      
      // 1. URL 제출
      const startResponse = await fetch('/api/start-analysis', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!startResponse.ok) {
        throw new Error('성능 측정을 시작하는데 실패했습니다');
      }

      // 2. 분석 결과 가져오기
      const analysisResponse = await fetch('/api/carbon-analysis', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!analysisResponse.ok) {
        if (analysisResponse.status === 302) {
          window.location.href = '/';
          return;
        }
        throw new Error('분석 결과를 가져오는데 실패했습니다');
      }

      const data = await analysisResponse.json();
      setResult(data);
      setCaptureLoading(false);

      toast({
        title: "측정 완료",
        description: `탄소 등급: ${data.grade}`,
      });
    } catch (error) {
      setCaptureLoading(false);
      setCaptureError('이미지 캡처 실패');
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "측정 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    // 실제 공유 기능 구현 필요
    toast({
      title: "공유하기",
      description: `${platform}로 결과를 공유합니다.`,
    });
  };

  return (
    <div className="measure-container">
      <h1 className="text-4xl font-bold text-center mb-10">웹사이트 탄소 배출량 측정</h1>
      
      {!result ? (
        <div className="carbon-form-container">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">웹사이트 URL 입력</h2>
              <p className="text-white/70">
                측정하고자 하는 웹사이트의 URL을 입력해주세요.
              </p>
            </div>

            <div className="flex space-x-2">
              <Input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://greenee.co.kr"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-white text-green-700 hover:bg-white/90"
              >
                측정하기
              </Button>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center space-y-4 mt-8">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <p>측정 중입니다. 잠시만 기다려 주세요...</p>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="result-container bg-white/10 p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">{result.url} 측정 결과</h2>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-700"
            >
              다시 측정하기
            </Button>
          </div>

          <div className="result-score-container">
            <div className="carbon-score">
              <div className="score-info">
                <div className="score-circle">
                  <span>{result.grade}</span>
                </div>
                <div className="score-details">
                  <p className="score-emissions">{result.carbonEmission.toFixed(2)} CO₂/page gram</p>
                  <p className="score-size">총 {(result.kbWeight / 1024).toFixed(2)} MB</p>
                  <p className="score-comparison">전역 평균 ({result.globalAvgCarbon}g) 대비 {((result.carbonEmission - result.globalAvgCarbon) / result.globalAvgCarbon * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="carbon-equivalents mt-8">
            <h3 className="text-xl font-semibold mb-2">탄소 배출량 환산</h3>
            <p className="text-sm opacity-70 mb-4">이 페이지의 탄소 배출량은 다음과 같습니다</p>
            
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☕</p>
                <p style={{ fontWeight: 'medium' }}>커피 {result.carbonEquivalents?.coffeeCups?.toLocaleString() ?? '-'}잔</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</p>
                <p style={{ fontWeight: 'medium' }}>전기차 {result.carbonEquivalents?.evKm?.toLocaleString() ?? '-'}km</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</p>
                <p style={{ fontWeight: 'medium' }}>휴대폰 {result.carbonEquivalents?.phoneCharges?.toLocaleString() ?? '-'}회 충전</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌲</p>
                <p style={{ fontWeight: 'medium' }}>나무 {result.carbonEquivalents?.trees?.toLocaleString() ?? '-'}그루</p>
              </div>
            </div>
            
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
              ※ 하루 10,000명 방문 기준, 1년 동안 절감할 수 있는 탄소량입니다.
            </p>
          </div>

          <div className="guidelines-checklist mt-8">
            <h3 className="text-2xl font-semibold mb-6">지속 가능한 웹 가이드라인</h3>
            
            <div className="guidelines-table">
              <div className="table-header">
                <span>카테고리</span>
                <span>가이드라인</span>
                <span>준수여부</span>
                <span>중요도</span>
                <span></span>
              </div>
              
              {guidelineData.slice(0, 10).map((item, index) => (
                <div key={index} className={`table-row ${index >= 5 ? 'blurred' : ''}`}>
                  <span className="category">{item.categoryName}</span>
                  <span className="guideline">{item.guideline}</span>
                  <span className="compliance">
                    <span className={`compliance-icon ${Math.random() > 0.5 ? 'pass' : 'fail'}`}>
                      {Math.random() > 0.5 ? '✔' : '✖'}
                    </span>
                  </span>
                  <span className="importance">
                    {Array(3).fill(0).map((_, i) => (
                      <span key={i} className={`importance-dot ${i < Math.floor(Math.random() * 3 + 1) ? 'active' : ''}`}>⬤</span>
                    ))}
                  </span>
                  <button className="view-more-btn">더보기</button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="mb-4">이 결과를 공유하고 웹사이트를 개선하세요!</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => handleShare('twitter')}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                Twitter
              </Button>
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-[#4267B2] hover:bg-[#365899]"
              >
                Facebook
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                className="bg-[#0077B5] hover:bg-[#006097]"
              >
                LinkedIn
              </Button>
            </div>
          </div>

          <div className="capture-result mt-8">
            <h3 className="text-2xl font-semibold mb-4">웹사이트 이미지 분석 결과</h3>
            {captureLoading && (
              <div className="loading-indicator flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                <p>이미지 캡처 중...</p>
              </div>
            )}
            {captureError && (
              <div className="error-message text-red-500 p-4 rounded bg-red-100/10">
                캡처 오류: {captureError}
              </div>
            )}
            {captureImage && (
              <div className="capture-image-container bg-white/10 p-4 rounded-lg">
                <img src={captureImage} alt="캡처된 웹사이트" className="w-full max-w-3xl mx-auto rounded-lg shadow-lg" />
                <p className="capture-description mt-4 text-center text-sm text-white/80">
                  붉은색 테두리로 표시된 부분이 이미지 요소입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Measure;
