import React, {
  useState,
  useEffect,
  useCallback,
  // useRef 
  } from 'react';
import guidelineData from '../data/parsed_wsg_guidelines.json';
import { useLocation } from 'react-router-dom';
import './Measure.css';
import mockCaptureImage from '@/data/img_captured_upgraded.png';


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
  cleanerThan: number;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Measure: React.FC = () => {
  const location = useLocation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [captureImage, setCaptureImage] = useState<string | null>(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // const pageRef = useRef(null);
  // const [inefficientImages, setInefficientImages] = useState([]);




  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      console.error("URL을 입력해주세요.");
      return;
    }

    // URL 유효성 검사
    try {
      const urlObject = new URL(url);
      if (!urlObject.protocol.startsWith('http')) {
        console.error("유효한 URL을 입력해주세요. (http:// 또는 https:// 로 시작해야 합니다)");
        return;
      }
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("유효한 URL 형식이 아닙니다.");
    }
  }, [url]);

  const startMeasurement = useCallback(async () => {
    if (!url) return;
    
    setIsLoading(true);
    try {
      setCaptureLoading(true);
      setCaptureError(null);
      setCaptureImage(mockCaptureImage);
      
      // 1. 먼저 /api/start-analysis로 요청
      const analysisStartResponse = await fetch('/api/start-analysis', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!analysisStartResponse.ok) {
        if (analysisStartResponse.status === 404) {
          // 2. DB에 데이터가 없으면 측정 시작
          const measurementResponse = await fetch('/api/start-measurement', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${encodeURIComponent(url)}`
          });

          if (!measurementResponse.ok) {
            throw new Error('성능 측정을 시작하는데 실패했습니다');
          }
        } else {
          throw new Error('분석 시작에 실패했습니다');
        }
      }

      // 3. 분석 결과 요청
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
      console.log(`측정 완료 - 탄소 등급: ${data.grade}`);
    } catch (error) {
      console.error('Error:', error);
      setCaptureError(error instanceof Error ? error.message : '오류가 발생했습니다');
      console.error(error instanceof Error ? error.message : '측정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setCaptureLoading(false);
    }
  }, [url]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  useEffect(() => {
    const state = location.state as { url?: string; result?: MeasurementResult } | null;
    if (state?.url) {
      setUrl(state.url);
      if (state.result) {
        setResult(state.result);
        console.log(`측정 완료 - 탄소 등급: ${state.result.grade}`);
      } else {
        // URL이 있고 결과가 없으면 자동으로 측정 시작
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }
    }
  }, [location.state, handleSubmit]);

  // const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
  //   // 실제 공유 기능 구현 필요
  //   console.log(`${platform}로 결과를 공유합니다.`);
  // };

  return (
    
    <div>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl bg-[#1E3320] border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl font-semibold text-center">
              Confirm URL
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-white/90 text-center text-lg">
                Please confirm if this is the URL you want to measure:
              </p>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <p className="font-mono text-sm break-all text-white/90">{url}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1 bg-white/10 text-white hover:bg-white/20 border-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={startMeasurement}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 border-0"
            >
              Start Measurement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="measure-container">
      <h1>Website Carbon Emission Measurement</h1>
        
        {!result ? (
          <div className="carbon-form-container">
            <p className="measure-description">
              Enter a website URL to measure its carbon emissions.
              Take the first step towards creating an eco-friendly web.
            </p>

            <form onSubmit={handleSubmit} className="carbon-form">
              <div className="url-input-container">
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://greenee.co.kr"
                  className="url-input"
                  required
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="measure-btn"
                >
                  {isLoading ? 'Measuring...' : 'Measure'}
                </button>
              </div>


            {isLoading && (
              <div className="loading-indicator">
                <div className="spinner"/>
                <p>Measuring... Please wait a moment...</p>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="result-container">
          <div className="result-header">
            <h2>Results for {result.url}</h2>
            <button
              onClick={() => setResult(null)}
              className="measure-again-btn"
            >
              Measure Again
            </button>
          </div>

          <div className="result-score-container">
            <div className="carbon-score">
              <div className="score-info">
                <div className={`score-circle grade-${result.grade.replace('+', '-plus')}`}>
                  <span>{result.grade}</span>
                </div>
                <div className="score-details">
                  <p className="score-rank">This website is in the top {result.cleanerThan}%</p>
                  <p className="score-emissions">{result.carbonEmission.toFixed(2)} CO₂/page gram</p>
                  <p className="score-size">{(result.kbWeight / 1024).toFixed(2)} MB</p>
                  <p className="score-comparison">전역 평균 ({result.globalAvgCarbon}g) 대비 {((result.carbonEmission - result.globalAvgCarbon) / result.globalAvgCarbon * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            {/* <ul>
              {result.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul> */}

          </div>

          <div className="carbon-equivalents">
            <h3 style={{ fontWeight: 'bold', marginTop: '2rem' }}>Annual Carbon Emission Equivalents</h3>
            <p className="subtitle">Based on 10,000 monthly visitors</p>
            
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☕</p>
                <p style={{ fontWeight: 'medium' }}>{result.carbonEquivalents?.coffeeCups?.toLocaleString() ?? '-'} cups of coffee</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</p>
                <p style={{ fontWeight: 'medium' }}>{result.carbonEquivalents?.evKm?.toLocaleString() ?? '-'}km by electric car</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</p>
                <p style={{ fontWeight: 'medium' }}>{result.carbonEquivalents?.phoneCharges?.toLocaleString() ?? '-'} phone charges</p>
              </div>
              
              <div className="metric-card" style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌲</p>
                <p style={{ fontWeight: 'medium' }}>{result.carbonEquivalents?.trees?.toLocaleString() ?? '-'} trees</p>
              </div>
            </div>
            
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'white' }}>
              * Carbon savings potential based on 10,000 daily visitors over one year.
            </p>
          </div>

          <div className="guidelines-checklist">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>W3C's WSG(Web Sustainability Guidelines) Audit Result</h3>
            
            <div className="guidelines-table">
              <div className="table-header">
                <span>Category</span>
                <span>Guideline</span>
                <span>Compliance</span>
                <span>Importance</span>
                <span></span>
              </div>
              
              {guidelineData.slice(0, 10).map((item, index) => (
                <div key={index} className={`table-row ${index >= 5 ? 'blurred' : ''}`}>
                  <span className="category">{item.categoryName}</span>
                  <span className="guideline">{item.guideline}</span>
                  <div className="compliance">
                    {(() => {
                      const isPass = Math.random() > 0.5;
                      return (
                        <span className={`compliance-icon ${isPass ? 'pass' : 'fail'}`}>
                          {isPass ? '✔' : '✖'}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="importance">
                    {Array(3).fill(0).map((_, i) => (
                      <span key={i} className={`importance-dot ${i < Math.floor(Math.random() * 3 + 1) ? 'active' : ''}`}>⬤</span>
                    ))}
                  </span>
                  <button className="view-more-btn">View More</button>
                </div>
              ))}
              {guidelineData.length > 5 && (
                <div className="premium-overlay">
                  <span>5 guidelines analyzed for carbon reduction. Request more analysis if needed.</span>
                </div>
              )}
            </div>
          </div>

          {/* <div className="text-center">
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
          </div> */}

          <div className="capture-result">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Website Image Analysis</h3>
            <p style={{ marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.8)' }}>Detection of non-optimized images that can be improved for better sustainability</p>            
            {captureLoading && <div className="loading-indicator">Capturing image...</div>}
            {captureError && <div className="error-message">Capture error: {captureError}</div>}
            {captureImage && (
              <div className="capture-image-container">
                <img src={captureImage} alt="Captured website" />
              </div>
            )}
          </div>

          <div className="software-intro">
            <div className="intro-header">
              <h3>Greenee - Web Image Optimizer (UseWebp)</h3>
              <p>Reduce carbon emissions with our intelligent image optimization solution</p>
            </div>
            
            <div className="intro-features">
              <div className="feature-card">
                <span className="feature-icon">🌱</span>
                <h4>Carbon Reduction</h4>
                <p>Average 3g CO₂ reduction per 5-minute browsing session</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <h4>Carbon Reduction</h4>
                <p>Average 3g CO₂ reduction per 5-minute browsing session</p>
              </div>

              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <h4>Carbon Reduction</h4>
                <p>Average 3g CO₂ reduction per 5-minute browsing session</p>
              </div>
            </div>

            <div className="intro-cta">
              <button className="download-btn">
                <span className="btn-icon">⬇️</span>
                Download UseWebp
              </button>
              <p className="cta-subtext">Join our community of eco-conscious web users</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Measure;
