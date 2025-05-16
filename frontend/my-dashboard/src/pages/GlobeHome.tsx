import React, { useState, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// 세계 지도 토폴로지 데이터 URL
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import '../styles/GlobeHome.css';

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

interface VulnerableCountry {
  code: string;
  name: string;
}

interface CountryLocation {
  country: string;
  latitude: number;
  longitude: number;
}

const vulnerableCountries = [
  { 
    code: "SDN", 
    name: "Sudan",
    description: "Sudan faces severe droughts and desertification, threatening food security and water resources. Rising temperatures intensify these challenges, affecting millions of people."
  },
  { 
    code: "BGD", 
    name: "Bangladesh",
    description: "Bangladesh is highly susceptible to flooding and cyclones. Sea level rise threatens coastal areas, impacting agriculture and forcing climate migration."
  },
  { 
    code: "NER", 
    name: "Niger",
    description: "Niger struggles with extreme heat and drought. The Sahel region's expanding desertification severely impacts agriculture and livestock farming."
  },
  { 
    code: "TCD", 
    name: "Chad",
    description: "Chad's Lake Chad is shrinking dramatically due to climate change, affecting millions who depend on it for livelihood and sustenance."
  },
  { 
    code: "PAK", 
    name: "Pakistan",
    description: "Pakistan experiences intense flooding and heat waves. Glacier melting in the north and coastal threats in the south pose significant risks."
  },
  { 
    code: "ITA", 
    name: "Italy",
    description: "Italy faces rising sea levels threatening Venice and coastal regions. Increasing heat waves and droughts affect agriculture and tourism."
  },
];

const countryLocations: CountryLocation[] = [
  {
    country: "Kiribati",
    latitude: 1.87,
    longitude: -157.36
  },
  {
    country: "Maldives",
    latitude: 3.25,
    longitude: 73.00
  },
  {
    country: "Tuvalu",
    latitude: -8.15,
    longitude: 177.95
  },
  {
    country: "Central African Republic",
    latitude: 6.61,
    longitude: 20.94
  },
];



const GlobeHome = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [mapScale, setMapScale] = useState(120);
  const [cities, setCities] = useState<MarkerData[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [hoveredVulnerableCountry, setHoveredVulnerableCountry] = useState(null);

  const lastMouseRef = useRef({ x: 0, y: 0 });
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
            // Add special country locations
            const specialLocations = countryLocations.map(loc => ({
              name: loc.country,
              carbonEmission: 0,
              coordinates: [loc.longitude, loc.latitude] as [number, number],
              url: ''
            }));

            // Transform the data to match the expected format
            const transformedMarkers = data.emissionMapMarkers.map(marker => ({
              name: marker.placeName,
              carbonEmission: marker.carbonEmission,
              coordinates: [marker.longitude, marker.latitude] as [number, number],
              url: marker.url
            }));
            console.log('Received markers:', transformedMarkers);
            // Combine special locations with regular markers
            setCities([...specialLocations, ...transformedMarkers]);
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

  const handleMouseDown = () => setIsDragging(false);
  const handleMouseMove = () => {};
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setMapScale(prev => Math.min(prev * 1.2, 300));
  };

  const handleZoomOut = () => {
    setMapScale(prev => Math.max(prev * 0.8, 80));
  };

  const handleUrlChange = (e) => setUrl(e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast({
        variant: "destructive",
        description: "URL을 입력해주세요."
      });
      return;
    }

    // Measure 페이지로 이동
    navigate('/measure', { 
      state: { url } 
    });
  };

  return (
    <div className="home-container">
      <h1>Evaluate the Sustainability of Your Website with Greenee</h1>
      <div className="home-content">
        <div className="split-container">
        <div className="measure-intro">
            <div>
              <h2>Measure Website Carbon Emissions</h2>
              <p className="measure-description">
                Enter a website URL to measure its carbon emissions.
                <p></p>
                Take the first step towards creating an eco-friendly web.
              </p>
              <form onSubmit={handleSubmit} className="url-form">
                <input
                  type="url"
                  className="url-input"
                  placeholder="https://google.com"
                  value={url}
                  onChange={handleUrlChange}
                  required
                />
                <button type="submit" className="measure-btn">
                  Measure
                </button>
              </form>
            </div>
          </div>
        </div>

        <div
          ref={globeRef}
          className="globe-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}

        >
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 150,
              center: [0, 35],
            }}
            style={{
              background: "#1E3320",
              clipPath: "inset(15% 0 0 0)"
            }}
          >
              
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = geo.properties.name;
                    const isVulnerable = vulnerableCountries.some(c => c.name === name);
                    return (
                    <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      const name = geo.properties.name;
                      const country = vulnerableCountries.find(c => c.name === name);
                      if (country) {
                        console.log(`:흰색_확인_표시: Vulnerable Country: ${name}`);
                        setHoveredVulnerableCountry(country);
                        }
                      }}
                      onMouseLeave={() => setHoveredVulnerableCountry(null)}
                      fill="#1B1B1B"
                      stroke="#1E3320"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: isVulnerable ? '#729ed0' : '#F0FADA',
                          opacity: 0.9
                        },
                        hover: {
                          fill: isVulnerable ? '#1976D2' : '#BDBDBD',
                          opacity: 1
                        },
                        pressed: {
                          fill: isVulnerable ? '#1565C0' : '#9E9E9E',
                          opacity: 1
                        }
                      }}
                    />
                  );
                })
              }
              </Geographies>
              {countryLocations
                .map((country, index) => (
                  <Marker key={`vulnerable-${index}`} coordinates={[country.longitude, country.latitude]}>
                    <g
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // setSelectedMarker({
                        //   name: country.country,
                        //   type: '취약 국가',
                        // });
                      }}
                      onMouseEnter={(e) => {
                        setHoveredMarker({ name: country.country });
                        // setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredMarker(null)}
                    >
                      <circle
                        r={6}
                        fill="#729ed0"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{
                          transition: 'all 0.2s ease',
                          transform: hoveredMarker?.name === country.country ? 'scale(1.3)' : 'scale(1)',
                          cursor: 'pointer'
                        }}
                      />
                    </g>
                  </Marker>
                ))}
              {cities.map((city, index) => {
                  const isHighCarbon = city.carbonEmission > 3;
                  const shouldShow = !hoveredVulnerableCountry || (hoveredVulnerableCountry && isHighCarbon);
                  const getMarkerColor = (emission: number) => {
                    if (emission <= 1.5) return '#4CAF50'; // 초록색
                    if (emission <= 2.5) return '#FFC107'; // 노란색
                    return '#FF5252'; // 빨간색
                  };
                  return (
                    <Marker key={index} coordinates={city.coordinates}>
                    <g
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        setHoveredMarker({
                          name: city.name,
                          type: '웹사이트',
                          carbonEmission: city.carbonEmission,
                          url: city.url
                        });
                      }}
                      onMouseLeave={() => setHoveredMarker(null)}
                    >
                      <circle
                        r={4}
                        fill={getMarkerColor(city.carbonEmission)}
                        stroke="#fff"
                        strokeWidth={2}
                        style={{
                          transition: 'all 0.3s ease',
                          transform: hoveredMarker?.url === city.url ? 'scale(1.3)' : 'scale(1)',
                          cursor: 'pointer',
                          opacity: shouldShow ? 1 : 0,
                          filter: hoveredVulnerableCountry && isHighCarbon ? 'drop-shadow(0 0 8px rgba(255, 82, 82, 0.8))' : 'none'
                        }}
                      />
                    </g>
                  </Marker>
                  );
            })}
            </ComposableMap>
            <div className="tips-text">
              💡 Tip: Drag the globe to explore Google Solution Challenge Participation University's Carbon Footprints
            </div>
            {/* 마커 정보 표시 영역 */}
            {/* 마커 색상 설명 범례 */}
            <div className="legend-container">
              <div className="legend-title">Marker Color Guide</div>
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: '#2196F3' }} />
                <span>Climate Vulnerable Countries</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: '#FF5252' }} />
                <span>High Carbon Websites</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: '#FFD740' }} />
                <span>Medium Carbon Websites</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: '#4CAF50' }} />
                <span>Low Carbon Websites</span>
              </div>
            </div>
          </div>
        </div>
          <div className="challenge-info">
              <h3>Do you think digital technology is environmentally friendly?</h3>
              <p>
                In reality, the digital sector emits <strong>1.6 billion tons</strong> of greenhouse gases annually, accounting for <strong>5% of total emissions</strong>.
                Sustainability is <strong>no longer a choice, but a necessity</strong> for the web industry.
              </p>
              <p>
                Greenee provides a <strong>comprehensive assessment</strong> of website sustainability, based on the <strong>W3C's Web Sustainability Guidelines</strong>, 
                that goes beyond simple carbon emission measurement.
              </p>
              <p>
                The <strong>blue markers</strong> on the map indicate countries most vulnerable to climate change.
                Check how your website affects these vulnerable regions and join the journey to create a more <strong>sustainable digital future</strong>.
              </p>
            </div>
          {hoveredMarker && (
            <div className="marker-info">
              <div className="marker-info-title">
                {hoveredMarker.type === '웹사이트' ? 'Website Information' : 'Vulnerable Country'}
              </div>
              <div className="marker-info-content">
                <div>
                  <span className="marker-info-label">Name</span>
                  <span className="marker-info-value">{hoveredMarker.name}</span>
                </div>
                
                {hoveredMarker.type === '웹사이트' && (
                  <>
                    <div className="marker-info-emission">
                      <span>Carbon Emissions: {hoveredMarker.carbonEmission}g CO2</span>
                      <span className="marker-info-grade">
                        {hoveredMarker.carbonEmission > 3 ? (
                          <span className="grade-high">High Impact</span>
                        ) : hoveredMarker.carbonEmission > 1 ? (
                          <span className="grade-medium">Medium Impact</span>
                        ) : (
                          <span className="grade-low">Low Impact</span>
                        )}
                      </span>
                    </div>
                    
                    <div>
                      <span className="marker-info-label">Website URL</span>
                      <a
                        href={hoveredMarker.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="marker-info-url"
                      >
                        {hoveredMarker.url}
                      </a>
                    </div>
                  </>
                )}
                
                {hoveredMarker.type === '취약 국가' && (
                  <div className="vulnerability-info">
                    This country is particularly vulnerable to climate change impacts.
                    Digital sustainability efforts can help reduce environmental stress
                    on vulnerable regions.
                  </div>
                )}
              </div>
            </div>
          )}
          {hoveredVulnerableCountry && (
            <div className="vulnerability-message">
              <div className="country-name">{hoveredVulnerableCountry.name}</div>
              <div className="country-description">{hoveredVulnerableCountry.description}</div>
              <div className="impact-note">High-carbon websites contribute to global emissions affecting vulnerable regions like this.</div>
            </div>
          )}
      </div>
      
  );
};

export default GlobeHome;
