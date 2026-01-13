
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import CommunityHub from './components/CommunityHub';
import Leaderboard from './components/Leaderboard';
import MatchOpsCenter from './components/MatchOpsCenter';
import { Player, User, AuthState, MetaTactic, NewsItem, GlobalAlert, AdminNotification } from './types';
import { apiService } from './services/apiService';
import { geminiService } from './services/geminiService';

const sanitize = (text: string) => text.replace(/[<>]/g, '').slice(0, 500);

// Match component removed - migrated to MatchOpsCenter.tsx

// --- MAIN APP ---
const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('efooty_theme') as any) || 'dark');
  const [globalAlert, setGlobalAlert] = useState<GlobalAlert | null>(null);
  const [tactics, setTactics] = useState<MetaTactic[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [metaInsights, setMetaInsights] = useState<any>(null);
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user) setAuthState({ isAuthenticated: true, user });
      } catch (err) {
        localStorage.removeItem('efooty_token');
        localStorage.removeItem('efooty_user');
      }
    };
    checkAuth();

    const fetchGlobalData = async () => {
      try {
        const [alert, tacticalData, logs] = await Promise.all([
          apiService.getGlobalAlert(),
          apiService.getTactics(),
          apiService.getNotifications()
        ]);
        setGlobalAlert(alert);
        setTactics(tacticalData);
        setNotifications(logs);
      } catch (err) { console.error("Sync failed:", err); }
    };
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchInsights = async () => {
        setIsLoadingInsights(true);
        const insights = await geminiService.getLiveMetaInsights();
        const creators = await geminiService.discoverTrendingCreators();
        setMetaInsights(insights);
        setTrendingCreators(creators);
        setIsLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('efooty_theme', theme);
    document.documentElement.classList.toggle('light-mode', theme === 'light');
  }, [theme]);

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[600] bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-9xl font-gaming gradient-text tracking-tighter mb-4 animate-fadeIn">eFooTyAi</h1>
        <p className="text-slate-500 text-2xl font-gaming tracking-[0.3em] uppercase mb-12">YOUR #1 EFOOTBALL META CONSULTANT</p>
        <button onClick={() => setShowWelcome(false)} className="px-12 py-5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full shadow-[0_0_50px_rgba(34,197,94,0.3)] transition-all active:scale-95">INITIALIZE HUB</button>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={authState.user} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onLogout={() => { localStorage.removeItem('efooty_user'); setAuthState({ isAuthenticated: false, user: null }); setActiveTab('dashboard'); }} onOpenAuth={() => setShowAuthModal(true)} onOpenProfile={() => setShowProfileModal(true)}>
      {globalAlert?.active && (
        <div className={`mb-8 p-5 rounded-3xl border-l-8 flex items-center justify-between animate-fadeIn ${globalAlert.type === 'critical' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-blue-500/10 border-blue-500 text-blue-400'}`}>
          <div className="flex items-center gap-4">
            <span className="text-2xl">📢</span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Global Broadcast</p>
              <p className="text-sm font-bold">{globalAlert.message}</p>
            </div>
          </div>
          <button onClick={() => setGlobalAlert(null)} className="opacity-30 hover:opacity-100">✕</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className={`text-7xl font-gaming ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Intelligence <span className="text-green-500">Node</span></h2>
              <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] mt-2">Real-time Meta Stream [v.5.2]</p>
            </div>
            {isLoadingInsights && <div className="text-[10px] font-black text-blue-500 animate-pulse uppercase">Syncing Live Global Data...</div>}
          </div>

          {/* META GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`glass p-10 rounded-[2rem] border-l-4 border-green-500 flex flex-col justify-between ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-[0.2em]">Peak Formation</h3>
              <div className="text-4xl font-gaming text-green-500">{metaInsights?.bestFormation || '4-2-2-2'}</div>
              <p className="text-[9px] text-slate-600 mt-4 font-black uppercase">Current Division 1 Favorite</p>
            </div>
            <div className={`glass p-10 rounded-[2rem] border-l-4 border-blue-500 flex flex-col justify-between ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-[0.2em]">Meta Gaffer</h3>
              <div className="text-4xl font-gaming text-blue-400 truncate">{metaInsights?.bestManager || 'G. GASPERINI'}</div>
              <p className="text-[9px] text-slate-600 mt-4 font-black uppercase">Top-Rated Tactical Affinity</p>
            </div>
            <div className={`glass p-10 rounded-[2rem] border-l-4 border-purple-500 flex flex-col justify-between ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-[0.2em]">Hottest Asset</h3>
              <div className="text-4xl font-gaming text-purple-400 truncate">{metaInsights?.hottestCard || 'POTW MESSI'}</div>
              <p className="text-[9px] text-slate-600 mt-4 font-black uppercase">Stat Peak detected this week</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CREATORS HUB */}
            <div className="glass p-10 rounded-[2rem] border border-slate-800/50 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Hottest Content Creators</h3>
                <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded">LIVE SEARCH</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {trendingCreators.length === 0 ? (
                  <div className="text-[10px] text-slate-600 uppercase font-black py-4">Scanning Social Nodes...</div>
                ) : (
                  trendingCreators.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-gaming text-xl text-blue-400">
                          {c.platform === 'YouTube' ? '▶️' : c.platform === 'X' ? '𝕏' : '🎵'}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{c.name}</div>
                          <div className="text-[9px] text-slate-500 font-black uppercase">{c.handle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-blue-500 font-black uppercase mb-1">{c.reason}</div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-slate-600 hover:text-white underline uppercase">Explore Page ↗</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TRANSMISSION LOGS */}
            <div className="glass p-10 rounded-[2rem] border border-slate-800/50 space-y-8">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Transmission Logs</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                {notifications.filter(n => !authState.isAuthenticated || n.message.includes(authState.user?.username || '') || n.type === 'moderation').length === 0 ? (
                  <div className="text-[10px] text-slate-600 uppercase font-black py-4">No recent signals.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 animate-fadeIn">
                      <div className="text-2xl">{n.type === 'moderation' ? '🛡️' : '📡'}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className={`text-[10px] font-black uppercase ${n.type === 'moderation' ? 'text-blue-500' : 'text-green-500'}`}>{n.type}</div>
                          <div className="text-[8px] text-slate-600 font-mono">{n.timestamp}</div>
                        </div>
                        <div className="text-xs font-bold mt-1">{n.message}</div>
                        <div className="text-[10px] text-slate-500 mt-1 italic">{n.details}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'match' && <MatchOpsCenter theme={theme} isAuthenticated={authState.isAuthenticated} onOpenAuth={() => setShowAuthModal(true)} />}

      {activeTab === 'tactics' && (
        <div className="space-y-10 animate-fadeIn">
          <h2 className={`text-6xl font-gaming ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Tactical Playbooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tactics.map(t => (
              <div key={t.id} className={`glass p-10 rounded-[2rem] border transition-all ${theme === 'light' ? 'bg-white shadow-xl' : 'border-slate-800 hover:border-blue-500/20'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-600/10 text-blue-500 px-4 py-1 rounded text-2xl font-gaming tracking-widest">{t.formation}</div>
                  <span className="text-[8px] font-black px-2 py-1 rounded border border-blue-500 text-blue-500 uppercase">{t.difficulty}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{t.title}</h3>
                <p className="text-sm text-slate-500 italic mb-8">{t.description}</p>
                <button onClick={async () => { if (!authState.isAuthenticated) return setShowAuthModal(true); const logic = await geminiService.getRealTimeTactics(`Formation: ${t.formation}`); alert(logic); }} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Deploy AI Logic Stream →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'community' && <CommunityHub theme={theme} user={authState.user} />}

      {activeTab === 'leaderboard' && <Leaderboard theme={theme} />}

      {showAuthModal && (
        <AuthNode
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => { setAuthState({ isAuthenticated: true, user: u }); setShowAuthModal(false); }}
          theme={theme}
        />
      )}

      {showProfileModal && authState.user && (
        <ProfileNode
          user={authState.user}
          theme={theme}
          onClose={() => setShowProfileModal(false)}
          onLogout={() => { apiService.logout(); setAuthState({ isAuthenticated: false, user: null }); setShowProfileModal(false); }}
          onUpdate={(u) => setAuthState({ ...authState, user: u })}
        />
      )}
    </Layout>
  );
};

// --- NEW PROFILE NODE COMPONENT ---
const ProfileNode: React.FC<{ user: User, theme: 'dark' | 'light', onClose: () => void, onLogout: () => void, onUpdate: (u: User) => void }> = ({ user, theme, onClose, onLogout, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [eName, setEName] = useState(user.efootballName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const full = await apiService.getUserProfile(user.username);
        setProfile(full);
        setBio(full.bio || '');
        setEName(full.efootballName || '');
      } catch (err) { console.error("Profile fetch failed:", err); }
    };
    fetchFullProfile();
  }, [user.username]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await apiService.updateProfile({ bio, efootballName: eName });
      onUpdate(updated);
      alert("Node intelligence updated.");
    } catch (err) { alert("Sync failed."); }
    setIsSaving(false);
  };

  const stats = profile?.stats || { likesReceived: 0, tacticalImpact: 0, postsApproved: 0 };

  return (
    <div className="fixed inset-0 z-[800] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
      <div className={`glass w-full max-w-xl rounded-[2.5rem] p-10 relative animate-scaleIn flex flex-col md:flex-row gap-8 ${theme === 'light' ? 'bg-white' : ''}`}>
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 text-xl">✕</button>

        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${user.rank?.includes('Elite') || user.rank?.includes('Master') ? 'from-amber-400 to-orange-600' : 'from-blue-500 to-purple-600'} flex items-center justify-center text-5xl font-gaming text-white shadow-2xl border-4 border-white/10`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-4xl font-gaming gradient-text uppercase tracking-tighter">{user.username}</h2>
              <div className="flex gap-2 mt-2">
                <span className="text-[9px] font-black px-3 py-1 bg-white/10 rounded-full border border-white/10">{user.rank || 'Strategist'}</span>
                {user.isVerified && <span className="text-[9px] font-black px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20">VERIFIED MASTER</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Tactical Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your tactical philosophy..." className="w-full p-4 rounded-2xl bg-slate-900 border border-white/5 text-xs font-medium outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">eFootball Name</label>
              <input value={eName} onChange={e => setEName(e.target.value)} placeholder="In-game Name" className="w-full p-4 rounded-2xl bg-slate-900 border border-white/5 text-xs font-bold outline-none focus:border-blue-500/50" />
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl transition-all">
              {isSaving ? 'SYNCING...' : 'SAVE CHANGES'}
            </button>
            <button onClick={onLogout} className="px-6 py-4 bg-red-600/10 text-red-500 font-black uppercase text-[10px] rounded-2xl border border-red-500/20 hover:bg-red-600/20 transition-all">TERMINATE</button>
          </div>
        </div>

        <div className="md:w-48 space-y-4">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
            <div className="text-[8px] font-black text-slate-500 uppercase mb-2">Contribution</div>
            <div className="text-3xl font-gaming text-blue-400">{stats.postsApproved || 0}</div>
            <div className="text-[7px] font-black text-slate-600 uppercase">Tactics Shared</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
            <div className="text-[8px] font-black text-slate-500 uppercase mb-2">Engagement</div>
            <div className="text-3xl font-gaming text-green-500">{stats.likesReceived || 0}</div>
            <div className="text-[7px] font-black text-slate-600 uppercase">Likes Received</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
            <div className="text-[8px] font-black text-slate-500 uppercase mb-2">Authority</div>
            <div className="text-3xl font-gaming text-purple-500">{user.rank?.split(' ')[0] || 'Node'}</div>
            <div className="text-[7px] font-black text-slate-600 uppercase">Current Tier</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- AUTH UI RE-IMPLEMENTED FOR CONSISTENCY ---
const AuthNode: React.FC<{ onClose: () => void, onSuccess: (user: User) => void, theme: 'dark' | 'light' }> = ({ onClose, onSuccess, theme }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ email: '', username: '', eid: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 'login') {
        const user = await apiService.login(formData.email, formData.password);
        onSuccess(user);
      } else {
        await apiService.signup(formData.email, formData.username, formData.eid, formData.password);
        setTab('login');
        setError("Account Initialized. Login to sync.");
      }
    } catch (err: any) {
      setError(err.message || "Uplink failed.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[700] bg-black/98 flex items-center justify-center p-4 backdrop-blur-3xl">
      <div className={`glass w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border-slate-700 relative animate-scaleIn ${theme === 'light' ? 'bg-white border-slate-200' : ''}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-red-500">✕</button>
        <div className="flex bg-slate-900/40 p-1 rounded-2xl gap-1">
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t as any); setError(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
          ))}
        </div>
        <h2 className="text-3xl font-gaming gradient-text uppercase tracking-widest text-center">{tab}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="EMAIL/CALLSIGN" className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
          {tab === 'signup' && (
            <>
              <input required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="DISPLAY NAME" className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
              <input required value={formData.eid} onChange={e => setFormData({ ...formData, eid: e.target.value })} placeholder="GAME_ID_123" className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
            </>
          )}
          <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="PASSWORD" className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase text-center rounded-xl">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl transition-all">
            {loading ? 'SYNCING...' : `EXECUTE ${tab}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
