
import React, { useState } from 'react';
import { User, Squad } from '../types';
import MySquadDrawer from './MySquadDrawer';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, theme, toggleTheme, onLogout, onOpenAuth, onOpenProfile }) => {
  const [isSquadOpen, setIsSquadOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Feed', icon: '📊' },
    { id: 'match', label: 'Match', icon: '⚔️' },
    { id: 'tactics', label: 'Tactics', icon: '📋' },
    { id: 'community', label: 'Hub', icon: '🌐' },
    { id: 'leaderboard', label: 'Rankings', icon: '🏆' }
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#020617]'}`}>

      {/* SQUAD BUILDER DRAWER */}
      <MySquadDrawer isOpen={isSquadOpen} onClose={() => setIsSquadOpen(false)} theme={theme} />

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 flex-col border-r p-6 sticky top-0 h-screen z-50 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'glass border-slate-800'}`}>
        <div className="flex items-center justify-between mb-10">
          <div className="cursor-pointer hover:scale-105 transition-all" onClick={() => setActiveTab('dashboard')}>
            <h1 className="text-4xl font-gaming gradient-text tracking-tighter">eFooTyAi</h1>
            <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] font-bold">Intelligence Hub</p>
          </div>
          <button
            onClick={() => setIsSquadOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-xl"
            title="Squad Builder"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-4 transition-all ${activeTab === tab.id
                  ? 'bg-green-600/10 text-green-500 border border-green-500/40 shadow-sm'
                  : `text-slate-500 hover:text-green-500 ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-sm font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/10 space-y-4">
          {user && (
            <button onClick={onLogout} className="w-full text-left text-[9px] font-black text-red-500 uppercase tracking-widest hover:opacity-70 transition-opacity px-2">
              Terminate Session
            </button>
          )}
          <button onClick={user ? onOpenProfile : onOpenAuth} className="flex items-center gap-3 px-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-purple-500 transition-colors"></div>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-purple-500">System Identity</span>
          </button>
        </div>
      </aside>

      {/* TOP BAR */}
      <header className={`fixed top-0 right-0 left-0 md:left-64 p-4 md:px-8 md:py-4 z-[60] flex justify-end items-center gap-4 border-b transition-all backdrop-blur-md ${theme === 'light' ? 'bg-white/70 border-slate-200' : 'bg-[#020617]/70 border-slate-800'}`}>
        <div className="flex-1 md:hidden flex items-center gap-3">
          <button onClick={() => setIsSquadOpen(true)} className="p-2 text-xl">☰</button>
          <h1 className="text-2xl font-gaming gradient-text tracking-tighter">eFooTyAi</h1>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className={`p-2.5 rounded-xl border transition-all shadow-md ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800'}`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {user ? (
          <button
            onClick={onOpenProfile}
            className={`group flex items-center gap-3 border px-4 py-2 rounded-2xl transition-all shadow-lg hover:scale-105 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-700'}`}
          >
            <div className="flex flex-col text-right hidden sm:block">
              <span className={`text-xs font-bold transition-colors ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{user.username}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">{user.isVerified ? 'Verified Pro' : 'Handshake Pending'}</span>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold text-xs text-white shadow-lg ring-2 ring-white/10">
              {user.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 uppercase tracking-widest transition-all"
          >
            Access Hub
          </button>
        )}
      </header>

      {/* VIEWPORT */}
      <main className="flex-1 overflow-y-auto h-screen relative pt-24 md:pt-16 bg-grid">
        <div className="max-w-6xl mx-auto p-6 md:p-12 pb-32">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM DOCK */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center p-3 pb-6 z-[100] backdrop-blur-xl ${theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-[#020617]/90 border-slate-800'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-green-500 scale-110' : 'text-slate-400'
              }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
