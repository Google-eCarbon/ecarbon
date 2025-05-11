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

interface MeasurementResult {
  url: string;
  carbonScore: number;
  co2Grams: number;
  cleanerThan: number;
  tips: string[];
  carbonEquivalents: CarbonEquivalents;
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
          description: `탄소 점수: ${state.result.carbonScore}점`
        });
      }
    }
  }, [location.state, toast]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      setCaptureLoading(true);
      setCaptureError(null);
      setCaptureImage(mockCaptureImage);
      try {
        // Mock 이미지 사용
      } catch (error: any) {
        console.error('캡처 중 오류:', error);
        setCaptureError(error?.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setCaptureLoading(false);
      }

      // 웹사이트 탄소 배출량 측정 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const carbonScore = Math.floor(Math.random() * 91) + 10;
      const co2Grams = Number((Math.random() * 5).toFixed(2));
      
      setResult({
        url,
        carbonScore,
        co2Grams,
        cleanerThan: Math.floor(Math.random() * 91) + 10,
        tips: [],
        carbonEquivalents: {
          coffeeCups: Math.floor(Math.random() * 1000) + 100,
          evKm: Math.floor(Math.random() * 1000) + 100,
          phoneCharges: Math.floor(Math.random() * 1000) + 100,
          trees: Math.floor(Math.random() * 100) + 10
        }
      });
      


      toast({
        title: "측정 완료",
        description: "웹사이트의 탄소 배출량 측정이 완료되었습니다.",
      });
    } catch (error) {
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
                  <span>
                    {result.carbonScore >= 90 ? 'A+' :
                     result.carbonScore >= 80 ? 'A' :
                     result.carbonScore >= 70 ? 'B' :
                     result.carbonScore >= 60 ? 'C' :
                     result.carbonScore >= 50 ? 'D' : 'F'}
                  </span>
                </div>
                <div className="score-details">
                  <p className="score-rank">해당 웹사이트는 상위 {result.cleanerThan}% 입니다.</p>
                  <p className="score-emissions">{result.co2Grams} CO₂/page gram</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="carbon-equivalents">
            <h3 style={{ fontWeight: 'bold', marginTop: '2rem' }}>연간 탄소 배출량 환산</h3>
            <p className="subtitle">월 10,000명 방문 기준</p>
            
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
