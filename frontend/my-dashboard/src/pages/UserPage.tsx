import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import './UserPage.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DateReductionBytes {
  date: string;
  reduction_bytes: number;
  reduction_grams: number;
}

interface DateReductionCount {
  date: string;
  count: number;
}

interface UserPageData {
  reduction_bytes_graph: DateReductionBytes[];
  reduction_count_graph: DateReductionCount[];
  total_reduction_bytes: number;
  total_reduction_count: number;
  total_reduction_grams: number;
}

type TabType = 'dashboard' | 'measurements' | 'profile';

interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
}

interface UserData {
  name: string;
  company: string;
  email: string;
  joinDate: string;
  measurements: {
    id: number;
    date: string;
    score: number;
    status: string;
  }[];
  rankings: {
    current: number;
    previous: number;
    industry: string;
    industryRank: number;
  };
  contributionData: {
    date: string;
    co2: number;
  }[];
  reductionData: {
    date: string;
    co2: number;
  }[];
}

const UserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [userPageData, setUserPageData] = useState<UserPageData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status === 401) {
          setUserInfo(null);
          return;
        }
        
        if (!response.ok) {
          throw new Error('사용자 정보 가져오기 실패');
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        setUserInfo(null);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchUserPageData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/page', {
          credentials: 'include'
        });

        if (response.status === 302) {
          // 리디렉션 응답 처리
          const redirectUrl = response.headers.get('Location');
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        }

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        setUserPageData(data);
      } catch (err) {
        console.error('사용자 페이지 데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPageData();
  }, []);
  
  // 실제 사용자 정보와 예시 데이터를 조합
  const userData: UserData = {
    name: userInfo?.username || '사용자',
    email: userInfo?.email || 'email@example.com',
    joinDate: '2025-05-10',

  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 프로필 업데이트 로직 구현
  };

  return (
    <div className="user-page-container">
      <div className="flex">
        {/* Sidebar */}
        <div className="user-sidebar">
          <div className="user-profile">
            <div className="user-avatar" />
            <h3>{userData.name}</h3>
            <p>{userData.company}</p>
          </div>
          
          <div className="sidebar-menu">
            {(['dashboard', 'measurements', 'profile'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === tab ? 'bg-white/15 border-l-2 border-white' : ''
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab === 'dashboard' && '대시보드'}
                {tab === 'measurements' && '측정 기록'}
                {tab === 'profile' && '프로필 설정'}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="user-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="dashboard-tab">CO2 기여 및 절감 통계</h2>
              <div className="graph-container">

                <div className="graph-card">
                  <h3>일별 절감 CO₂ 그래프</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer>
                      {loading ? (
                        <div className="flex h-full items-center justify-center">
                          <p>데이터 로딩 중...</p>
                        </div>
                      ) : error ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-red-500">{error}</p>
                        </div>
                      ) : userPageData && userPageData.reduction_bytes_graph.length > 0 ? (
                        <LineChart data={userPageData.reduction_bytes_graph}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="date" stroke="#ffffff80" />
                          <YAxis stroke="#ffffff80" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white' 
                            }}
                            formatter={(value) => [`${Number(value).toFixed(2)} g`, '절감 CO₂']} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="reduction_grams"
                            name="절감 CO₂"
                            stroke="#4ecdc4"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p>데이터가 없습니다</p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="graph-card">
                  <h3>기간별 절감 건수 그래프</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer>
                      {loading ? (
                        <div className="flex h-full items-center justify-center">
                          <p>데이터 로딩 중...</p>
                        </div>
                      ) : error ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-red-500">{error}</p>
                        </div>
                      ) : userPageData && userPageData.reduction_count_graph.length > 0 ? (
                        <LineChart data={userPageData.reduction_count_graph}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="date" stroke="#ffffff80" />
                          <YAxis stroke="#ffffff80" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white' 
                            }}
                            formatter={(value) => [`${value} 건`, '절감 건수']} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="count"
                            name="절감 건수"
                            stroke="#6dd47e"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p>데이터가 없습니다</p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">총 절감 바이트</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      {loading ? (
                        <p className="text-xl">로딩 중...</p>
                      ) : error ? (
                        <p className="text-xl text-red-500">데이터 로드 실패</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold mb-2">
                            {userPageData ? `${userPageData.total_reduction_bytes.toLocaleString()} bytes` : '0 bytes'}
                          </p>
                          <p className="text-sm text-white/80">총 절감 바이트</p>
                          <p className="text-lg font-semibold mt-4 text-green-400">
                            {userPageData ? `${userPageData.total_reduction_grams.toFixed(2)} g CO₂` : '0 g CO₂'}
                          </p>
                          <p className="text-sm text-white/80">총 절감 CO₂</p>
                        </>
                      )}
                    </div>

                  </div>
                </Card>

                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">총 절감 건수</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      {loading ? (
                        <p className="text-xl">로딩 중...</p>
                      ) : error ? (
                        <p className="text-xl text-red-500">데이터 로드 실패</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold mb-2">
                            {userPageData ? `${userPageData.total_reduction_count.toLocaleString()} 건` : '0 건'}
                          </p>
                          <p className="text-sm text-white/80">총 절감 건수</p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold mb-4">최근 절감 데이터</h3>
                <div className="space-y-4">
                  {loading ? (
                    <p>데이터 로딩 중...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : userPageData && userPageData.reduction_bytes_graph.length > 0 ? (
                    userPageData.reduction_bytes_graph.slice(-3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 text-sm">
                        <span className="text-white/60">{item.date}</span>
                        <span>{item.reduction_bytes.toLocaleString()} bytes 절감</span>
                        <span className="text-green-400">({item.reduction_grams.toFixed(2)} g CO₂)</span>
                      </div>
                    ))
                  ) : (
                    <p>최근 절감 데이터가 없습니다</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'measurements' && (
            <div>
              <h2 className="text-2xl font-bold mb-8 pb-2 border-b border-white/20">측정 기록</h2>
              
              <Card className="bg-zinc-900/50 mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">측정 ID</TableHead>
                      <TableHead className="text-white">날짜</TableHead>
                      <TableHead className="text-white">점수</TableHead>
                      <TableHead className="text-white">상태</TableHead>
                      <TableHead className="text-white">상세보기</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.measurements.map(measurement => (
                      <TableRow key={measurement.id}>
                        <TableCell>{measurement.id}</TableCell>
                        <TableCell>{measurement.date}</TableCell>
                        <TableCell>{measurement.score}</TableCell>
                        <TableCell>{measurement.status}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">보기</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <div className="text-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  새 측정 시작
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-8 pb-2 border-b border-white/20">프로필 설정</h2>
              
              <Card className="bg-zinc-900/50 p-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      defaultValue={userData.name}
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">회사명</Label>
                    <Input
                      id="company"
                      defaultValue={userData.company}
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      type="email"
                      id="email"
                      defaultValue={userData.email}
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호 변경</Label>
                    <Input
                      type="password"
                      id="password"
                      placeholder="새 비밀번호"
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">비밀번호 확인</Label>
                    <Input
                      type="password"
                      id="password-confirm"
                      placeholder="비밀번호 확인"
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button type="button" variant="outline">
                      취소
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      저장
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
