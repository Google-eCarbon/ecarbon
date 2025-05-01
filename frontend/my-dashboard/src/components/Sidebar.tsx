import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  LayoutDashboard,
  CheckSquare, 
  Settings,
  LineChart,
} from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';

const Sidebar = () => {
  const routes = [
    {
      label: 'Carbon Footprint',
      icon: LayoutDashboard,
      href: '/',
      color: "text-sky-500"
    },
    {
      label: 'GuideLine Analysis',
      icon: CheckSquare,
      href: '/guidelines',
      color: "text-violet-500",
    },
    {
      label: 'Reduced Carbon Report',
      icon: LineChart,
      href: '/stats',
      color: "text-emerald-500",
    },
    {
        label: 'category stats',
        icon: LineChart,
        href: '/category-stats',
        color: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">
          eCarbon
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <NavLink
              key={route.href}
              to={route.href}
              className={({ isActive }) =>
                cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  isActive ? "text-white bg-white/10" : "text-zinc-400",
                )
              }
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
      
      {/* 로그인 버튼 영역 - 하단에 고정 */}
      <div className="mt-auto px-3 py-4 border-t border-gray-700">
        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
