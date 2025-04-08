import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, HelpCircle, Info, Search } from "lucide-react";
import Layout from '@/components/Layout';

const Guidelines = () => {
  const [selectedLLM, setSelectedLLM] = useState("gemini");
  const [showDetailsForItem, setShowDetailsForItem] = useState<string | null>(null);
  
  // Mock data for guidelines
  const guidelines = [
    { 
      id: "alt-text", 
      status: "success", 
      name: "이미지 대체 텍스트", 
      detail: "alt 속성 존재", 
      importance: "스크린 리더 사용자가 이미지 내용을 이해하고 페이지를 탐색하는 데 중요합니다.",
      explanation: "모든 중요 이미지에 대체 텍스트가 적절히 제공되었습니다. 총 25개 이미지 중 23개가 alt 속성을 포함하고 있으며, 순수 장식용 이미지 2개는 alt=\"\" 처리되어 있습니다."
    },
    { 
      id: "color-contrast", 
      status: "error", 
      name: "색상 대비", 
      detail: "대비율 2.3:1로 낮음", 
      importance: "색약, 저시력 사용자들이 콘텐츠를 읽을 수 있게 합니다. 최소 4.5:1의 대비를 권장합니다.",
      explanation: "메인 네비게이션의 연한 회색 텍스트(#CCCCCC)와 흰색 배경(#FFFFFF) 간 대비가 2.3:1로 WCAG AA 기준(4.5:1)에 미달합니다. 이 부분을 더 어두운 회색(#767676)으로 변경하면 기준을 충족할 수 있습니다."
    },
    { 
      id: "font-size", 
      status: "pending", 
      name: "폰트 크기", 
      detail: "기준 충족 여부 미정", 
      importance: "적절한 폰트 크기는 모든 사용자, 특히 시력이 낮은 사용자의 가독성을 높입니다.",
      explanation: "대부분의 텍스트는 최소 16px 이상으로 적절하나, 푸터 영역의 일부 텍스트가 10px로 작아 추가 검토가 필요합니다."
    },
    { 
      id: "keyboard", 
      status: "success", 
      name: "키보드 접근성", 
      detail: "모든 기능 키보드로 접근 가능", 
      importance: "모터 장애가 있는 사용자나 마우스를 사용할 수 없는 사용자를 위해 필수적입니다.",
      explanation: "모든 인터랙티브 요소에 키보드 포커스가 제공되며, 논리적인 순서로 탐색 가능합니다. Tab 키와 Enter 키만으로도 주요 기능 모두 사용 가능합니다."
    },
    { 
      id: "headings", 
      status: "success", 
      name: "제목 구조", 
      detail: "논리적인 h1-h6 구조", 
      importance: "스크린 리더 사용자가 콘텐츠를 이해하고 페이지를 탐색하는 데 중요합니다.",
      explanation: "페이지는 명확한 h1 제목으로 시작하며, h2, h3 등의 부제목이 논리적인 계층 구조를 형성합니다. 건너뛰는 제목 레벨이 없어 접근성이 우수합니다."
    },
    { 
      id: "aria", 
      status: "error", 
      name: "ARIA 레이블", 
      detail: "일부 컴포넌트에 ARIA 레이블 누락", 
      importance: "스크린 리더 사용자에게 복잡한 UI 요소의 목적과 상태를 알려줍니다.",
      explanation: "슬라이더와 탭 컴포넌트에 aria-label 속성이 누락되었습니다. 또한 모달 다이얼로그에 aria-modal=\"true\" 속성이 필요합니다."
    },
  ];
  
  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'success':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <XCircle className="text-red-500" />;
      case 'pending':
      default:
        return <HelpCircle className="text-gray-400" />;
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* 상단 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span>🧩</span> 접근성 가이드라인 준수 현황 | 대상: example.com
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-medium">✅ 총 3개 준수</span> / 
              <span className="text-red-500 font-medium">❌ 2개 미준수</span>
              <span className="text-gray-500">(총 6개 중)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>W3C 웹 접근성 지침(WCAG) 2.1 기준으로 평가됩니다</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>🔍 평가자:</span>
                <Select 
                  value={selectedLLM} 
                  onValueChange={setSelectedLLM}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="gemma">Gemma</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">✅</TableHead>
                  <TableHead>항목</TableHead>
                  <TableHead>세부 내용</TableHead>
                  <TableHead className="w-[100px]">보기</TableHead>
                  <TableHead className="w-[100px]">왜 중요해?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guidelines.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{renderStatusIcon(item.status)}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.detail}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setShowDetailsForItem(item.id)}>
                            <Search size={14} className="mr-1" /> 보기
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>{item.name} 상세 정보</SheetTitle>
                          </SheetHeader>
                          <div className="mt-4 space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">상태</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStatusIcon(item.status)}
                                <span>{item.detail}</span>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">분석 결과</h3>
                              <p className="mt-1">{item.explanation}</p>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">개선 방안</h3>
                              <p className="mt-1">
                                {item.status === 'error' 
                                  ? "색상 대비를 높이거나, 폰트 크기를 키우거나, 필요한 ARIA 속성을 추가하세요." 
                                  : "현재 상태를 유지하면서 지속적인 모니터링이 필요합니다."}
                              </p>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>{item.importance}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* 오른쪽: LLM 선택 및 요약 결과 (모바일에서는 하단에 표시) */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 평가 모델 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedLLM === 'gemini' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={selectedLLM === 'gemini' ? 'font-medium' : ''}>Gemini</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedLLM === 'gemma' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={selectedLLM === 'gemma' ? 'font-medium' : ''}>Gemma</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedLLM === 'claude' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={selectedLLM === 'claude' ? 'font-medium' : ''}>Claude</span>
              </div>
              
              <Button className="w-full">
                🔄 평가 새로고침
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Guidelines;
