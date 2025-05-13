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
        <div className="flex justify-center items-center p-8">
          <RefreshCw className="animate-spin h-8 w-8" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 text-red-400">
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
                <td className={getGradeColor(item.grade)}>{item.grade}</td>
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
      
      <div className="filter-container">
        <select value={rankingType} onChange={handleFilterChange}>
          <option value="overall">종합 순위</option>
          <option value="sustainability">Sustainability</option>
        </select>
      </div>

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
    </div>
  );
};

export default Ranking;
