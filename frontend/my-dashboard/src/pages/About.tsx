import './About.css';

interface TeamMember {
  name: string;
  role: string;
  avatarUrl?: string;
}

interface Feature {
  title: string;
  description: string;
}

interface AboutContent {
  mission: {
    title: string;
    mainText: string;
    subText: string;
  };
  features: Feature[];
  team: {
    title: string;
    intro: string;
    members: TeamMember[];
  };
  contact: {
    title: string;
    description: string;
    buttonText: string;
    email: string;
  };
}

const aboutContent: AboutContent = {
  mission: {
    title: 'Our Mission',
    mainText: 'Greenee is a platform that helps companies measure and improve their environmental impact. We promote sustainable business practices and guide companies in contributing to environmental protection.',
    subText: 'Environmental protection is everyone\'s responsibility. Greenee provides tools and insights to help companies fulfill this responsibility.'
  },
  features: [
    {
      title: 'Accurate Measurement',
      description: 'We provide industry-specific tools for measuring environmental impact.'
    },
    {
      title: 'Objective Ranking',
      description: 'We evaluate companies\' eco-friendly efforts using transparent and fair criteria.'
    },
    {
      title: 'Customized Solutions',
      description: 'We suggest environmental improvement measures tailored to each company\'s situation.'
    },
    {
      title: 'Community',
      description: 'We build networks of eco-friendly companies and facilitate information sharing.'
    }
  ],
  team: {
    title: 'Greenee Team',
    intro: 'Our team of environmental experts, data scientists, and developers is dedicated to creating a sustainable future.',
    members: [
      { name: 'John Green', role: 'CEO & Environmental Ph.D.' },
      { name: 'Emma Echo', role: 'CTO & Data Scientist' },
      { name: 'David Sustain', role: 'Environmental Consultant' },
      { name: 'Sarah Future', role: 'Corporate Partnership Manager' }
    ]
  },
  contact: {
    title: 'Contact Us',
    description: 'Want to learn more about Greenee or interested in collaboration? Feel free to reach out.',
    buttonText: 'Send Email',
    email: 'contact@greenee.kr'
  }
};

const About = () => {
  return (
    <div className="about-container">
      <h1>About Greenee</h1>
      
      <div className="about-section">
        <div className="about-image">
          <img src="/svg/greenee_logo_big_w.svg" alt="Greenee Logo" />
        </div>
        <div className="about-content">
          <h2>{aboutContent.mission.title}</h2>
          <p>{aboutContent.mission.mainText}</p>
          <p>{aboutContent.mission.subText}</p>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Greenee Features</h2>
        <div className="features-grid">
          {aboutContent.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="team-section">
        <h2>{aboutContent.team.title}</h2>
        <p className="team-intro">{aboutContent.team.intro}</p>
        <div className="team-grid">
          {aboutContent.team.members.map((member, index) => (
            <div key={index} className="team-member">
              <div className="member-avatar"></div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="contact-section">
        <h2>{aboutContent.contact.title}</h2>
        <p>{aboutContent.contact.description}</p>
        <a href={`mailto:${aboutContent.contact.email}`} className="contact-btn">
          {aboutContent.contact.buttonText}
        </a>
      </div>
    </div>
  );
};

export default About;
