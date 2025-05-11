import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface MeasurementResult {
  url: string;
  carbonScore: number;
  co2Grams: number;
  cleanerThan: number;
  tips: string[];
}

const Measure: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 웹사이트 탄소 배출량 측정 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const carbonScore = Math.floor(Math.random() * 91) + 10;
      const co2Grams = Number((Math.random() * 5).toFixed(2));
      
      setResult({
        url,
        carbonScore,
        co2Grams,
        cleanerThan: Math.floor(Math.random() * 91) + 10,
        tips: [
          "이미지 최적화로 페이지 크기 줄이기",
          "서버 위치를 사용자에게 가깝게 설정",
          "화면 크기에 맞게 이미지 제공",
          "불필요한 JavaScript 제거",
          "지속 가능한 호스팅 서비스 사용"
        ]
      });

      toast({
        title: "측정 완료",
        description: "웹사이트의 탄소 배출량 측정이 완료되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "측정 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    // 실제 공유 기능 구현 필요
    toast({
      title: "공유하기",
      description: `${platform}로 결과를 공유합니다.`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 text-white">
      <h1 className="text-4xl font-bold text-center mb-10">웹사이트 탄소 배출량 측정</h1>
      
      {!result ? (
        <Card className="bg-white/10 p-8 rounded-xl">
          <p className="text-center text-lg mb-8 max-w-2xl mx-auto">
            웹사이트 URL을 입력하면 해당 페이지의 탄소 배출량을 측정합니다. 
            친환경적인 웹을 만들기 위한 첫 걸음을 시작하세요.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex max-w-2xl mx-auto">
              <Input
                type="url"
                placeholder="https://greenee.co.kr"
                value={url}
                onChange={handleUrlChange}
                required
                className="rounded-r-none bg-white/10 border-white/30 text-white"
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="rounded-l-none bg-white text-green-700 hover:bg-white/90 hover:text-green-800"
              >
                {isLoading ? '측정 중...' : '측정하기'}
              </Button>
            </div>
            
            {isLoading && (
              <div className="flex flex-col items-center mt-8">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <p>측정 중입니다. 잠시만 기다려 주세요...</p>
              </div>
            )}
          </form>
        </Card>
      ) : (
        <Card className="bg-white/10 p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">{result.url} 측정 결과</h2>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-700"
            >
              다시 측정하기
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-8 mb-12 md:grid-cols-1">
            <Card className="bg-white/10 p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-white/30" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-white"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos(result.carbonScore / 100 * 2 * Math.PI)}% ${50 - 50 * Math.sin(result.carbonScore / 100 * 2 * Math.PI)}%, 50% 0)`
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                  {result.carbonScore}
                </div>
              </div>
              <p className="text-lg">탄소 점수</p>
            </Card>
            
            <Card className="bg-white/10 p-6 text-center">
              <h3 className="text-3xl font-bold mb-2">{result.co2Grams}g</h3>
              <p className="text-lg">CO₂ 배출량</p>
            </Card>
            
            <Card className="bg-white/10 p-6 text-center">
              <h3 className="text-3xl font-bold mb-2">{result.cleanerThan}%</h3>
              <p className="text-lg">다른 웹사이트보다 깨끗함</p>
            </Card>
          </div>
          
          <Card className="bg-white/10 p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">개선 방안</h3>
            <ul className="space-y-2">
              {result.tips.map((tip, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
          
          <div className="text-center">
            <p className="mb-4">이 결과를 공유하고 웹사이트를 개선하세요!</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => handleShare('twitter')}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                Twitter
              </Button>
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-[#4267B2] hover:bg-[#365899]"
              >
                Facebook
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                className="bg-[#0077B5] hover:bg-[#006097]"
              >
                LinkedIn
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Measure;
