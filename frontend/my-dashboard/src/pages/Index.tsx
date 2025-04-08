
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Layout from '@/components/Layout';

const CarbonResults = () => {
  // Mock data for the pie chart
  const data = [
    { name: 'JavaScript', value: 45 },
    { name: '이미지', value: 30 },
    { name: 'CSS', value: 15 },
    { name: 'API 요청', value: 10 },
  ];
  
  const COLORS = ['#34d399', '#a7f3d0', '#065f46', '#10b981'];
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* 상단 */}
        <Card className="border-l-4 border-l-eco-green">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-eco-green">🌿</span> 
              탄소 측정 결과 | 사이트: example.com
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xl flex items-center gap-2">
                  <span>🌍 총 배출량:</span>
                  <span className="font-bold">8.602g</span>
                  <span className="text-red-500">🔻</span>
                  <span className="text-muted-foreground">(전체 평균: 5.3g)</span>
                </p>
                <p className="text-xl flex items-center gap-2">
                  <span>🏷️ 등급:</span>
                  <span className="font-bold text-red-500">F</span>
                  <span className="text-muted-foreground">(상위 20% 사이트보다 0.13g 더 배출)</span>
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
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* 하단 */}
        <Card className="bg-accent">
          <CardHeader>
            <CardTitle className="text-center text-xl">💡 이만큼 줄이면 이런 보상이 있어요!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white rounded-md shadow-sm">
                <p className="text-xl">📱</p>
                <p className="font-medium">스마트폰 5분 사용 절감</p>
              </div>
              <div className="p-4 bg-white rounded-md shadow-sm">
                <p className="text-xl">🌲</p>
                <p className="font-medium">나무 0.3그루</p>
              </div>
              <div className="p-4 bg-white rounded-md shadow-sm">
                <p className="text-xl">☕</p>
                <p className="font-medium">커피 0.5잔 절약</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CarbonResults;
