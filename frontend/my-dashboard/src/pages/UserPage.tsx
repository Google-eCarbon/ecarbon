import React, { useState, useEffect } from 'react';
import './UserPage.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import goldMedal from '../assets/gold_medal.png';
import silverMedal from '../assets/silver_medal.png';
import starMedal from '../assets/star_medal.png';

// API URL을 환경 변수로 설정합니다
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

interface Measurement {
  id: string;
  date: string;
  score: number;
  status: string;
}

interface UserData {
  username: string;
  email: string;
  id: string;
  name: string;
  company: string;
  measurements: Measurement[];
}

// 가짜 데이터 생성 함수
const generateMockData = (): UserPageData => {
  const today = new Date();
  const mockReductionBytesGraph: DateReductionBytes[] = [];
  const mockReductionCountGraph: DateReductionCount[] = [];
  
  // 최근 7일간의 가짜 데이터 생성
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // 랜덤 데이터 생성
    const reductionBytes = Math.floor(Math.random() * 500000) + 100000;
    const reductionGrams = +(reductionBytes * 0.00000033).toFixed(2);
    const count = Math.floor(Math.random() * 15) + 5;
    
    mockReductionBytesGraph.push({
      date: dateString,
      reduction_bytes: reductionBytes,
      reduction_grams: reductionGrams
    });
    
    mockReductionCountGraph.push({
      date: dateString,
      count: count
    });
  }
  
  // 총합 계산
  const totalReductionBytes = mockReductionBytesGraph.reduce((sum, item) => sum + item.reduction_bytes, 0);
  const totalReductionGrams = mockReductionBytesGraph.reduce((sum, item) => sum + item.reduction_grams, 0);
  const totalReductionCount = mockReductionCountGraph.reduce((sum, item) => sum + item.count, 0);
  
  return {
    reduction_bytes_graph: mockReductionBytesGraph,
    reduction_count_graph: mockReductionCountGraph,
    total_reduction_bytes: totalReductionBytes,
    total_reduction_count: totalReductionCount,
    total_reduction_grams: totalReductionGrams
  };
};

// 가짜 사용자 정보
const mockUserInfo: UserInfo = {
  id: 'mock-user-id',
  username: 'Guest User',
  email: 'guest@example.com'
};

// 가짜 사용자 데이터
const mockUserData: UserData = {
  username: 'Guest User',
  email: 'guest@example.com',
  id: 'mock-user-id',
  name: 'Guest User',
  company: 'Demo Company',
  measurements: [
    { id: '1', date: '2025-05-15', score: 85, status: 'Completed' },
    { id: '2', date: '2025-05-10', score: 92, status: 'Completed' },
    { id: '3', date: '2025-05-05', score: 78, status: 'Completed' }
  ]
};

const UserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [userPageData, setUserPageData] = useState<UserPageData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userData, setUserData] = useState<UserData>({  
    username: '',
    email: '',
    id: '',
    name: '',
    company: '',
    measurements: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.log('로그인 정보가 없습니다. 가짜 데이터를 사용합니다.');
          setUserInfo(mockUserInfo);
          setUserData(mockUserData);
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();
        setUserInfo(data);
        setIsLoggedIn(true);
        
        // 실제 사용자 데이터 설정
        setUserData({
          username: data.username || '',
          email: data.email || '',
          id: data.id || '',
          name: data.username || '',
          company: 'My Company',
          measurements: [
            { id: '1', date: '2025-05-15', score: 85, status: 'Completed' },
            { id: '2', date: '2025-05-10', score: 92, status: 'Completed' },
            { id: '3', date: '2025-05-05', score: 78, status: 'Completed' }
          ]
        });
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        console.log('로그인 정보가 없습니다. 가짜 데이터를 사용합니다.');
        setUserInfo(mockUserInfo);
        setUserData(mockUserData);
        setIsLoggedIn(false);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchUserPageData = async () => {
      try {
        setLoading(true);
        
        if (!isLoggedIn) {
          // 로그인하지 않은 경우 가짜 데이터 사용
          const mockData = generateMockData();
          setUserPageData(mockData);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/user/page`, {
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
        
        // API 요청 실패 시 가짜 데이터 사용
        const mockData = generateMockData();
        setUserPageData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPageData();
  }, [isLoggedIn]);
  


  return (
    <div className="user-page-container">
        <div className="user-sidebar">
          <div className="user-profile">
            <div className="user-avatar"></div>
            <h3>{userInfo?.username || '사용자'}</h3> 
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
                            name="conversion count"
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
                      <span className="value">{Math.round(userPageData?.total_reduction_count || 0)} times</span>
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
                            name="CO₂ Reduction"
                            stroke="#4ecdc4"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p>no data</p>
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
