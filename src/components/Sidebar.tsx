import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Wrench,
  Package,
  BarChart3,
  Home,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/dashboard', label: '房态看板', icon: LayoutDashboard },
  { path: '/cleaning', label: '清洁任务', icon: Sparkles },
  { path: '/maintenance', label: '维修工单', icon: Wrench },
  { path: '/inventory', label: '库存补给', icon: Package },
  { path: '/statistics', label: '统计分析', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-primary-500 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-primary-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-400 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary-900" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold">雅居民宿</h1>
            <p className="text-xs text-primary-200">运营管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-accent-400 text-primary-900 font-semibold shadow-lg'
                  : 'text-primary-100 hover:bg-primary-600 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-300 flex items-center justify-center text-primary-800 font-semibold">
            王
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">王芳</p>
            <p className="text-xs text-primary-300 truncate">前台</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
