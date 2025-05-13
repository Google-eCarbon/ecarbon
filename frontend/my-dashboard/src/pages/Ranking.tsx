import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { RefreshCw } from 'lucide-react';
import './Ranking.css';

interface RankingItem {
  rank: number;
  url: string;
  placeName: string;
  country: string;
  carbonEmission: number;
  grade: string;
}

type RankingType = 'overall' | 'sustainability';

interface RankingState {
  overall: RankingItem[];
  sustainability: RankingItem[];
}

const Ranking: React.FC = () => {
  const [rankings, setRankings] = useState<RankingState>({
    overall: [],
    sustainability: []
  });
  const [rankingType, setRankingType] = useState<RankingType>('overall');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ranking', { credentials: 'include' });
        
        if (!res.ok) {
          if (res.status === 204) {
            setRankings([]);
            setLastUpdate(null);
            return;
          }
          throw new Error('랭킹 데이터를 불러오는데 실패했습니다');
        }
        
        const data = await res.json();
        // 백엔드에서 받은 데이터를 overall 카테고리에 할당
        setRankings({
          overall: data.topEmissionPlaces || [],
          sustainability: [] // 현재 백엔드에서 지원하지 않음
        });
        setLastUpdate(data.updatedAt);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'text-green-400';
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'E': return 'text-red-400';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRankingType(e.target.value as RankingType);
  };

  const renderRankingTable = () => {
    if (loading) {
      return (
        <div className="loading">
          <RefreshCw className="animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
        </div>
      );
    }

    if (!rankings[rankingType] || rankings[rankingType].length === 0) {
      return (
        <div className="no-data">
          <p>데이터가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="ranking-table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>기관명</th>
              <th>국가</th>
              <th>탄소 배출량</th>
              <th>등급</th>
            </tr>
          </thead>
          <tbody>
            {rankings[rankingType].map((item) => (
              <tr key={item.rank}>
                <td>
                  <span className="rank-number">
                    {getMedalEmoji(item.rank)}
                    {item.rank}
                  </span>
                </td>
                <td>{item.placeName}</td>
                <td>{item.country}</td>
                <td>{item.carbonEmission.toFixed(2)}</td>
                <td className={`grade ${item.grade.toLowerCase().replace('+', '-plus')}`}>{item.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="ranking-container">
      <h1>친환경 기업 순위</h1>
      
      <div className="ranking-description">
        {rankingType === 'overall' && <p>모든 환경 지표를 종합한 기업별 순위입니다.</p>}
        {rankingType === 'sustainability' && <p>지속가능성 및 환경 보호 활동을 기준으로 한 순위입니다.</p>}
      </div>
      
      {lastUpdate && (
        <div className="last-update">
          마지막 업데이트: {format(new Date(lastUpdate), 'yyyy-MM-dd')}
        </div>
      )}
      
      {renderRankingTable()}
      
      <div className="ranking-info">
        <h3>평가 기준</h3>
        <p>
          Greenee의 친환경 기업 평가는 에너지 사용, 물 사용, 폐기물 관리, 탄소 배출량 등 
          다양한 환경 지표를 분석하여 산출됩니다. 모든 평가는 검증된 데이터를 기반으로 
          공정하게 이루어집니다.
        </p>
        <p>
          더 자세한 평가 방법론은 <a href="#">여기</a>에서 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default Ranking;
