import React, { useState, useRef } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// 세계 지도 토폴로지 데이터 URL
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface MousePosition {
  x: number;
  y: number;
}

const GlobeHome: React.FC = () => {
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const globeRef = useRef<HTMLDivElement>(null);

  // 마우스 드래그로 회전 제어
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

  return (
    <div className="flex flex-col items-center min-h-screen pt-24 text-white text-center">
      <h1 className="text-3xl font-bold mb-8">Greenee - 친환경 기업</h1>
      <div className="flex flex-col items-center max-w-4xl mx-auto px-4">
        <div 
          className="w-[700px] h-[700px] mb-8 flex justify-center items-center relative md:w-[500px] md:h-[500px] sm:w-[250px] sm:h-[250px]"
          ref={globeRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{
              scale: 150,
              rotate: rotation,
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#4a7c4d"
                    stroke="#2d482f"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#5cad60', outline: 'none' },
                      pressed: { fill: '#3d6a3f', outline: 'none' }
                    }}
                  />
                ))
              }
            </Geographies>
          </ComposableMap>
        </div>
        <p className="text-lg mb-10">환경을 생각하는 기업들과 함께 지속 가능한 미래를 만들어갑니다.</p>
        <div className="flex gap-5 flex-wrap justify-center sm:flex-col">
          <button className="bg-transparent text-white border-2 border-white rounded px-8 py-3 text-lg font-bold transition-all hover:bg-white hover:text-[#5c9560]">
            테스트 1
          </button>
          <button className="bg-transparent text-white border-2 border-white rounded px-8 py-3 text-lg font-bold transition-all hover:bg-white hover:text-[#5c9560]">
            테스트 2
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobeHome;
