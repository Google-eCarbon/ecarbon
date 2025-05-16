// import React, { useState, useEffect } from 'react';
// import Layout from '@/components/Layout';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { useNavigate } from 'react-router-dom';
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// // 색상 팔레트
// const COLORS = [
//   '#34d399', '#10b981', '#059669', '#047857', '#22d3ee',
//   '#2dd4bf', '#6ee7b7', '#a7f3d0', '#bbf7d0', '#064e3b'
// ];

// const Home: React.FC = () => {
//   const [url, setUrl] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [data, setData] = useState<any[]>([]);
//   const [result, setResult] = useState<any>(null);
//   const navigate = useNavigate();

//   // 로그인 상태 및 세션 확인
//   useEffect(() => {
//     fetch('/api/user/me', {
//       method: 'GET',
//       credentials: 'include',
//       redirect: 'manual' // 리디렉션 수동 처리
//     })
//     .then(response => {
//       // 리디렉션 응답 확인
//       if (response.status >= 300 && response.status < 400) {
//         const redirectUrl = response.headers.get('Location');
//         console.log('리디렉션 URL:', redirectUrl);
//         // 리디렉션 URL이 홈('/')이면 무시 (현재 페이지가 이미 홈)
//         if (redirectUrl && redirectUrl !== '/') {
//           window.location.href = redirectUrl;
//         }
//         return null;
//       }
      
//       if (response.ok) {
//         // 응답이 JSON인지 확인
//         const contentType = response.headers.get('content-type');
//         if (contentType && contentType.includes('application/json')) {
//           return response.json().catch(error => {
//             console.error('JSON 파싱 오류:', error);
//             return null;
//           });
//         } else {
//           console.warn('JSON이 아닌 응답 수신:', contentType);
//           return null;
//         }
//       }
      
//       return null;
//     })
//     .then(data => {
//       if (data) {
//         console.log('인증된 사용자:', data);
//         setIsAuthenticated(true);
        
//         // 인증된 사용자의 경우 이전 분석 결과 확인
//         return fetch('/api/carbon-analysis', {
//           method: 'HEAD',
//           credentials: 'include',
//           redirect: 'manual' // 리디렉션 수동 처리
//         });
//       }
//       return null;
//     })
//     .then(response => {
//       if (response) {
//         // 리디렉션 응답 확인
//         if (response.status >= 300 && response.status < 400) {
//           const redirectUrl = response.headers.get('Location');
//           // 리디렉션 URL이 홈('/')이면 무시 (현재 페이지가 이미 홈)
//           if (redirectUrl && redirectUrl !== '/') {
//             console.log('분석 결과 리디렉션:', redirectUrl);
//           }
//           return;
//         }
        
//         if (response.ok) {
//           // 이전 분석 결과가 있으면 carbon-analysis 페이지로 이동
//           navigate('/carbon-analysis');
//         }
//         // 분석 결과가 없으면 URL 입력 화면 표시 (상태 유지)
//       }
//     })
//     .catch(error => {
//       console.error('인증 확인 오류:', error);
//     });
//   }, [navigate]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!url) return;
    
//     setIsLoading(true);
//     setError(null);
//     setResult(null);
//     setData([]);
    
//     try {
//       // 1. 분석 시작 요청
//       try {
//         const startRes = await fetch(`/api/start-analysis?url=${encodeURIComponent(url)}`, { 
//           method: 'POST',
//           credentials: 'include'
//         });
        
//         if (!startRes.ok) {
//           const errorText = await startRes.text();
//           throw new Error(`분석 시작 실패: ${errorText}`);
//         }
//       } catch (startErr) {
//         if (startErr instanceof TypeError && startErr.message === 'Failed to fetch') {
//           throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
//         }
//         throw startErr;
//       }

//       // 잠시 대기 후 분석 결과 요청
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // 2. 분석 결과 요청
//       try {
//         const analysisRes = await fetch('/api/carbon-analysis', { 
//           method: 'GET',
//           credentials: 'include'
//         });
        
//         if (!analysisRes.ok) {
//           const errorText = await analysisRes.text();
//           throw new Error(`분석 결과 조회 실패: ${errorText}`);
//         }
        
//         const json = await analysisRes.json();
//         setResult(json);
        
//         // 요소별 비중 데이터 변환
//         if (json.resourcePercentage) {
//           setData(json.resourcePercentage.map((item: any) => ({
//             name: item.resourceType,
//             value: item.percentage
//           })));
//         }
//       } catch (analysisErr) {
//         if (analysisErr instanceof TypeError && analysisErr.message === 'Failed to fetch') {
//           throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
//         }
//         throw analysisErr;
//       }
//     } catch (err) {
//       console.error('분석 오류:', err);
//       setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Layout>
//       <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 text-white">
//         <h1 className="text-4xl font-bold text-center mb-10">웹사이트 탄소 배출량 측정</h1>
        
//         <Card className="bg-white/10 p-8 rounded-xl">
//           <p className="text-center text-lg mb-8 max-w-2xl mx-auto">
//             웹사이트 URL을 입력하면 해당 페이지의 탄소 배출량을 측정합니다. 
//             친환경적인 웹을 만들기 위한 첫 걸음을 시작하세요.
//           </p>
          
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="flex max-w-2xl mx-auto">
//               <input
//                 type="url"
//                 className="flex-1 rounded-r-none bg-white/10 border-white/30 text-white px-3 py-2"
//                 placeholder="https://example.com"
//                 value={url}
//                 onChange={e => setUrl(e.target.value)}
//                 required
//               />
//               <Button 
//                 type="submit" 
//                 disabled={isLoading}
//                 className="rounded-l-none bg-white text-green-700 hover:bg-white/90 hover:text-green-800"
//               >
//                 {isLoading ? '측정 중...' : '측정하기'}
//               </Button>
//             </div>
            
//             {error && (
//               <p className="text-red-400 text-center mt-4">{error}</p>
//             )}
            
//             {isLoading && (
//               <div className="flex flex-col items-center mt-8">
//                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
//                 <p className="text-white text-center">
//                   웹사이트를 분석하고 있습니다...
//                 </p>
//               </div>
//             )}
//           </form>
//         </Card>

//         {/* 분석 결과 표시 */}
//         {result && (
//           <div className="space-y-8 mt-8">
//             {/* 상단 */}
//             <Card className="border-l-4 border-l-eco-green">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-2xl flex items-center gap-2">
//                   <span className="text-eco-green">🌿</span>
//                   탄소 측정 결과 | 사이트: {result.url}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <p className="text-xl flex items-center gap-2">
//                       <span>🌍 총 배출량:</span>
//                       <span className="font-bold">{result.carbonEmission}g</span>
//                       <span className="text-muted-foreground">(전체 평균: {result.globalAvgCarbon}g)</span>
//                     </p>
//                     <p className="text-xl flex items-center gap-2">
//                       <span>🏷️ 등급:</span>
//                       <span className="font-bold text-red-500">{result.grade}</span>
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* 중단 - 파이 차트 */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>요소별 비중</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex flex-col items-center gap-6">
//                   <div className="h-[400px] w-full max-w-[500px] flex justify-center items-center mx-auto">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={data}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           outerRadius={170}
//                           fill="#8884d8"
//                           dataKey="value"
//                         >
//                           {data.map((_, index) => (
//                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                   {/* 범례를 한 줄로, 색상+요소+비율을 한 번에 표시 */}
//                   <div className="flex flex-wrap justify-center gap-3 mt-2">
//                     {data.map((entry, index) => (
//                       <span key={entry.name} className="flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-gray-100 border">
//                         <span style={{ display: 'inline-block', width: 16, height: 16, background: COLORS[index % COLORS.length], borderRadius: 4, marginRight: 4 }} />
//                         <span style={{ color: COLORS[index % COLORS.length], fontWeight: 600 }}>
//                           {entry.name}
//                         </span>
//                         <span className="ml-1">({entry.value.toFixed(1)}%)</span>
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* 하단 - 탄소 절감 효과 */}
//             <Card className="bg-accent">
//               <CardHeader>
//                 <CardTitle className="text-center text-xl">💡 이만큼 줄이면 이런 보상이 있어요!</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
//                   <div className="p-4 bg-white rounded-md shadow-sm">
//                     <p className="text-xl">📱</p>
//                     <p className="font-medium">
//                       스마트폰 {result.carbonEquivalents?.phoneCharges?.toLocaleString() ?? '-'}회 충전
//                     </p>
//                   </div>
//                   <div className="p-4 bg-white rounded-md shadow-sm">
//                     <p className="text-xl">🌲</p>
//                     <p className="font-medium">
//                       나무 {result.carbonEquivalents?.trees?.toLocaleString() ?? '-'}그루
//                     </p>
//                   </div>
//                   <div className="p-4 bg-white rounded-md shadow-sm">
//                     <p className="text-xl">☕</p>
//                     <p className="font-medium">
//                       커피 {result.carbonEquivalents?.coffeeCups?.toLocaleString() ?? '-'}잔
//                     </p>
//                   </div>
//                 </div>
//                 <p className="mt-6 text-center text-sm text-muted-foreground">
//                   ※ 하루 10,000명 방문 기준, 1년 동안 절감할 수 있는 탄소량입니다.
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         <div className="mt-10 text-center text-gray-400 text-sm">
//           &copy; {new Date().getFullYear()} eCarbon. All rights reserved.
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Home;
