import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  LayoutDashboard,
  Settings,
} from 'lucide-react';

const Sidebar = () => {
  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
      color: "text-sky-500"
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: '/analytics',
      color: "text-violet-500",
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      color: "text-pink-700",
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
    </div>
  );
};

export default Sidebar;
