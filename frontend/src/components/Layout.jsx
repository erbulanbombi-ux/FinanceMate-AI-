import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';
import ApiConfigModal from './ApiConfigModal';
import PeriodPicker from './PeriodPicker';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Mobile Top Header + Drawer + Bottom Nav */}
      <MobileNav onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Viewport Container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 pb-16 lg:pb-8">
        {/* Desktop Sticky Header */}
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Mobile Period Picker bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-[#0d121f]/60 border-b border-slate-800/60">
          <span className="text-xs font-medium text-slate-400">Period:</span>
          <PeriodPicker />
        </div>

        {/* Page Content with smooth transitions and container bounds */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global API Configuration Modal */}
      <ApiConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
