import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SnowfallEffect from '../common/SnowfallEffect';

interface LayoutProps {
  children?: React.ReactNode;
  showSnowfall?: boolean;
}

export default function Layout({ children, showSnowfall = true }: LayoutProps) {
  return (
    <div
      className="h-screen w-screen flex overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 50%, #F0F9FF 100%)',
      }}
    >
      {showSnowfall && <SnowfallEffect count={50} />}

      <div className="relative z-10 flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <div className="flex-shrink-0">
          <Header />
        </div>

        <main
          className="flex-1 overflow-auto p-6"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
