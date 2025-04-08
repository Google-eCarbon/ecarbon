import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import Layout from '@/components/Layout';

const CarbonStats = () => {
  // Mock data for the line chart
  const weeklyData = [
    { date: '4/1', value: 0.4 },
    { date: '4/2', value: 0.6 },
    { date: '4/3', value: 1.2 },
    { date: '4/4', value: 0.8 },
    { date: '4/5', value: 0.5 },
    { date: '4/6', value: 0.3 },
    { date: '4/7', value: 0.3 },
  ];
  
  // Mock data for pie chart
  const pieData = [
    { name: '이미지(WebP)', value: 80 },
    { name: 'JS 축소', value: 10 },
    { name: 'CSS 최적화', value: 7 },
    { name: '기타', value: 3 },
  ];
  
  const COLORS = ['#34d399', '#a7f3d0', '#065f46', '#10b981'];
  
  // Average line value
  const avgValue = weeklyData.reduce((sum, item) => sum + item.value, 0) / weeklyData.length;
  
  // Mock data for optimization results
  const optimizationResults = [
    { id: 1, originalName: 'image1.png', originalSize: '350KB', convertedName: 'image1.webp', convertedSize: '120KB', savings: '0.4g', status: 'success' },
    { id: 2, originalName: 'image2.jpg', originalSize: '520KB', convertedName: 'image2.webp', convertedSize: '175KB', savings: '0.6g', status: 'success' },
    { id: 3, originalName: 'image3.jpg', originalSize: '1.2MB', convertedName: 'image3.webp', convertedSize: '320KB', savings: '1.5g', status: 'success' },
    { id: 4, originalName: 'image4.png', originalSize: '290KB', convertedName: 'image4.webp', convertedSize: '95KB', savings: '0.3g', status: 'success' },
  ];
  
  // Mock user contributions data
  const userContributions = [
    { id: 1, user: '익명1 (x***)', savings: '6.1g' },
    { id: 2, user: '익명2 (k***s)', savings: '8.2g' },
    { id: 3, user: '익명3 (d***)', savings: '2.3g' },
    { id: 4, user: '익명4 (j***y)', savings: '4.8g' },
  ];
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* 상단 영역 – 헤더 & KPI 요약 */}
        <Card className="border-l-4 border-l-eco-green">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-eco-green">🌿</span> 탄소 절감 현황 | 사이트: example.com
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <h3 className="text-3xl font-bold">✅ 총 절감량: 12.4g</h3>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-muted-foreground">
                <span>- 지난 7일: 4.1g</span>
                <span>- 지난 30일: 12.4g</span>
                <span>- 전주 대비: <span className="text-green-500">▼ 7% 감소</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 중단 영역 - 차트들 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 절감 요인 비율 - 파이 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>📊 절감 요인 비율</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
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
          
          {/* 절감량 추이 그래프 */}
          <Card>
            <CardHeader>
              <CardTitle>📈 절감량 그래프 - 최근 7일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}g`} />
                    <ReferenceLine y={avgValue} stroke="#059669" strokeDasharray="3 3" label={{ value: '평균', position: 'right' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center text-sm text-muted-foreground">
                  <p>평균 절감량: 0.6g/day | 최대 피크: 1.2g on 4/3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 하단 영역 - 이미지 변환 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>🖼️ 이미지 최적화 결과</CardTitle>
            <CardDescription>총 10개 중 8개 변환 성공 (80%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {optimizationResults.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-green-50">✅ 변환 성공</Badge>
                    <span className="text-lg font-bold text-green-600">{item.savings}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>원본: {item.originalName} ({item.originalSize})</p>
                    <p>변환: {item.convertedName} ({item.convertedSize})</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 우측 사이드 - 사용자 기여 정보 (모바일에서는 하단에 표시됨) */}
        <Card>
          <CardHeader>
            <CardTitle>👥 사용자별 탄소 절감 기여도</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">사용자(ID 일부 마스킹)</th>
                  <th className="text-left py-2">절감량</th>
                </tr>
              </thead>
              <tbody>
                {userContributions.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.user}</td>
                    <td className="py-3 font-medium">{item.savings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium flex items-center gap-2">
                <span>👑</span> 이번 주 최고 기여자: 익명2 (8.2g)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CarbonStats;
