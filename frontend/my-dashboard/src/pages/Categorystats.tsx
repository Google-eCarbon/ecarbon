import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek } from "date-fns";
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import { GoogleMap, LoadScriptNext, Marker, InfoWindow } from '@react-google-maps/api';

const CategoryStats = () => {
  const [selectedCategory, setSelectedCategory] = useState("university");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [topPlaces, setTopPlaces] = useState<any[]>([]); // topEmissionPlaces
  const [countryAverages, setCountryAverages] = useState<any[]>([]); // countryCarbonAvgs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [emissionMapMarkers, setEmissionMapMarkers] = useState<any[]>([]); // 지도 마커용

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/global-stats';
        const params = new URLSearchParams();
        if (date) {
          const monday = startOfWeek(date, { weekStartsOn: 1 });
          const formattedDate = format(monday, 'yyyy-MM-dd');
          params.append('weekStartDate', formattedDate);
        }
        params.append('placeCategory', selectedCategory.toUpperCase());
        url += `?${params.toString()}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('API 요청 실패');
        const json = await res.json();
        setTopPlaces(json.topEmissionPlaces || []);
        setCountryAverages(json.countryCarbonAvgs || []);
        setLastUpdate(json.weekStartDate); // weekStartDate 저장
        setEmissionMapMarkers(json.emissionMapMarkers || []); // 지도 마커 데이터 저장
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedCategory, date]);

  // Map center (South Korea)
  const center = {
    lat: 36.5,
    lng: 127.5
  };

  // Map container style
  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  // Get marker color based on emissions
  const getMarkerColor = (emissions: number) => {
    if (emissions <= 1.5) return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (emissions <= 2.5) return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  };

  // Helper function for grade color
  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'bg-eco-green';
      case 'B': return 'bg-eco-yellow';
      case 'C': return 'bg-eco-orange';
      case 'D': 
      case 'F':
      default: return 'bg-eco-red';
    }
  };

  return (
    <Layout>
      {/* Google Maps 오류 메시지 숨기기용 스타일 */}
      <style>{`
        .gm-err-container {
          display: none !important;
        }
      `}</style>
      <div className="space-y-8">
        {/* 상단 – 주제 및 기간 선택 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">📊 분석 대상</CardTitle>
                <CardDescription>분석하고자 하는 분야를 선택하세요</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-[400px]">
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="university">대학교</TabsTrigger>
                    <TabsTrigger value="company">기업</TabsTrigger>
                    <TabsTrigger value="hospital">병원</TabsTrigger>
                    <TabsTrigger value="public">공공기관</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-muted-foreground">분석 기간</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                측정 일자: {lastUpdate || "로딩 중..."}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* 중단 – 랭킹 + 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 탄소 절감 랭킹 */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 TOP 5 친환경 웹사이트 (배출량 낮은 순)</CardTitle>
              <CardDescription>선택된 분야에서 가장 친환경적인 웹사이트 TOP 5</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <div>로딩 중...</div>}
              {error && <div className="text-red-500">{error}</div>}
              <div className="relative overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">순위</th>
                      <th className="px-6 py-3">기관명</th>
                      <th className="px-6 py-3">평균 배출량(g/page)</th>
                      <th className="px-6 py-3">등급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlaces.length === 0 ? (
                      <tr><td colSpan={4}>데이터 없음</td></tr>
                    ) : (
                      topPlaces.map((item: any, index: number) => (
                        <tr key={index} className="bg-white border-b">
                          <td className="px-6 py-4 text-center font-medium">{item.rank ?? index + 1}</td>
                          <td className="px-6 py-4">{item.placeName}</td>
                          <td className="px-6 py-4">{item.carbonEmission}g</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white ${getGradeColor(item.grade)}`}>
                              {item.grade}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* 전체 평균 등은 필요시 추가 */}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  내려받기: CSV / PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 우측: 차트 시각화 */}
          <Card>
            <CardHeader>
              <CardTitle>📊 배출량 차트</CardTitle>
              <CardDescription>기관별 탄소 배출량 비교</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {topPlaces && topPlaces.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topPlaces.map(item => ({ name: item.placeName, emissions: item.carbonEmission, grade: item.grade }))}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="emissions" fill="#4ade80">
                        {topPlaces.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={
                              entry.grade === 'A' ? '#34d399' : // 초록색
                              entry.grade === 'B' ? '#fbbf24' : // 노란색
                              entry.grade === 'C' ? '#fb923c' : // 주황색
                              '#f87171' // 빨간색
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 하단 – 지역 평균 비교 + AI 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 지역별 평균 배출량 */}
          <Card>
            <CardHeader>
              <CardTitle>📈 국가별 평균 배출량 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">국가</th>
                      <th className="px-6 py-3">평균 배출량</th>
                    </tr>
                  </thead>
                    <tbody>
                      {countryAverages.length === 0 ? (
                        <tr><td colSpan={2}>데이터 없음</td></tr>
                      ) : (
                        countryAverages
                          .sort((a: any, b: any) => b.averageCarbon - a.averageCarbon) // 내림차순 정렬
                          .map((item: any, index: number) => (
                            <tr key={index} className="bg-white border-b">
                              <td className="px-6 py-4">{item.country}</td>
                              <td className="px-6 py-4">{item.averageCarbon?.toFixed(2)}g/page</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  리포트 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* AI 분석 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🤖</span> AI Insight 요약 (Gemini 기반 분석)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                  <p>친환경 사이트는 평균 2.1g/page 더 적게 배출</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                  <p>JS 최적화율이 35% 더 높음</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                  <p>경남권은 평균 절감률이 전국 최고 (7.4%)</p>
                </div>
              </div>
              {/* Google Map */}
              <LoadScriptNext googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  key={`${selectedCategory}-${date}`} // 상태 변경 시 리렌더링
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={7}
                  options={{
                    minZoom: 5,
                    maxZoom: 15,
                  }}
                >
                  {emissionMapMarkers.map((marker, index) => (
                    marker.latitude && marker.longitude && (
                      <Marker
                        key={index}
                        position={{ lat: marker.latitude, lng: marker.longitude }}
                        icon={getMarkerColor(marker.carbonEmission)}
                        title={`${marker.placeName ?? ''} (${marker.carbonEmission ?? ''} CO₂)`}
                        onClick={() => {
                          if (marker.url) {
                            window.open(marker.url, '_blank');
                          }
                        }}
                      />
                    )
                  ))}
                </GoogleMap>
              </LoadScriptNext>
              <Button variant="secondary" className="mt-4 w-full">
                💬 개선 제안 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryStats;
