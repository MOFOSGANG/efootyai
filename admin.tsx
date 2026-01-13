
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { User, NewsItem, Player } from './types';
import { geminiService } from './services/geminiService';
import { apiService } from './services/apiService';

const AdminSecurityGate: React.FC<{ onAuthorize: (user: User) => void }> = ({ onAuthorize }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          const user = await apiService.getCurrentUser();
          if (user.isAdmin) onAuthorize(user);
        } catch { apiService.removeToken(); }
      }
    };
    checkSession();
  }, [onAuthorize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiService.adminLogin(password);
      onAuthorize(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6 animate-fadeIn">
      <div className="glass p-12 rounded-3xl border border-slate-800 w-full max-w-md text-center space-y-8 shadow-2xl">
        <div className="text-6xl text-purple-500">🛡️</div>
        <h2 className="text-4xl font-gaming text-purple-400 tracking-widest uppercase font-bold">Command Root</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER SYSTEM KEY"
            className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-800'} p-5 rounded-2xl text-center outline-none focus:border-purple-500 font-mono text-white tracking-[0.3em]`}
            required
          />
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-2xl uppercase tracking-widest transition-all">
            {loading ? 'Authenticating...' : 'Initialize Node'}
          </button>
        </form>
        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Authorized Access Only</p>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ adminUser: User }> = ({ adminUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'moderation' | 'registry' | 'sync'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<NewsItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [alertMsg, setAlertMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ type: string; message: string; count?: number }[]>([]);

  const fetchData = async () => {
    try {
      const [u, pl, po, al] = await Promise.all([
        apiService.getUsers().catch(() => []),
        apiService.getPlayers().catch(() => []),
        apiService.getPosts().catch(() => []),
        apiService.getGlobalAlert().catch(() => null)
      ]);
      setUsers(u);
      setPlayers(pl);
      setPendingPosts(po.filter((p: any) => p.status === 'pending'));
      if (al) setAlertMsg(al.message || '');
    } catch (err) { console.error('Data pull error:', err); }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, []);

  const handleOmniSync = async () => {
    setIsSyncing(true);
    setSyncResults([{ type: 'info', message: '🚀 INITIALIZING OMNI-SYNC CORE...' }]);
    try {
      setSyncResults(p => [...p, { type: 'info', message: '🔍 Updating Player Database...' }]);
      const pData = await geminiService.syncMetaPlayers();
      if (pData.length) await apiService.syncPlayers(pData);

      setSyncResults(p => [...p, { type: 'info', message: '🔍 Updating Tactical Playbook...' }]);
      const tData = await geminiService.syncDivisionTactics();
      if (tData.length) await apiService.syncTactics(tData);

      setSyncResults(p => [...p, { type: 'info', message: '🔍 Discovering YouTube/X Creators...' }]);
      const creators = await geminiService.discoverTrendingCreators();
      if (creators.length) {
        const posts = await geminiService.generateHubPostsFromCreators(creators);
        await apiService.syncCreatorContent(posts);
      }
      setSyncResults(p => [...p, { type: 'success', message: '✅ GLOBAL PLATFORM SYNC COMPLETE.' }]);
      await fetchData();
    } catch (err: any) {
      setSyncResults(p => [...p, { type: 'error', message: `❌ SYNC FAILURE: ${err.message}` }]);
    } finally { setIsSyncing(false); }
  };

  const handleUserOp = async (id: string, op: 'suspend' | 'verify') => {
    await apiService.updateUser(id, op);
    await fetchData();
  };

  const handlePostApproval = async (post: NewsItem, action: 'approve' | 'reject') => {
    if (action === 'approve') await apiService.updatePost(post.id, 'approved');
    else await apiService.deletePost(post.id);
    await fetchData();
  };

  const handleAlertPublish = async () => {
    await apiService.setGlobalAlert({ id: 'a1', type: 'info', message: alertMsg, active: !!alertMsg });
    alert('Global System Alert Broad-casted.');
  };

  const handleLogout = () => {
    apiService.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden animate-fadeIn">
      <div className="flex flex-1">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-8 gap-10">
          <div>
            <h1 className="text-3xl font-gaming text-purple-500 font-bold mb-1">CMD_ROOT</h1>
            <p className="text-[9px] text-slate-600 uppercase mt-1 tracking-widest font-black">Operator: {adminUser.username}</p>
          </div>
          <nav className="flex-1 space-y-3">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'moderation', label: 'Quarantine', icon: '🛡️' },
              { id: 'registry', label: 'User Nodes', icon: '👥' },
              { id: 'sync', label: 'Omni-Sync', icon: '🔄' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-purple-600/10 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-white'}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="space-y-2 mt-auto">
            <a href="index.html" className="block py-4 border border-slate-700 text-slate-400 text-center text-[10px] font-black uppercase rounded-xl hover:text-white hover:border-slate-600 transition-all">Main Hub</a>
            <button onClick={handleLogout} className="w-full py-4 border border-red-500/20 text-red-500 text-center text-[10px] font-black uppercase rounded-xl hover:bg-red-500/10 transition-all">Revoke Session</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <header className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-end">
            <div>
              <h2 className="text-5xl font-gaming uppercase tracking-widest font-black text-white">{activeTab} TERMINAL</h2>
              <p className="text-[10px] text-slate-600 font-mono uppercase mt-2 tracking-widest">MASTER_ROOT // {new Date().toLocaleTimeString()}</p>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="glass p-8 rounded-3xl border border-slate-800 shadow-lg"><p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Access Points</p><h3 className="text-4xl font-gaming text-blue-500 font-bold">{users.length}</h3></div>
                <div className="glass p-8 rounded-3xl border border-slate-800 shadow-lg"><p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Pending Streams</p><h3 className="text-4xl font-gaming text-yellow-500 font-bold">{pendingPosts.length}</h3></div>
                <div className="glass p-8 rounded-3xl border border-slate-800 shadow-lg"><p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Registry Size</p><h3 className="text-4xl font-gaming text-green-500 font-bold">{players.length}</h3></div>
                <div className="glass p-8 rounded-3xl border border-slate-800 shadow-lg"><p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Platform Health</p><h3 className="text-4xl font-gaming text-purple-500 font-bold">STABLE</h3></div>
              </div>
              <div className="glass p-10 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">📡 Global Broadcast Terminal</h3>
                <div className="flex gap-6">
                  <input type="text" value={alertMsg} onChange={e => setAlertMsg(e.target.value)} placeholder="ENTER GLOBAL MESSAGE..." className="flex-1 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl outline-none focus:border-purple-500 font-mono text-sm text-white" />
                  <button onClick={handleAlertPublish} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40">Transmit</button>
                </div>
              </div>
              {syncResults.length > 0 && (
                <div className="glass p-8 rounded-3xl border border-slate-800 bg-black/30 backdrop-blur-md">
                  <h3 className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">CMD_LOG RECENT_OPS</h3>
                  <div className="font-mono text-[10px] space-y-2 max-h-64 overflow-y-auto">
                    {syncResults.map((r, i) => (
                      <div key={i} className={r.type === 'error' ? 'text-red-400' : r.type === 'success' ? 'text-green-400' : 'text-blue-400'}>
                        [{new Date().toLocaleTimeString()}] {r.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6 animate-fadeIn">
              {pendingPosts.length === 0 ? (
                <div className="py-32 text-center text-slate-600 uppercase font-black tracking-widest text-xs flex flex-col items-center gap-4">
                  <div className="text-5xl opacity-20">🛡️</div>
                  Quarantine Clear. All data streams authorized.
                </div>
              ) : (
                pendingPosts.map(p => (
                  <div key={p.id} className="glass p-8 rounded-3xl border border-slate-800 flex gap-8 items-center hover:bg-white/5 transition-all">
                    <div className="w-48 h-32 rounded-2xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                      <img src={p.thumbnail || p.mediaUrl} className="w-full h-full object-cover" alt={p.title} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center"><span className="text-[9px] font-black text-purple-500 uppercase px-2 py-1 bg-purple-500/10 rounded">{p.category}</span><span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Source: {p.author}</span></div>
                      <h4 className="font-bold text-xl text-white">{p.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.summary}</p>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <button onClick={() => handlePostApproval(p, 'approve')} className="px-10 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Authorize</button>
                      <button onClick={() => handlePostApproval(p, 'reject')} className="px-10 py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all">Purge</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'registry' && (
            <div className="glass border border-slate-800 rounded-3xl overflow-hidden animate-fadeIn shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                  <tr><th className="p-8">Node Identity</th><th className="p-8 text-center">Authorization</th><th className="p-8 text-right">Admin Control</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                        <div className="font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest">{u.username}</div>
                        <div className="text-[10px] text-slate-600 font-mono mt-1">{u.email}</div>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{u.status}</span>
                      </td>
                      <td className="p-8 text-right space-x-8">
                        <button onClick={() => handleUserOp(u.id, 'verify')} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-all">{u.isVerified ? 'Revoke Rank' : 'Promote Entity'}</button>
                        <button onClick={() => handleUserOp(u.id, 'suspend')} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-all">{u.status === 'active' ? 'Suspend Access' : 'Restore Access'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="max-w-2xl mx-auto space-y-12 animate-fadeIn text-center pt-20 pb-20">
              <div className="text-8xl animate-pulse drop-shadow-[0_0_35px_rgba(168,85,247,0.4)] mb-8">🔄</div>
              <h3 className="text-4xl font-gaming tracking-widest text-white uppercase font-black">Core State Synchronizer</h3>
              <p className="text-xs text-slate-500 uppercase tracking-[0.3em] leading-relaxed max-w-lg mx-auto">Trigger an atomic system-wide update. Syncs player registries, tactical meta shifts, and community content streams via neural AI spidering.</p>
              <button onClick={handleOmniSync} disabled={isSyncing} className="w-full py-8 bg-purple-600 hover:bg-purple-500 rounded-3xl text-sm font-black uppercase tracking-[0.4em] disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-purple-900/50">
                {isSyncing ? 'SYNCHRONIZING SYSTEM CORE...' : 'INITIALIZE OMNI-SYNC'}
              </button>
              {syncResults.length > 0 && (
                <div className="glass p-10 rounded-3xl border border-slate-800 text-left font-mono text-[11px] space-y-3 bg-black/40 shadow-inner">
                  <p className="text-[9px] text-slate-600 mb-4 border-b border-slate-800 pb-2 font-black">SYSTEM_SYNC_LOG_STREAM</p>
                  {syncResults.map((r, i) => (<div key={i} className={`flex gap-3 ${r.type === 'error' ? 'text-red-400' : r.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                    <span className="opacity-30">[{i.toString().padStart(2, '0')}]</span>
                    <span>{r.message}</span>
                  </div>))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const AdminApp: React.FC = () => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  if (!adminUser) return <AdminSecurityGate onAuthorize={setAdminUser} />;
  return <AdminDashboard adminUser={adminUser} />;
};

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<React.StrictMode><div className="dark"><AdminApp /></div></React.StrictMode>);
}
