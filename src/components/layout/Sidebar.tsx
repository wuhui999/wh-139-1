import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Database,
  Mountain,
  Lightbulb,
  MonitorSmartphone,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Snowflake,
} from 'lucide-react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'import', label: '数据导入', icon: Database, path: '/import' },
  { key: 'piste', label: '雪道总览', icon: Mountain, path: '/piste' },
  { key: 'suggestion', label: '计划建议', icon: Lightbulb, path: '/suggestion' },
  { key: 'equipment', label: '设备监控', icon: MonitorSmartphone, path: '/equipment' },
  { key: 'report', label: '报告导出', icon: FileDown, path: '/report' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = menuItems.find((item) => item.path === location.pathname)?.key || 'piste';

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className="
        h-full flex flex-col
        backdrop-blur-xl bg-white/70
        border-r border-blue-100/50
        transition-all duration-300 ease-in-out
      "
      style={{
        width: collapsed ? '72px' : '240px',
        boxShadow: '4px 0 20px rgba(59, 130, 246, 0.06)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-blue-100/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            }}
          >
            <Snowflake className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              雪道管家
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <li key={item.key}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 ease-out
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium whitespace-nowrap overflow-hidden">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-blue-100/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600
            transition-all duration-200
          "
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
