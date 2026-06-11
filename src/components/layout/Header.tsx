import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Dropdown } from 'antd';
import { User, Settings, LogOut, Bell, Wifi } from 'lucide-react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${year}年${month}月${day}日 ${weekDays[date.getDay()]}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <User className="w-4 h-4" />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <Settings className="w-4 h-4" />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogOut className="w-4 h-4" />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <header
      className="
        h-16 px-6 flex items-center justify-between
        backdrop-blur-xl bg-white/70
        border-b border-blue-100/50
      "
      style={{
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)',
      }}
    >
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          滑雪场运营分析看板
        </h1>
        <div className="h-6 w-px bg-blue-200/50" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{formatDate(currentTime)}</span>
            <span className="text-blue-500 font-mono text-lg">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">在线</span>
          <Badge status="processing" color="#52c41a" />
        </div>

        <button className="relative p-2 rounded-full hover:bg-blue-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <Badge count={3} size="small" className="absolute -top-1 -right-1" />
        </button>

        <div className="h-6 w-px bg-blue-200/50" />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
            <Avatar
              size={36}
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
              }}
              icon={<User className="w-5 h-5" />}
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">管理员</p>
              <p className="text-xs text-gray-400">admin@ski.com</p>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
