
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { User, AdminNotification, NewsItem, Player, GlobalAlert, MetaTactic } from './types';
import { sharedStore } from './sharedStore';
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
          if (user.isAdmin) {
            onAuthorize(user);
          }
        } catch {
          apiService.removeToken();
        }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6 animate-fadeIn">
      <div className="glass p-12 rounded-3xl border border-slate-800 w-full max-w-md text-center space-y-8 shadow-2xl">
        <div className="text-6xl">🛡️</div>
        <h2 className="text-4xl font-gaming text-purple-400 tracking-widest uppercase">Command Root</h2>
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
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl uppercase tracking-widest transition-all"
          >
            {loading ? 'Authenticating...' : 'Initialize Node'}
          </button>
        </form>
        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Authorized: MOFOSGAMES_YT</p>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ adminUser: User }> = ({ adminUser }) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'moderation' | 'registry' | 'alerts' | 'oracle' | 'sync'>('nodes');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<NewsItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [alertMsg, setAlertMsg] = useState('');
  const [aiTrends, setAiTrends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingTactic, setIsProcessingTactic] = useState<string | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncingPlayers, setIsSyncingPlayers] = useState(false);
  const [isSyncingContent, setIsSyncingContent] = useState(false);
  const [isSyncingTactics, setIsSyncingTactics] = useState(false);
  const [syncResults, setSyncResults] = useState<{ type: string; message: string; count?: number }[]>([]);
  const [discoveredCreators, setDiscoveredCreators] = useState<any[]>([]);

  useEffect(() => {
    const sync = async () => {
      try {
        const [usersData, playersData, postsData, alertData] = await Promise.all([
          apiService.getUsers().catch(() => sharedStore.getUsers()),
          apiService.getPlayers().catch(() => sharedStore.getPlayers()),
          apiService.getPosts().catch(() => sharedStore.getPosts()),
          apiService.getGlobalAlert().catch(() => sharedStore.getGlobalAlert())
        ]);

        setUsers(usersData);
        setPlayers(playersData);
        setPendingPosts((postsData as NewsItem[]).filter(p => p.status === 'pending'));
        if (alertData) setAlertMsg(alertData.message || '');
      } catch (err) {
        console.error('Sync error:', err);
        setUsers(sharedStore.getUsers());
        setPlayers(sharedStore.getPlayers());
        setPendingPosts(sharedStore.getPosts().filter(p => p.status === 'pending'));
        const cur = sharedStore.getGlobalAlert();
        if (cur) setAlertMsg(cur.message);
      }
    };
    sync();
    const i = setInterval(sync, 5000);
    return () => clearInterval(i);
  }, []);

  // Fetch sync status when on sync tab
  useEffect(() => {
    if (activeTab === 'sync') {
      apiService.getSyncStatus().then(setSyncStatus).catch(console.error);
    }
  }, [activeTab]);

  const handleUserOp = async (id: string, op: 'suspend' | 'verify') => {
    try {
      await apiService.updateUser(id, op);
      const updatedUsers = await apiService.getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      console.error('User operation failed:', err);
      const updated = users.map(u => {
        if (u.id === id) {
          if (op === 'suspend') return { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const };
          if (op === 'verify') return { ...u, isVerified: !u.isVerified };
        }
        return u;
      });
      sharedStore.setUsers(updated);
      setUsers(updated);
    }
  };

  const handlePostApproval = async (post: NewsItem, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await apiService.updatePost(post.id, 'approved');

        if (post.category === 'Tutorial' || post.category === 'Video' || post.category === 'Guide') {
          setIsProcessingTactic(post.id);
          try {
            const newTactic = await geminiService.convertPostToTactic(post);
            await sharedStore.addTactic(newTactic);
            await sharedStore.addNotification({
              id: Date.now().toString(),
              type: 'system',
              message: `Tactical Breakthrough: ${newTactic.title}`,
              details: `Post converted to Tactic and pushed to registry. Source: ${post.title}`,
              timestamp: new Date().toLocaleTimeString()
            });
          } catch (e) {
            console.error("Tactic conversion failed", e);
          } finally {
            setIsProcessingTactic(null);
          }
        }
      } else {
        await apiService.deletePost(post.id);
      }

      const allPosts = await apiService.getPosts();
      setPendingPosts(allPosts.filter(p => p.status === 'pending'));
    } catch (err) {
      console.error('Post approval failed:', err);
      const allPosts = sharedStore.getPosts();
      if (action === 'approve') {
        const updated = allPosts.map(p => p.id === post.id ? { ...p, status: 'approved' as const } : p);
        sharedStore.setPosts(updated);
      } else {
        sharedStore.setPosts(allPosts.filter(p => p.id !== post.id));
      }
      setPendingPosts(sharedStore.getPosts().filter(p => p.status === 'pending'));
    }
  };

  const handleStatEdit = async (id: string, stat: keyof Player['stats'], val: number) => {
    const player = players.find(p => p.id === id);
    if (!player) return;

    const updatedStats = { ...player.stats, [stat]: val };

    try {
      await apiService.updatePlayer(id, { stats: updatedStats });
      const updatedPlayers = await apiService.getPlayers();
      setPlayers(updatedPlayers);
    } catch (err) {
      console.error('Player update failed:', err);
      const updated = players.map(p => {
        if (p.id === id) return { ...p, stats: updatedStats };
        return p;
      });
      sharedStore.setPlayers(updated);
      setPlayers(updated);
    }
  };

  const handleAlertPublish = async (type: 'info' | 'critical') => {
    try {
      await apiService.setGlobalAlert({
        id: 'a1',
        type,
        message: alertMsg,
        active: !!alertMsg
      });
    } catch (err) {
      console.error('Alert publish failed:', err);
      await sharedStore.setGlobalAlert({ id: 'a1', type, message: alertMsg, active: !!alertMsg });
    }
  };

  const deployOracle = async () => {
    setLoading(true);
    const result = await geminiService.getRealTimeTactics("Scrape the 3 hottest eFootball 2025 meta trends as bullet points.");
    setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
    setLoading(false);
  };

  // === SYNC FUNCTIONS ===
  const handleSyncPlayers = async () => {
    setIsSyncingPlayers(true);
    setSyncResults(prev => [...prev, { type: 'info', message: '🔍 Searching eFootballDB for meta players...' }]);

    try {
      const playerData = await geminiService.syncMetaPlayers();

      if (playerData.length > 0) {
        setSyncResults(prev => [...prev, { type: 'info', message: `📦 Found ${playerData.length} players, syncing to database...` }]);

        const result = await apiService.syncPlayers(playerData);

        setSyncResults(prev => [...prev, { type: 'success', message: `✅ Player registry updated!`, count: result.count }]);

        // Refresh players
        const updatedPlayers = await apiService.getPlayers();
        setPlayers(updatedPlayers);
        setSyncStatus(await apiService.getSyncStatus());
      } else {
        setSyncResults(prev => [...prev, { type: 'error', message: '❌ No player data found. Try again.' }]);
      }
    } catch (err: any) {
      console.error('Player sync error:', err);
      setSyncResults(prev => [...prev, { type: 'error', message: `❌ Sync failed: ${err.message}` }]);
    } finally {
      setIsSyncingPlayers(false);
    }
  };

  const handleDiscoverCreators = async () => {
    setIsSyncingContent(true);
    setSyncResults(prev => [...prev, { type: 'info', message: '🔍 Scanning YouTube, Twitter, TikTok for trending creators...' }]);

    try {
      const creators = await geminiService.discoverTrendingCreators();
      setDiscoveredCreators(creators);

      if (creators.length > 0) {
        setSyncResults(prev => [...prev, { type: 'success', message: `✅ Found ${creators.length} trending creators with content!` }]);
      } else {
        setSyncResults(prev => [...prev, { type: 'error', message: '❌ No creators found. Try again.' }]);
      }
    } catch (err: any) {
      console.error('Creator discovery error:', err);
      setSyncResults(prev => [...prev, { type: 'error', message: `❌ Discovery failed: ${err.message}` }]);
    } finally {
      setIsSyncingContent(false);
    }
  };

  const handleImportToHub = async () => {
    if (discoveredCreators.length === 0) return;

    setSyncResults(prev => [...prev, { type: 'info', message: '📝 Generating Hub posts from creator content...' }]);

    try {
      const posts = await geminiService.generateHubPostsFromCreators(discoveredCreators);
      await apiService.syncCreatorContent(posts);

      setSyncResults(prev => [...prev, { type: 'success', message: `✅ ${posts.length} posts added to Quarantine for approval!` }]);
      setDiscoveredCreators([]);

      // Refresh pending posts
      const allPosts = await apiService.getPosts();
      setPendingPosts(allPosts.filter(p => p.status === 'pending'));
      setSyncStatus(await apiService.getSyncStatus());
    } catch (err: any) {
      console.error('Hub import error:', err);
      setSyncResults(prev => [...prev, { type: 'error', message: `❌ Import failed: ${err.message}` }]);
    }
  };

  const handleSyncTactics = async () => {
    setIsSyncingTactics(true);
    setSyncResults(prev => [...prev, { type: 'info', message: '🔍 Searching for division meta tactics...' }]);

    try {
      const tactics = await geminiService.syncDivisionTactics();

      if (tactics.length > 0) {
        setSyncResults(prev => [...prev, { type: 'info', message: `📦 Found ${tactics.length} tactics, syncing to playbook...` }]);

        // Update local tactics via sharedStore
        const existingTactics = sharedStore.getTactics();
        const newTactics = [...tactics, ...existingTactics.filter(t => !t.id?.startsWith('SYNC-TAC-') && !t.id?.startsWith('DEF-TAC-'))];
        sharedStore.setTactics(newTactics);

        // Try to sync to backend
        try {
          await apiService.syncTactics(tactics);
        } catch (e) {
          console.log('Backend sync skipped, saved to localStorage');
        }

        setSyncResults(prev => [...prev, { type: 'success', message: `✅ Tactical Playbook updated with ${tactics.length} division meta tactics!` }]);
      } else {
        setSyncResults(prev => [...prev, { type: 'error', message: '❌ No tactics found. Using defaults.' }]);
      }
    } catch (err: any) {
      console.error('Tactics sync error:', err);
      setSyncResults(prev => [...prev, { type: 'error', message: `❌ Sync failed: ${err.message}` }]);
    } finally {
      setIsSyncingTactics(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden">
      <div className="flex flex-1">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-8 gap-10">
          <div>
            <h1 className="text-3xl font-gaming text-purple-500">CMD_ROOT</h1>
            <p className="text-[9px] text-slate-600 uppercase mt-1">Logged in: {adminUser.username}</p>
          </div>
          <nav className="flex-1 space-y-3">
            {[
              { id: 'nodes', label: 'Nodes', icon: '👤' },
              { id: 'moderation', label: 'Quarantine', icon: '🛡️' },
              { id: 'registry', label: 'Registry', icon: '📁' },
              { id: 'alerts', label: 'Broadcaster', icon: '📡' },
              { id: 'oracle', label: 'AI Oracle', icon: '🔮' },
              { id: 'sync', label: 'Sync Center', icon: '🔄' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-purple-600/10 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-white'}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="space-y-2">
            <a href="index.html" className="block py-4 border border-slate-700 text-slate-400 text-center text-[10px] font-black uppercase rounded-xl hover:text-white hover:border-slate-600 transition-all">Main Site</a>
            <button onClick={handleLogout} className="w-full py-4 border border-red-500/20 text-red-500 text-center text-[10px] font-black uppercase rounded-xl hover:bg-red-500/10 transition-all">Logout</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12">
          <header className="mb-12 border-b border-slate-800 pb-8">
            <h2 className="text-5xl font-gaming uppercase tracking-widest">{activeTab} TERMINAL</h2>
            <p className="text-[10px] text-slate-600 font-mono uppercase mt-1">MASTER ROOT // {new Date().toLocaleTimeString()}</p>
          </header>

          {activeTab === 'nodes' && (
            <div className="glass border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                  <tr><th className="p-6">Node Identify</th><th className="p-6">Status</th><th className="p-6 text-right">Ops</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-sm">{u.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="p-6">
                        <span className={`text-[9px] font-black uppercase ${u.status === 'active' ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>{u.status}</span>
                      </td>
                      <td className="p-6 text-right space-x-4">
                        <button onClick={() => handleUserOp(u.id, 'verify')} className="text-[10px] font-black uppercase text-blue-500 hover:underline">{u.isVerified ? 'Unverify' : 'Verify'}</button>
                        <button onClick={() => handleUserOp(u.id, 'suspend')} className="text-[10px] font-black uppercase text-red-500 hover:underline">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              {pendingPosts.length === 0 ? (
                <div className="py-20 text-center text-slate-600 uppercase font-black tracking-widest text-xs">Quarantine Clear. No pending data streams.</div>
              ) : (
                pendingPosts.map(p => (
                  <div key={p.id} className="glass p-8 rounded-3xl border-slate-800 flex gap-8 animate-fadeIn">
                    <div className="w-48 h-32 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0">
                      {p.mediaUrl && p.mediaUrl.startsWith('data:video') ? (
                        <video src={p.mediaUrl} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={p.thumbnail || p.mediaUrl} className="w-full h-full object-cover" alt={p.title} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[9px] font-black text-purple-500 uppercase">{p.category}</span>
                        <span className="text-[9px] font-black text-slate-600 uppercase">Author: {p.author}</span>
                      </div>
                      <h4 className="font-bold text-lg">{p.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.summary}</p>
                      {p.url && <div className="text-[9px] text-blue-500 truncate max-w-xs">{p.url}</div>}
                      {p.id?.startsWith('AUTO-') && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">AI Generated</span>}
                    </div>
                    <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                      <button
                        onClick={() => handlePostApproval(p, 'approve')}
                        disabled={isProcessingTactic === p.id}
                        className={`px-6 py-2 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase transition-all ${isProcessingTactic === p.id ? 'opacity-50' : 'hover:bg-green-500'}`}
                      >
                        {isProcessingTactic === p.id ? 'TRANSFORMING...' : 'Authorize'}
                      </button>
                      <button
                        onClick={() => handlePostApproval(p, 'reject')}
                        className="px-6 py-2 bg-red-600/20 text-red-500 rounded-lg text-[9px] font-black uppercase hover:bg-red-600/30"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'registry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {players.map(p => (
                <div key={p.id} className="glass p-8 rounded-3xl border-slate-800 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">{p.name}</h4>
                      <div className="text-[9px] text-slate-500 uppercase">{(p as any).club || 'Unknown Club'} • {(p as any).nationality || 'Unknown'}</div>
                    </div>
                    <span className="text-purple-500 font-gaming text-xl">{p.rating}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(p.stats).map(([stat, val]) => (
                      <div key={stat} className="space-y-1">
                        <label className="text-[8px] font-black text-slate-600 uppercase">{stat}</label>
                        <input type="number" value={val as number} onChange={e => handleStatEdit(p.id, stat as any, parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-xl space-y-8 animate-fadeIn">
              <div className="glass p-10 rounded-3xl border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">📡 Global Broadcast Node</h3>
                  {alertMsg && (
                    <button
                      onClick={() => setAlertMsg('')}
                      className="text-[9px] text-red-500 font-black uppercase hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={alertMsg}
                  onChange={e => setAlertMsg(e.target.value)}
                  placeholder="Enter broadcast message for all users..."
                  className="w-full h-40 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm outline-none focus:border-purple-500"
                />
                <div className="flex gap-4">
                  <button
                    onClick={async () => {
                      if (!alertMsg.trim()) return alert('Enter a message first!');
                      await handleAlertPublish('info');
                      alert('✅ Info broadcast published!');
                    }}
                    className="flex-1 py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-colors"
                  >
                    📢 Publish Info
                  </button>
                  <button
                    onClick={async () => {
                      if (!alertMsg.trim()) return alert('Enter a message first!');
                      await handleAlertPublish('critical');
                      alert('🚨 Critical alert published!');
                    }}
                    className="flex-1 py-4 bg-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 transition-colors"
                  >
                    🚨 Publish Alert
                  </button>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await apiService.setGlobalAlert({ id: 'a1', type: 'info', message: '', active: false });
                      await sharedStore.setGlobalAlert(null);
                      setAlertMsg('');
                      alert('✅ All broadcasts cleared!');
                    } catch (e) {
                      await sharedStore.setGlobalAlert(null);
                      setAlertMsg('');
                      alert('✅ Broadcasts cleared locally!');
                    }
                  }}
                  className="w-full py-3 border border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-colors"
                >
                  🗑️ Clear All Broadcasts
                </button>
              </div>
            </div>
          )}

          {activeTab === 'oracle' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="glass p-8 rounded-3xl border-slate-800">
                <h3 className="text-lg font-bold mb-2">🔮 AI Oracle Console</h3>
                <p className="text-[10px] text-slate-500 mb-6">Advanced AI-powered meta analysis and insights</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const result = await geminiService.getRealTimeTactics("What are the 5 hottest eFootball 2025 meta trends right now? List them with brief explanations.");
                      setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="p-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-[9px] font-black uppercase disabled:opacity-50 transition-colors"
                  >
                    🔥 Meta Trends
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const result = await geminiService.getRealTimeTactics("List the top 5 best formations in eFootball 2025 Division 1 right now and explain why each is strong.");
                      setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="p-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-[9px] font-black uppercase disabled:opacity-50 transition-colors"
                  >
                    📋 Best Formations
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const result = await geminiService.getRealTimeTactics("What are the 5 most effective counter-attack strategies in eFootball 2025? Include player positioning tips.");
                      setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="p-4 bg-green-600 hover:bg-green-500 rounded-xl text-[9px] font-black uppercase disabled:opacity-50 transition-colors"
                  >
                    ⚡ Counter Tactics
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const result = await geminiService.getRealTimeTactics("List the 5 most broken/overpowered mechanics in eFootball 2025 that players should know about.");
                      setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="p-4 bg-red-600 hover:bg-red-500 rounded-xl text-[9px] font-black uppercase disabled:opacity-50 transition-colors"
                  >
                    💥 OP Mechanics
                  </button>
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-purple-500 uppercase">Oracle Thinking...</span>
                  </div>
                )}
              </div>

              {aiTrends.length > 0 && (
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black uppercase text-slate-500">Oracle Insights</h4>
                    <button
                      onClick={() => setAiTrends([])}
                      className="text-[9px] text-slate-500 hover:text-red-500 font-black uppercase"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-3">
                    {aiTrends.map((t, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 group hover:bg-purple-500/10 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-sm leading-relaxed">{t}</span>
                          <button
                            onClick={() => setAlertMsg(t.replace(/^[\s\-•\d.]+/, ''))}
                            className="opacity-0 group-hover:opacity-100 text-purple-400 text-[8px] font-black uppercase border border-purple-500/30 px-2 py-1 rounded transition-opacity shrink-0"
                          >
                            → Broadcast
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Sync Status */}
              {syncStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass p-6 rounded-2xl border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Players</div>
                    <div className="text-2xl font-gaming text-green-500">{syncStatus.players?.count || 0}</div>
                    <div className="text-[8px] text-slate-600">{syncStatus.players?.lastSync}</div>
                  </div>
                  <div className="glass p-6 rounded-2xl border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Total Posts</div>
                    <div className="text-2xl font-gaming text-blue-500">{syncStatus.content?.total || 0}</div>
                  </div>
                  <div className="glass p-6 rounded-2xl border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Pending</div>
                    <div className="text-2xl font-gaming text-yellow-500">{syncStatus.content?.pending || 0}</div>
                  </div>
                  <div className="glass p-6 rounded-2xl border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Auto-Generated</div>
                    <div className="text-2xl font-gaming text-purple-500">{syncStatus.content?.autoGenerated || 0}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* F2P Players Research */}
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🆓</span>
                    <div>
                      <h3 className="font-bold text-lg">F2P Players Research</h3>
                      <p className="text-[10px] text-slate-500">Best free-to-play players for budget builds</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Find the best Standard, Event, and free players for F2P gamers. AI searches for hidden gems, best GP signings, and meta players you can get without spending.</p>
                  <button
                    onClick={async () => {
                      setIsSyncingPlayers(true);
                      setSyncResults(prev => [...prev, { type: 'info', message: '🔍 Searching for best F2P players...' }]);
                      try {
                        const result = await geminiService.getRealTimeTactics(`
                          Search for the BEST FREE-TO-PLAY (F2P) players in eFootball 2025:
                          
                          1. Top 5 Standard players (base cards) that perform like legends
                          2. Best free Event players currently available
                          3. Top GP contract signings under 10,000 GP
                          4. Hidden gem players with 80+ rating that are underrated
                          5. Best free goalkeepers and defenders
                          
                          For each player include: Name, Position, Rating, Why they're great for F2P
                        `);
                        setSyncResults(prev => [...prev, { type: 'success', message: `✅ F2P Research Complete!` }]);
                        setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      } catch (err: any) {
                        setSyncResults(prev => [...prev, { type: 'error', message: `❌ Research failed: ${err.message}` }]);
                      } finally {
                        setIsSyncingPlayers(false);
                      }
                    }}
                    disabled={isSyncingPlayers}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingPlayers ? 'bg-slate-800 text-slate-500 animate-pulse' : 'bg-green-600 text-white hover:bg-green-500'}`}
                  >
                    {isSyncingPlayers ? '🔍 RESEARCHING F2P META...' : '🆓 FIND F2P PLAYERS'}
                  </button>
                </div>

                {/* P2W Players Research */}
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-6 border-l-4 border-yellow-500">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">💎</span>
                    <div>
                      <h3 className="font-bold text-lg">P2W Players Research</h3>
                      <p className="text-[10px] text-slate-500">Premium meta players for competitive play</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Find the most OP Featured, POTW, and Iconic players. AI searches for the best premium cards worth spending coins on.</p>
                  <button
                    onClick={async () => {
                      setIsSyncingContent(true);
                      setSyncResults(prev => [...prev, { type: 'info', message: '🔍 Searching for best P2W players...' }]);
                      try {
                        const result = await geminiService.getRealTimeTactics(`
                          Search for the BEST PAY-TO-WIN (P2W) premium players in eFootball 2025:
                          
                          1. Top 5 current POTW (Player of the Week) cards
                          2. Best Featured players with boosted stats
                          3. Most broken Epic/Legendary players
                          4. Top coin-worthy strikers and wingers
                          5. Best premium midfielders and defenders
                          
                          For each player include: Name, Card Type, Rating, Key boosted stats, Why they're worth it
                        `);
                        setSyncResults(prev => [...prev, { type: 'success', message: `✅ P2W Research Complete!` }]);
                        setAiTrends(result.split('\n').filter(l => l.trim().length > 5));
                      } catch (err: any) {
                        setSyncResults(prev => [...prev, { type: 'error', message: `❌ Research failed: ${err.message}` }]);
                      } finally {
                        setIsSyncingContent(false);
                      }
                    }}
                    disabled={isSyncingContent}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingContent ? 'bg-slate-800 text-slate-500 animate-pulse' : 'bg-yellow-600 text-white hover:bg-yellow-500'}`}
                  >
                    {isSyncingContent ? '🔍 RESEARCHING P2W META...' : '💎 FIND P2W PLAYERS'}
                  </button>
                </div>

                {/* Content Discovery */}
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">📺</span>
                    <div>
                      <h3 className="font-bold text-lg">Content Creator Discovery</h3>
                      <p className="text-[10px] text-slate-500">Find trending eFootball creators across platforms</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Discovers trending tutorials, guides, and tips from YouTube, Twitter/X, and TikTok. AI generates summaries for each piece of content.</p>
                  <button
                    onClick={handleDiscoverCreators}
                    disabled={isSyncingContent}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingContent ? 'bg-slate-800 text-slate-500 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                  >
                    {isSyncingContent ? '🔍 SCANNING PLATFORMS...' : '🔍 DISCOVER CREATORS'}
                  </button>
                </div>
              </div>

              {/* Tactical Playbook Sync */}
              <div className="glass p-8 rounded-3xl border-slate-800 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h3 className="font-bold text-lg">Tactical Playbook Sync</h3>
                    <p className="text-[10px] text-slate-500">Fetch division meta tactics from the web</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Searches for the latest Division 1-3 meta tactics, counter formations, and strategic setups from YouTube, Reddit, and eFootball communities.</p>
                <button
                  onClick={handleSyncTactics}
                  disabled={isSyncingTactics}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSyncingTactics ? 'bg-slate-800 text-slate-500 animate-pulse' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                >
                  {isSyncingTactics ? '🔍 RESEARCHING META...' : '📚 SYNC DIVISION TACTICS'}
                </button>
              </div>

              {/* Discovered Creators */}
              {discoveredCreators.length > 0 && (
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Discovered Content ({discoveredCreators.length})</h3>
                    <button
                      onClick={handleImportToHub}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      📝 Import All to Hub
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discoveredCreators.map((c, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-lg">
                            {c.creator.platform === 'YouTube' ? '▶️' : c.creator.platform === 'Twitter' || c.creator.platform === 'X' ? '𝕏' : '🎵'}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{c.creator.name}</div>
                            <div className="text-[9px] text-slate-500">{c.creator.handle} • {c.creator.platform}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-blue-400">{c.content.title}</div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{c.aiSummary}</p>
                        {c.content.videoUrl && (
                          <a href={c.content.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:underline">View Original ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Log */}
              {syncResults.length > 0 && (
                <div className="glass p-8 rounded-3xl border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Sync Log</h3>
                    <button onClick={() => setSyncResults([])} className="text-[9px] text-slate-600 hover:text-white">Clear</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {syncResults.map((r, idx) => (
                      <div key={idx} className={`text-xs p-3 rounded-xl ${r.type === 'success' ? 'bg-green-500/10 text-green-400' : r.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {r.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Main App
const AdminApp: React.FC = () => {
  const [adminUser, setAdminUser] = useState<User | null>(null);

  if (!adminUser) {
    return <AdminSecurityGate onAuthorize={setAdminUser} />;
  }

  return <AdminDashboard adminUser={adminUser} />;
};

const rootEl = document.getElementById('admin-root');
if (rootEl) ReactDOM.createRoot(rootEl).render(<AdminApp />);
