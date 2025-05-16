// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
// import Layout from '@/components/Layout';

// // 한 계열(emerald/green)로 통일된 색상 팔레트
// const COLORS = [
//   '#34d399', // emerald-400
//   '#10b981', // emerald-500
//   '#059669', // emerald-600
//   '#047857', // emerald-700
//   '#22d3ee', // cyan-400
//   '#2dd4bf', // teal-400
//   '#6ee7b7', // emerald-300
//   '#a7f3d0', // emerald-200
//   '#bbf7d0', // emerald-100
//   '#064e3b', // emerald-900
// ];

// const CarbonStats = () => {
//   // 사용자별 탄소 절감 기여도는 가짜 데이터로 유지
//   const userContributions = [
//     { id: 1, user: '익명1 (x***)', savings: '6.1g' },
//     { id: 2, user: '익명2 (k***s)', savings: '8.2g' },
//     { id: 3, user: '익명3 (d***)', savings: '2.3g' },
//     { id: 4, user: '익명4 (j***y)', savings: '4.8g' },
//   ];

//   // 나머지 데이터는 API에서 가져옴
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [data, setData] = useState<any>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch('/api/carbon-savings');
//         if (!res.ok) throw new Error('API 요청 실패');
//         const json = await res.json();
//         setData(json);
//       } catch (e: any) {
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const totalSavings = data?.totalSavingsInGrams ?? 0;
//   const url = data?.url ?? '';

//   const weeklyData = (data?.weeklySavingsGraph ?? [])
//     .map((item: any) => ({
//       date: item.weekStartDate,
//       value: item.savingsInGrams,
//     }))
//     .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

//   const avgValue = weeklyData.length > 0 ? weeklyData.reduce((sum: number, item: any) => sum + item.value, 0) / weeklyData.length : 0;
//   const pieData = (data?.resourceSavingsData ?? []).map((item: any) => ({
//     name: item.resourceType,
//     value: item.savingsPercentage,
//   }));
//   const optimizationResults = (data?.imageOptimizations ?? []).map((item: any, idx: number) => ({
//     id: idx,
//     originalName: item.originalFileName,
//     originalSize: `${(item.originalSizeBytes / 1024).toFixed(0)}KB`,
//     convertedName: item.optimizedFileName,
//     convertedSize: item.optimizedSizeBytes > 0 ? `${(item.optimizedSizeBytes / 1024).toFixed(0)}KB` : '-',
//     savings: item.optimizedSizeBytes > 0 ? `${((item.originalSizeBytes - item.optimizedSizeBytes) / 1024 / 1024).toFixed(2)}g` : '-',
//     status: item.success ? 'success' : 'fail',
//   }));

//   return (
//     <Layout>
//       <div className="space-y-8">
//         {/* 상단 영역 – 헤더 & KPI 요약 */}
//         <Card className="border-l-4 border-l-eco-green">
//           <CardHeader>
//             <CardTitle className="text-2xl flex items-center gap-2">
//               <span className="text-eco-green">🌿</span> 탄소 절감 현황 | 사이트: {url || '로딩 중...'}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div>
//                 <h3 className="text-3xl font-bold">✅ 총 절감량: {totalSavings}g</h3>
//               </div>
//               {loading && <div>로딩 중...</div>}
//               {error && <div className="text-red-500">{error}</div>}
//             </div>
//           </CardContent>
//         </Card>

//         {/* 절감량 변화 그래프 */}
//         <Card>
//           <CardHeader>
//             <CardTitle>📈 절감량 추이</CardTitle>
//             <CardDescription>절감량(g) 변화</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <ReferenceLine y={avgValue} label="평균" stroke="#4ade80" strokeDasharray="3 3" />
//                   <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* 리소스별 절감 비율 파이차트 */}
//         <Card>
//           <CardHeader>
//             <CardTitle>🍰 리소스별 절감 비율</CardTitle>
//             <CardDescription>이미지, JS, CSS 등 리소스별 절감 비중</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col items-center gap-6">
//               <div className="h-[600px] w-full max-w-[800px] flex justify-center items-center mx-auto">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart margin={{ top: 50, right: 150, bottom: 50, left: 150 }}>
//                     <Pie
//                       data={pieData}
//                       dataKey="value"
//                       nameKey="name"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={170}
//                       fill="#8884d8"
//                       labelLine={true}
//                       label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
//                     >
//                       {pieData.map((entry: any, index: number) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//               {/* 범례를 한 줄로, 색상+요소+비율을 한 번에 표시 */}
//               <div className="flex flex-wrap justify-center gap-3 mt-2">
//                 {pieData.map((entry: any, index: number) => (
//                   <span key={entry.name} className="flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-gray-100 border">
//                     <span style={{ display: 'inline-block', width: 16, height: 16, background: COLORS[index % COLORS.length], borderRadius: 4, marginRight: 4 }} />
//                     <span style={{ color: COLORS[index % COLORS.length], fontWeight: 600 }}>
//                       {entry.name}
//                     </span>
//                     <span className="ml-1">({entry.value.toFixed(1)}%)</span>
//                   </span>
//                 ))}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* 하단 영역 - 이미지 변환 내역 */}
//         <Card>
//           <CardHeader>
//             <CardTitle>🖼️ 이미지 최적화 결과</CardTitle>
//             <CardDescription>
//               {optimizationResults.length > 0
//                 ? `총 ${optimizationResults.length}개 중 ${optimizationResults.filter((item: any) => item.status === 'success').length}개 변환 성공 (${Math.round(optimizationResults.filter((item: any) => item.status === 'success').length / optimizationResults.length * 100)}%)`
//                 : '데이터 없음'}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               {optimizationResults.map((item: any) => (
//                 <div
//                   key={item.id}
//                   className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer"
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <Badge variant="outline" className={item.status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
//                       {item.status === 'success' ? '✅ 변환 성공' : '❌ 변환 실패'}
//                     </Badge>
//                     <span className={item.status === 'success' ? 'text-lg font-bold text-green-600' : 'text-lg font-bold text-red-600'}>{item.savings}</span>
//                   </div>
//                   <div className="space-y-1 text-sm">
//                     <p>원본: {item.originalName} ({item.originalSize})</p>
//                     <p>변환: {item.convertedName} ({item.convertedSize})</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* 우측 사이드 - 사용자 기여 정보 (모바일에서는 하단에 표시됨) */}
//         <Card>
//           <CardHeader>
//             <CardTitle>👥 사용자별 탄소 절감 기여도</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left py-2">사용자(ID 일부 마스킹)</th>
//                   <th className="text-left py-2">절감량</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {userContributions.map((item) => (
//                   <tr key={item.id} className="border-b">
//                     <td className="py-3">{item.user}</td>
//                     <td className="py-3 font-medium">{item.savings}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
//               <p className="font-medium flex items-center gap-2">
//                 <span>👑</span> 이번 주 최고 기여자: 익명2 (8.2g)
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </Layout>
//   );
// };

// export default CarbonStats;
