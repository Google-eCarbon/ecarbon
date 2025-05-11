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

const Ranking: React.FC = () => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
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
        setRankings(data.topEmissionPlaces || []);
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
      case 'A': return 'text-green-400';
      case 'B': return 'text-green-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      default: return 'text-red-500';
    }
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

    if (rankings.length === 0) {
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
            {rankings.map((item) => (
              <tr key={item.rank}>
                <td>
                  {getMedalEmoji(item.rank)} {item.rank}
                </td>
                <td>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="company-link"
                  >
                    {item.placeName}
                  </a>
                </td>
                <td>{item.country}</td>
                <td className="text-right">
                  {item.carbonEmission.toFixed(3)} g
                </td>
                <td className={getGradeColor(item.grade)}>
                  {item.grade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="ranking-container">
      <h1>친환경 기관 순위</h1>
      
      {lastUpdate && (
        <div className="last-update">
          마지막 업데이트: {format(new Date(lastUpdate), 'yyyy-MM-dd')}
        </div>
      )}
      
      <div className="ranking-table-wrapper">
        {renderRankingTable()}
      </div>
      
      <div className="ranking-info">
        <h3>평가 기준</h3>
        <p>
          Greenee의 친환경 기관 평가는 탄소 배출량을 기준으로 산출됩니다.
          모든 평가는 검증된 데이터를 기반으로 공정하게 이루어집니다.
        </p>
        <div className="grade-criteria">
          <h4>등급 기준</h4>
          <ul>
            <li className="grade-a">A등급: 우수한 탄소 배출 관리</li>
            <li className="grade-b">B등급: 양호한 탄소 배출 관리</li>
            <li className="grade-c">C등급: 보통수준의 탄소 배출 관리</li>
            <li className="grade-d">D등급: 개선이 필요한 탄소 배출 관리</li>
            <li className="grade-f">F등급: 시급한 개선이 필요한 탄소 배출 관리</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
