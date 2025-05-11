import React from 'react';
import { Card } from "@/components/ui/card";

interface TeamMember {
  name: string;
  role: string;
}

interface Feature {
  title: string;
  description: string;
}

const About: React.FC = () => {
  const features: Feature[] = [
    {
      title: "정확한 측정",
      description: "산업별 특성을 고려한 맞춤형 환경 영향 측정 도구를 제공합니다."
    },
    {
      title: "객관적인 순위",
      description: "투명하고 공정한 기준으로 기업들의 친환경 노력을 평가합니다."
    },
    {
      title: "맞춤형 솔루션",
      description: "각 기업의 상황에 맞는 환경 개선 방안을 제안합니다."
    },
    {
      title: "커뮤니티",
      description: "친환경 기업들의 네트워크를 구축하고 정보 공유를 촉진합니다."
    }
  ];

  const teamMembers: TeamMember[] = [
    { name: "김그린", role: "CEO & 환경학 박사" },
    { name: "이에코", role: "CTO & 데이터 사이언티스트" },
    { name: "박지속", role: "환경 컨설턴트" },
    { name: "최미래", role: "기업 파트너십 매니저" }
  ];

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 text-white">
      <h1 className="text-4xl font-bold text-center mb-10">About Greenee</h1>
      
      <Card className="flex items-center mb-16 bg-white/10 rounded-lg p-8 md:flex-col">
        <div className="flex-none w-1/3 flex justify-center md:w-full md:mb-6">
          <img src="/svg/greenee_logo_big_w.svg" alt="Greenee Logo" className="w-40 h-40" />
        </div>
        <div className="flex-grow pl-8 md:pl-0">
          <h2 className="text-2xl font-semibold mb-6">우리의 사명</h2>
          <p className="mb-4 leading-relaxed">
            Greenee는 기업들이 환경 영향을 측정하고 개선할 수 있도록 돕는 플랫폼입니다. 
            우리는 지속 가능한 비즈니스 관행을 촉진하고, 기업들이 환경 보호에 
            기여할 수 있는 방법을 제시합니다.
          </p>
          <p className="leading-relaxed">
            환경 보호는 우리 모두의 책임입니다. Greenee는 기업들이 이 책임을 다할 수 있도록 
            도구와 인사이트를 제공합니다.
          </p>
        </div>
      </Card>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-center mb-8">Greenee의 특징</h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-1">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-white/10 rounded-lg transition-transform hover:-translate-y-1 hover:bg-white/15">
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-center mb-4">Greenee 팀</h2>
        <p className="text-center max-w-2xl mx-auto mb-8">
          환경 전문가, 데이터 과학자, 개발자들로 구성된 우리 팀은 
          지속 가능한 미래를 위해 헌신하고 있습니다.
        </p>
        <div className="grid grid-cols-4 gap-6 lg:grid-cols-2 sm:grid-cols-1">
          {teamMembers.map((member, index) => (
            <Card key={index} className="p-6 bg-white/10 rounded-lg text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20"></div>
              <h3 className="text-lg font-semibold mb-2">{member.name}</h3>
              <p className="text-sm text-gray-300">{member.role}</p>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="text-center">
        <h2 className="text-2xl font-semibold mb-4">문의하기</h2>
        <p className="mb-6">
          Greenee에 대해 더 알고 싶거나 협업을 원하시면 언제든지 연락주세요.
        </p>
        <a 
          href="mailto:contact@greenee.kr" 
          className="inline-block px-8 py-3 bg-transparent border-2 border-white rounded-lg 
                   text-white font-semibold transition-colors hover:bg-white hover:text-green-700"
        >
          이메일 보내기
        </a>
      </section>
    </div>
  );
};

export default About;
