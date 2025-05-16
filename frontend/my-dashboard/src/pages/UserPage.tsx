import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import './UserPage.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import goldMedal from '../assets/gold_medal.png';
import silverMedal from '../assets/silver_medal.png';
import starMedal from '../assets/star_medal.png';

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
        <div className="user-sidebar">
          <div className="user-profile">
            <div className="user-avatar"></div>
            <h3>{userData.name}</h3>
            <p>{userData.company}</p> 
          </div>

          <div className="sidebar-menu">
            <button 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={activeTab === 'measurements' ? 'active' : ''} 
              onClick={() => setActiveTab('measurements')}
            >
              Measurements
            </button>
            <button 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
            </button>
          </div>
        </div>

        <div className="user-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <h2>Webp Conversion and CO2 Reduction Statistics</h2>

              <div className="stats-container">
                <div className="stats-card contribution-card">
                  <h3>Webp Conversion Count</h3>
                  <div className="chart-section">
                    <ResponsiveContainer width="100%" height={200}>
                      {loading ? (
                        <div className="flex h-full items-center justify-center">
                          <p>loading...</p>
                        </div>
                      ) : error ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-red-500">{error}</p>
                        </div>
                      ) : userPageData && userPageData.reduction_count_graph.length > 0 ? (
                        <LineChart
                          data={userPageData.reduction_count_graph}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid stroke="#FFFFFF" strokeOpacity={0.1} strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#FFFFFF" 
                            tick={{ fill: '#FFFFFF' }}
                          />
                          <YAxis 
                            stroke="#FFFFFF" 
                            tick={{ fill: '#FFFFFF' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                              color: 'white', 
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                            }} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="count"
                            name="절감 건수"
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
                  <div className="stats-info">
                    <div className="total-value">
                      <span className="label">Webp Conversions</span>
                      <span className="value">{userPageData?.total_reduction_count.toFixed(2)} times</span>
                    </div>
                    <div className="rank-info">
                      <span className="label">Conversion Rank</span>
                      <div className="rank-value">
                        <span>2nd out of 7</span>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="graph-card">
                  <h3>CO2 Reduction Graph (g)</h3>  
                  <div className="chart-section">
                  <ResponsiveContainer width="100%" height={200}>
                      {loading ? (
                        <div className="flex h-full items-center justify-center">
                          <p>loading...</p>
                        </div>
                      ) : error ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-red-500">{error}</p>
                        </div>
                      ) : userPageData && userPageData.reduction_bytes_graph.length > 0 ? (
                        <LineChart
                          data={userPageData.reduction_bytes_graph}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid stroke="#FFFFFF" strokeOpacity={0.1} strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#FFFFFF" 
                            tick={{ fill: '#FFFFFF' }}
                          />
                          <YAxis 
                            stroke="#FFFFFF" 
                            tick={{ fill: '#FFFFFF' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                              color: 'white', 
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                            }} 
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
                  <div className="stats-info">
                    <div className="total-value">
                      <span className="label">Total Carbon Reduction</span>
                      <span className="value">{userPageData?.total_reduction_grams.toFixed(2)} g</span>
                    </div>
                    <div className="rank-info">
                      <span className="label">Reduction Rank</span>
                      <div className="rank-value">
                        <span>2nd out of 7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recent-activities">
                <h3>Recent Activities</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-date">2025-05-10</span>
                    <span className="activity-description">Recognized as top 10% carbon reducer</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-date">2025-04-28</span>
                    <span className="activity-description">Recognized as top 20% carbon reducer</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-date">2025-04-27</span>
                    <span className="activity-description">Installed UseWebp software.</span>
                  </div>
              </div>
            </div>

            <div className="medals-section">
              <div className="medal-item">
                <img src={goldMedal} alt="First Carbon Reducer" className="medal-image" />
                <p className="medal-title">First Carbon Reducer</p>
                <p className="medal-desc">First Website Carbon Reducer</p>
              </div>
              <div className="medal-item">
                <img src={silverMedal} alt="Monthly Reducer" className="medal-image" />
                <p className="medal-title">Monthly Reducer</p>
                <p className="medal-desc">5+ Reductions in a Month</p>
              </div>
              <div className="medal-item">
                <img src={starMedal} alt="Carbon Master" className="medal-image" />
                <p className="medal-title">Carbon Master</p>
                <p className="medal-desc">100g+ Carbon Reducer</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'measurements' && (
          <div className="measurements-tab">
            <h2>Measurement History</h2>
            
            <table className="measurements-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {userData.measurements.map(measurement => (
                  <tr key={measurement.id}>
                    <td>{measurement.id}</td>
                    <td>{measurement.date}</td>
                    <td>{measurement.score}</td>
                    <td>{measurement.status}</td>
                    <td><button className="view-btn">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="new-measurement">
              <button className="new-measurement-btn">Start New Measurement</button>
            </div>
          </div>
        )}

{activeTab === 'profile' && (
          <div className="profile-tab">
            <h2>Profile Settings</h2>
            
            <form className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" defaultValue={userData.name} />
              </div>
              
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input type="text" id="company" defaultValue={userData.company} />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" defaultValue={userData.email} />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Change Password</label>
                <input type="password" id="password" placeholder="New Password" />
              </div>
              
              <div className="form-group">
                <label htmlFor="password-confirm">Confirm Password</label>
                <input type="password" id="password-confirm" placeholder="Confirm Password" />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
