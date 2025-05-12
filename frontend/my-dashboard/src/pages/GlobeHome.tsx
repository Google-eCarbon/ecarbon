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

interface EmissionMapMarker {
  placeName: string;
  carbonEmission: number;
  latitude: number;
  longitude: number;
  url: string;
}

interface GlobeHomeResponse {
  emissionMapMarkers: EmissionMapMarker[];
  error?: string;
}

interface MarkerData {
  name: string;
  carbonEmission: number;
  coordinates: [number, number];
  url: string;
}

interface TooltipData {
  content: string;
  position: { x: number; y: number };
}

const GlobeHome: React.FC = () => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [cities, setCities] = useState<MarkerData[]>([]);
  const [error, setError] = useState<string>('');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastMouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMapMarkers = async () => {
      try {
        setError('');
        // Get current week's start date in YYYY-MM-DD format
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(today.setDate(diff));
        const weekStartDate = weekStart.toISOString().split('T')[0];

        console.log('Fetching data for week starting:', weekStartDate);

        const response = await fetch(`http://localhost:8080/?weekStartDate=${weekStartDate}&placeCategory=UNIVERSITY`);

        if (response.ok) {
          const data: GlobeHomeResponse = await response.json();
          if (data.error) {
            setError(data.error);
            setCities([]);
          } else {
            // Transform the data to match the expected format
            const transformedCities = data.emissionMapMarkers.map(marker => ({
              name: marker.placeName,
              carbonEmission: marker.carbonEmission,
              coordinates: [marker.longitude, marker.latitude] as [number, number],
              url: marker.url
            }));
            console.log('Received markers:', transformedCities);
            setCities(transformedCities);
          }
        } else if (response.status === 204) {
          console.log('No data available for the specified week');
          setCities([]);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch map markers');
          console.error('Failed to fetch map markers:', response.statusText);
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error fetching map markers:', error);
      }
    };

    fetchMapMarkers();
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
      // 1. URL 제출하여 분석 시작
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
        throw new Error('분석 결과를 가져오는데 실패했습니다');
      }

      const result = await analysisResponse.json();

      // 3. 측정 결과와 함께 Measure 페이지로 리디렉션
      navigate('/measure', { 
        state: { 
          url,
          result
        } 
      });
    } catch (error) {
      console.error('측정 실패:', error);
      // 에러 발생 시에도 Measure 페이지로 이동하여 재시도할 수 있도록 함
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
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div ref={globeRef} className="globe-container" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
              {cities
                .filter((city) => {
                  const [longitude] = city.coordinates;
                  const [rotateX] = rotation;
                  const relativeLongitude = (longitude + rotateX + 180) % 360 - 180;
                  return Math.abs(relativeLongitude) <= 90; // 앞면(±90도 이내)의 마커만 표시
                })
                .map((city, index) => (
                  <Marker key={index} coordinates={city.coordinates}>
                    <g 
                      style={{ cursor: 'pointer' }}
                      onClick={() => window.open(city.url, '_blank')}
                      onMouseEnter={(e: React.MouseEvent) => {
                        const rect = (e.target as SVGElement).getBoundingClientRect();
                        setTooltip({
                          content: `${city.name}\n탄소 배출량: ${city.carbonEmission.toFixed(2)}g CO2\n${city.url}`,
                          position: { x: rect.left, y: rect.top - 10 }
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <circle 
                        r={4} 
                        fill={city.carbonEmission < 2 ? '#34d399' : city.carbonEmission < 3 ? '#10b981' : '#ef4444'}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    </g>
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
      {tooltip && (
        <div 
          style={{
            position: 'fixed',
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`,
            transform: 'translateY(-100%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default GlobeHome;
