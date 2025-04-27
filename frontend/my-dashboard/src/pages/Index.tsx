import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Layout from '@/components/Layout';

// 한 계열(emerald/green)로 통일된 색상 팔레트
const COLORS = [
  '#34d399', // emerald-400
  '#10b981', // emerald-500
  '#059669', // emerald-600
  '#047857', // emerald-700
  '#22d3ee', // cyan-400
  '#2dd4bf', // teal-400
  '#6ee7b7', // emerald-300
  '#a7f3d0', // emerald-200
  '#bbf7d0', // emerald-100
  '#064e3b', // emerald-900
];

const CarbonResults = () => {
  const [url, setUrl] = useState('https://example.com');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fetchCarbonData = async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/carbon-analysis?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error('API 요청 실패');
      const json = await res.json();
      setResult(json);
      // 요소별 비중 recharts용 변환
      if (json.resourcePercentage) {
        setData(json.resourcePercentage.map((item: any) => ({
          name: item.resourceType,
          value: item.percentage
        })));
      } else {
        setData([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarbonData(url);
    // eslint-disable-next-line
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCarbonData(url);
  };

  return (
    <Layout>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {result && (
        <div className="space-y-8">
          {/* 상단 */}
          <Card className="border-l-4 border-l-eco-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-eco-green">🌿</span>
                탄소 측정 결과 | 사이트: {result.url}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xl flex items-center gap-2">
                    <span>🌍 총 배출량:</span>
                    <span className="font-bold">{result.carbonEmission}g</span>
                    <span className="text-muted-foreground">(전체 평균: {result.globalAvgCarbon}g)</span>
                  </p>
                  <p className="text-xl flex items-center gap-2">
                    <span>🏷️ 등급:</span>
                    <span className="font-bold text-red-500">{result.grade}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* 중단 - 파이 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>요소별 비중</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="h-[400px] w-full max-w-[500px] flex justify-center items-center mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={170}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* 범례를 한 줄로, 색상+요소+비율을 한 번에 표시 */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {data.map((entry, index) => (
                    <span key={entry.name} className="flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-gray-100 border">
                      <span style={{ display: 'inline-block', width: 16, height: 16, background: COLORS[index % COLORS.length], borderRadius: 4, marginRight: 4 }} />
                      <span style={{ color: COLORS[index % COLORS.length], fontWeight: 600 }}>
                        {entry.name}
                      </span>
                      <span className="ml-1">({entry.value.toFixed(1)}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* 하단 - 탄소 절감 효과 */}
          <Card className="bg-accent">
            <CardHeader>
              <CardTitle className="text-center text-xl">💡 이만큼 줄이면 이런 보상이 있어요!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded-md shadow-sm">
                  <p className="text-xl">📱</p>
                  <p className="font-medium">
                    스마트폰 {result.carbonEquivalents?.phoneCharges?.toLocaleString() ?? '-'}회 충전
                  </p>
                </div>
                <div className="p-4 bg-white rounded-md shadow-sm">
                  <p className="text-xl">🌲</p>
                  <p className="font-medium">
                    나무 {result.carbonEquivalents?.trees?.toLocaleString() ?? '-'}그루
                  </p>
                </div>
                <div className="p-4 bg-white rounded-md shadow-sm">
                  <p className="text-xl">☕</p>
                  <p className="font-medium">
                    커피 {result.carbonEquivalents?.coffeeCups?.toLocaleString() ?? '-'}잔
                  </p>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                ※ 하루 10,000명 방문 기준, 1년 동안 절감할 수 있는 탄소량입니다.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default CarbonResults;
