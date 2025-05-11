import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RankingItem {
  rank: number;
  domain: string;
  score: number;
  country: string;
}

type RankingType = 'overall' | 'sustainability';

interface RankingData {
  [key: string]: RankingItem[];
}

const rankings: RankingData = {
  overall: [
    { rank: 1, domain: 'donga.ac.kr', score: 95, country: 'South Korea' },
    { rank: 2, domain: 'korea.ac.kr', score: 92, country: 'South Korea' },
    { rank: 3, domain: 'yonsei.ac.kr', score: 88, country: 'South Korea' },
    { rank: 4, domain: 'snu.ac.kr', score: 85, country: 'South Korea' },
    { rank: 5, domain: 'inha.ac.kr', score: 82, country: 'South Korea' },
    { rank: 6, domain: 'chungbuk.ac.kr', score: 79, country: 'South Korea' },
    { rank: 7, domain: 'chungnam.ac.kr', score: 76, country: 'South Korea' },
    { rank: 8, domain: 'yonsei.ac.kr', score: 73, country: 'South Korea' },
    { rank: 9, domain: 'inha.ac.kr', score: 70, country: 'South Korea' },
    { rank: 10, domain: 'inha.ac.kr', score: 68, country: 'South Korea' }
  ],
  sustainability: [
    { rank: 1, domain: 'inha.ac.kr', score: 97, country: 'South Korea' },
    { rank: 2, domain: 'donga.ac.kr', score: 94, country: 'South Korea' },
    { rank: 3, domain: 'korea.ac.kr', score: 91, country: 'South Korea' },
    { rank: 4, domain: 'chungbuk.ac.kr', score: 88, country: 'South Korea' },
    { rank: 5, domain: 'chungnam.ac.kr', score: 85, country: 'South Korea' }
  ]
};

const rankingDescriptions = {
  overall: '모든 환경 지표를 종합한 기업별 순위입니다.',
  sustainability: '지속가능성 지표를 기준으로 한 순위입니다.'
};

const Ranking: React.FC = () => {
  const [rankingType, setRankingType] = useState<RankingType>('overall');

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-green-600';
    return 'text-green-700';
  };

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 text-white">
      <h1 className="text-4xl font-bold text-center mb-8">친환경 기업 순위</h1>
      
      <div className="flex justify-center mb-6">
        <Select
          value={rankingType}
          onValueChange={(value: RankingType) => setRankingType(value)}
        >
          <SelectTrigger className="w-[250px] bg-white/10 border-white/30 text-white">
            <SelectValue placeholder="순위 유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">종합 순위</SelectItem>
            <SelectItem value="sustainability">Sustainability</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white/10 p-4 mb-8 text-center">
        <p className="text-lg">{rankingDescriptions[rankingType]}</p>
      </Card>
      
      <Card className="bg-white/10 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white text-center">순위</TableHead>
                <TableHead className="text-white">도메인</TableHead>
                <TableHead className="text-white">국가</TableHead>
                <TableHead className="text-white text-center">점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings[rankingType].map((item) => (
                <TableRow key={item.rank} className="hover:bg-white/5">
                  <TableCell className="text-center font-bold">
                    {item.rank} {getMedalEmoji(item.rank)}
                  </TableCell>
                  <TableCell>{item.domain}</TableCell>
                  <TableCell>{item.country}</TableCell>
                  <TableCell className={`text-center font-semibold ${getScoreColor(item.score)}`}>
                    {item.score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <Card className="bg-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4">평가 기준</h3>
        <p className="mb-4 leading-relaxed">
          Greenee의 친환경 기업 평가는 에너지 사용, 물 사용, 폐기물 관리, 탄소 배출량 등 
          다양한 환경 지표를 분석하여 산출됩니다. 모든 평가는 검증된 데이터를 기반으로 
          공정하게 이루어집니다.
        </p>
        <p className="leading-relaxed">
          더 자세한 평가 방법론은{' '}
          <a href="#" className="text-green-400 hover:text-green-300 underline">
            여기
          </a>
          에서 확인하실 수 있습니다.
        </p>
      </Card>
    </div>
  );
};

export default Ranking;
