import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
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
  const [rankingType, 
    // setRankingType
  ] = useState<RankingType>('overall');
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
            setRankings({ overall: [], sustainability: [] });
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

  if (loading) {
    return (
      <div className="ranking-container">
        <p>Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="ranking-container">
      <h2>Carbon Emission Rankings</h2>
      <div className="ranking-description">
        <p>Overall rankings based on website environmental sustainability assessment.</p>
      </div>

      <div className="ranking-table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Institution</th>
              <th>Country</th>
              <th>Carbon Emissions (g)</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {rankings[rankingType].map((item) => (
              <tr key={item.rank}>
                <td>{item.rank}</td>
                <td>{item.placeName}</td>
                <td>{item.country}</td>
                <td>{item.carbonEmission.toFixed(2)}</td>
                <td>{item.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {lastUpdate && (
        <div className="last-update">
          updated at: {format(new Date(lastUpdate), 'yyyy-MM-dd')}
        </div>
      )}
      
      <div className="ranking-info">
        <h3>Assessment Criteria</h3>
        <p>
          Greenee's eco-friendly website assessment is based on W3C's WSG guidelines
          and website carbon footprint measurements.
        </p>
        <p>
          For more detailed methodology, click <a href="#">here</a>.
        </p>
      </div>
    </div>
  );
};

export default Ranking;
