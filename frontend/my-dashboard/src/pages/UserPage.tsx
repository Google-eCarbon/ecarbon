import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Measurement {
  id: number;
  date: string;
  score: number;
  status: string;
}

interface ContributionData {
  date: string;
  co2: number;
}

interface Rankings {
  current: number;
  previous: number;
  industry: string;
  industryRank: number;
}

interface UserData {
  name: string;
  company: string;
  email: string;
  joinDate: string;
  measurements: Measurement[];
  rankings: Rankings;
  contributionData: ContributionData[];
  reductionData: ContributionData[];
}

type TabType = 'dashboard' | 'measurements' | 'profile';

const UserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // 예시 데이터 - 실제로는 로그인한 사용자 정보와 데이터를 불러와야 함
  const userData: UserData = {
    name: 'ChoRokee',
    company: 'Greenee',
    email: 'green@greenee.co.kr',
    joinDate: '2025-05-10',
    measurements: [
      { id: 1, date: '2025-05-10', score: 85, status: '완료' },
      { id: 2, date: '2025-05-09', score: 82, status: '완료' },
      { id: 3, date: '2025-05-08', score: 78, status: '완료' }
    ],
    rankings: {
      current: 1,
      previous: 2,
      industry: 'IT',
      industryRank: 1
    },
    contributionData: [
      { date: '2025-05-04', co2: 22.8 },
      { date: '2025-05-05', co2: 15.7 },
      { date: '2025-05-06', co2: 27.2 },
      { date: '2025-05-07', co2: 32.2 },
      { date: '2025-05-08', co2: 25.8 },
      { date: '2025-05-09', co2: 15.2 },
      { date: '2025-05-10', co2: 20.1 }
    ],
    reductionData: [
      { date: '2025-05-04', co2: 12.1 },
      { date: '2025-05-05', co2: 10.7 },
      { date: '2025-05-06', co2: 18.3 },
      { date: '2025-05-07', co2: 52.2 },
      { date: '2025-05-08', co2: 16.2 },
      { date: '2025-05-09', co2: 34.2 },
      { date: '2025-05-10', co2: 44.2 }
    ]
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 프로필 업데이트 로직 구현
  };

  return (
    <div className="min-h-screen pt-20 bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed w-64 h-[calc(100vh-80px)] bg-zinc-900 p-6 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">{userData.name}</h3>
            <p className="text-sm text-white/80">{userData.company}</p>
          </div>
          
          <div className="space-y-2">
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
        <div className="ml-64 flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-8 pb-2 border-b border-white/20">CO2 기여 및 절감 통계</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">CO2 기여량 그래프 (g)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer>
                      <LineChart data={userData.contributionData}>
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
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="co2"
                          name="CO2 기여량"
                          stroke="#6dd47e"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">CO2 절감량 그래프 (g)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer>
                      <LineChart data={userData.reductionData}>
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
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="co2"
                          name="CO2 절감량"
                          stroke="#4ecdc4"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">기여량</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-bold mb-2">
                        {userData.contributionData.reduce((sum, item) => sum + item.co2, 0).toFixed(1)} g
                      </p>
                      <p className="text-sm text-white/80">총 탄소 기여량</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-2">3<span className="text-lg">위</span></p>
                      <p className="text-sm text-white/80">기여량 순위</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">절감량</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-bold mb-2">
                        {userData.reductionData.reduce((sum, item) => sum + item.co2, 0).toFixed(1)} g
                      </p>
                      <p className="text-sm text-white/80">총 탄소 절감량</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-2">{userData.rankings.current}<span className="text-lg">위</span></p>
                      <p className="text-sm text-white/80">절감량 순위</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
                <div className="space-y-4">
                  {[
                    { date: '2024-05-01', description: '환경 영향 측정을 완료했습니다.' },
                    { date: '2024-04-15', description: '에너지 절약 목표를 설정했습니다.' },
                    { date: '2024-03-12', description: '환경 영향 측정을 완료했습니다.' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 text-sm">
                      <span className="text-white/60">{activity.date}</span>
                      <span>{activity.description}</span>
                    </div>
                  ))}
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
