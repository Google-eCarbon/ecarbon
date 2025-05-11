import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import '../styles/GlobeHome.css';

// 세계 지도 토폴로지 데이터 URL
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface MousePosition {
  x: number;
  y: number;
}

interface City {
  id: string;
  placeName: string;
  country: string;
  carbonEmission: number;
  grade: string;
  coordinates: [number, number];
}

const GlobeHome: React.FC = () => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [cities, setCities] = useState<City[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastMouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/ranking', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCities(data.topEmissionPlaces.map((place: any) => ({
            id: place.id,
            placeName: place.placeName,
            country: place.country,
            carbonEmission: place.carbonEmission,
            grade: place.grade,
            coordinates: [place.longitude || 0, place.latitude || 0]
          })));
        }
      } catch (error) {
        console.error('도시 데이터 로딩 실패:', error);
      }
    };

    fetchCities();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      
      setRotation(([x, y, z]) => [x + dx * 0.5, y - dy * 0.5, z * 0.5]);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      // 웹사이트 탄소 배출량 측정 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const carbonScore = Math.floor(Math.random() * 91) + 10;
      const co2Grams = Number((Math.random() * 5).toFixed(2));
      const cleanerThan = Math.floor(Math.random() * 91) + 10;

      const measurementResult = {
        url,
        carbonScore,
        co2Grams,
        cleanerThan,
        tips: [
          "이미지 최적화로 페이지 크기 줄이기",
          "서버 위치를 사용자에게 가깝게 설정",
          "화면 크기에 맞게 이미지 제공",
          "불필요한 JavaScript 제거",
          "지속 가능한 호스팅 서비스 사용"
        ]
      };

      // 측정 결과와 함께 Measure 페이지로 리디렉션
      navigate('/measure', { 
        state: { 
          url,
          result: measurementResult
        } 
      });
    } catch (error) {
      console.error('측정 실패:', error);
      navigate('/measure', { state: { url } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Greenee 웹사이트의 지속가능성을 평가하세요</h1>
      <div className="home-content">
        <div className="split-container">
          <div 
            className="globe-container"
            ref={globeRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <ComposableMap
              projection="geoOrthographic"
              projectionConfig={{
                scale: 250,
                rotate: rotation,
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1B1B1B"
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: "#ffffff",
                          opacity: 0.1
                        },
                        hover: {
                          fill: "#1B1B1B",
                          opacity: 0.2
                        },
                        pressed: {
                          fill: "#1B1B1B",
                          opacity: 0.2
                        }
                      }}
                    />
                  ))
                }
              </Geographies>
              {cities.map((city) => (
                <Marker key={city.id} coordinates={city.coordinates}>
                  <circle
                    r={4}
                    fill={city.grade === 'A' ? '#34d399' : city.grade === 'B' ? '#10b981' : '#ef4444'}
                  />
                </Marker>
              ))}
            </ComposableMap>
          </div>
          <div className="measure-section">
              <p className="measure-description">
                웹사이트의 탄소 발자국을 측정하고 개선 방안을 확인하세요.
              </p>
              <form onSubmit={handleSubmit} className="url-form">
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="웹사이트 URL을 입력하세요"
                  className="url-input"
                  required
                />
                <button 
                  type="submit" 
                  className="rounded-l-none bg-white text-green-700 hover:bg-white/90 hover:text-green-800"
                  disabled={isLoading}
                >
                  {isLoading ? '측정 중...' : '분석 시작'}
                </button>
                {isLoading && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-8">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-white">측정 중입니다...</p>
                  </div>
                )}
              </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeHome;
