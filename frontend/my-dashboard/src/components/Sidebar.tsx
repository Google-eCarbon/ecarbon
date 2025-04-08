import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  LineChart, 
  CheckSquare, 
  Map, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const menuItems = [
    {
      title: '탄소 측정 결과',
      path: '/',
      icon: <BarChart3 />
    },
    {
      title: '가이드라인 평가',
      path: '/guidelines',
      icon: <CheckSquare />
    },
    {
      title: '탄소 절감량 통계',
      path: '/stats',
      icon: <LineChart />
    },
    {
      title: '분야별 통계',
      path: '/category-stats',
      icon: <Map />
    }
  ];
  
  return (
    <div className={cn(
      "h-screen bg-sidebar fixed left-0 top-0 border-r border-sidebar-border transition-all duration-300 z-40",
      collapsed ? "w-[70px]" : "w-[250px]"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-bold">🌿</span>
          </div>
          {!collapsed && <span className="font-bold text-sidebar-foreground">GreenByteAnalyzer</span>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground p-1 rounded-full hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="p-2">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location.pathname === item.path 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground"
                )}
              >
                <div className="min-w-[24px]">{item.icon}</div>
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
