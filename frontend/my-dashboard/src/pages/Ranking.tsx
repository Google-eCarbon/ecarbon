import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from 'lucide-react';

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
        <div className="text-center p-8">
          <p>데이터가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-white text-center">순위</TableHead>
              <TableHead className="text-white">기관명</TableHead>
              <TableHead className="text-white">국가</TableHead>
              <TableHead className="text-white text-right">탄소 배출량</TableHead>
              <TableHead className="text-white text-center">등급</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((item) => (
              <TableRow key={item.rank} className="hover:bg-white/5">
                <TableCell className="text-center font-bold">
                  {getMedalEmoji(item.rank)} {item.rank}
                </TableCell>
                <TableCell>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {item.placeName}
                  </a>
                </TableCell>
                <TableCell>{item.country}</TableCell>
                <TableCell className="text-right">
                  {item.carbonEmission.toFixed(3)} g
                </TableCell>
                <TableCell className={`text-center font-semibold ${getGradeColor(item.grade)}`}>
                  {item.grade}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 text-white">
      <h1 className="text-4xl font-bold text-center mb-8">친환경 기관 순위</h1>
      
      {lastUpdate && (
        <Card className="bg-white/10 p-4 mb-8 text-center">
          <p className="text-sm text-gray-400">
            마지막 업데이트: {format(new Date(lastUpdate), 'yyyy-MM-dd')}
          </p>
        </Card>
      )}
      
      <Card className="bg-white/10 overflow-hidden mb-8">
        {renderRankingTable()}
      </Card>
      
      <Card className="bg-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4">평가 기준</h3>
        <p className="mb-4 leading-relaxed">
          Greenee의 친환경 기관 평가는 탄소 배출량을 기준으로 산출됩니다.
          모든 평가는 검증된 데이터를 기반으로 공정하게 이루어집니다.
        </p>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">등급 기준</h4>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-green-400">A등급: 우수한 탄소 배출 관리</li>
            <li className="text-green-500">B등급: 양호한 탄소 배출 관리</li>
            <li className="text-yellow-500">C등급: 보통수준의 탄소 배출 관리</li>
            <li className="text-orange-500">D등급: 개선이 필요한 탄소 배출 관리</li>
            <li className="text-red-500">F등급: 시급한 개선이 필요한 탄소 배출 관리</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Ranking;
