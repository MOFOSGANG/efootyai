
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import CommunityHub from './components/CommunityHub';
import { Player, User, AuthState, MetaTactic, NewsItem, GlobalAlert, AdminNotification } from './types';
import { geminiService } from './services/geminiService';
import { sharedStore } from './sharedStore';

const sanitize = (text: string) => text.replace(/[<>]/g, '').slice(0, 500);

// --- MATCH COMPONENT (Enhanced with Quick Counter) ---
const MatchMode: React.FC<{ theme: 'dark' | 'light', isAuthenticated: boolean, onOpenAuth: () => void }> = ({ theme, isAuthenticated, onOpenAuth }) => {
  const [timer, setTimer] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [opponentFormation, setOpponentFormation] = useState('');
  const [opponentStyle, setOpponentStyle] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeQuickCounter, setActiveQuickCounter] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Quick Counter Presets
  const quickCounters = [
    { id: '4-3-3', label: '4-3-3', icon: '⚔️', desc: 'Wide Attack' },
    { id: '4-2-2-2', label: '4-2-2-2', icon: '🛡️', desc: 'Meta Counter' },
    { id: '4-1-2-1-2', label: '4-1-2-1-2', icon: '🎯', desc: 'Narrow Diamond' },
    { id: '5-3-2', label: '5-3-2', icon: '🏰', desc: 'Low Block' },
    { id: '4-3-1-2', label: '4-3-1-2', icon: '⚡', desc: 'Quick Attack' },
    { id: '3-4-3', label: '3-4-3', icon: '🔥', desc: 'All-Out Attack' },
  ];

  // Opponent Playstyle Options
  const playstyles = [
    'High Pressing', 'Possession', 'Counter Attack', 'Long Ball',
    'Wing Play', 'Tiki-Taka', 'Park the Bus', 'Gegenpress'
  ];

  useEffect(() => {
    let interval: any;
    if (timerActive && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    else if (timer === 0) setTimerActive(false);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const handleQuickCounter = async (formationId: string) => {
    if (!isAuthenticated) return onOpenAuth();
    setActiveQuickCounter(formationId);
    setOpponentFormation(formationId);
    setIsCalculating(true);
    setStrategy(null);

    try {
      const fullQuery = `Opponent using ${formationId} formation${opponentStyle ? ` with ${opponentStyle} playstyle` : ''}`;
      const result = await geminiService.quickStrategy(fullQuery);
      setStrategy(result);
      if (!timerActive) {
        setTimer(120);
        setTimerActive(true);
      }
    } catch (err) {
      setStrategy("Analysis failed. Try manual input.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = async () => {
    if (!isAuthenticated) return onOpenAuth();
    if (!opponentFormation && !opponentStyle) return;

    setIsCalculating(true);
    setStrategy(null);

    try {
      const query = `Formation: ${opponentFormation || 'Unknown'}, Playstyle: ${opponentStyle || 'Standard'}`;
      const result = await geminiService.quickStrategy(query);
      setStrategy(result);
      if (!timerActive) {
        setTimer(120);
        setTimerActive(true);
      }
    } catch (err) {
      setStrategy("Analysis interrupted. Retry.");
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleVoice = () => {
    if (!isAuthenticated) return onOpenAuth();
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return alert("System incompatibility. Please use Chrome/Safari.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setAiResponse('');
      setIsAnalyzingVoice(false);
      const recognition = new SpeechRec();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = async (e: any) => {
        const text = e.results[0][0].transcript;
        if (!text) return;
        setIsListening(false);
        setIsAnalyzingVoice(true);

        try {
          const res = await geminiService.analyzeVoiceCommentary(text);
          setAiResponse(res);
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(res);
            window.speechSynthesis.speak(utterance);
          }
        } catch (err) {
          setAiResponse("Signal interrupted. Retry.");
        } finally {
          setIsAnalyzingVoice(false);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Mic start fail", err);
      }
    }
  };

  const resetAll = () => {
    setTimer(120);
    setTimerActive(false);
    setOpponentFormation('');
    setOpponentStyle('');
    setStrategy(null);
    setActiveQuickCounter(null);
    setAiResponse('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-6xl font-gaming gradient-text uppercase">Match Engine</h2>
        <p className="text-slate-500 text-sm tracking-widest font-black uppercase">Quick Counter + Tactical Uplink</p>
      </div>

      {/* Timer Bar */}
      <div className={`glass p-4 rounded-2xl flex items-center justify-between ${theme === 'light' ? 'bg-white shadow-lg' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="text-2xl">⏱️</span>
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase">Match Timer</div>
            <div className={`text-3xl font-mono font-bold ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="px-6 py-3 border border-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-slate-800 transition-all"
        >
          Reset All
        </button>
      </div>

      {/* Quick Counter Grid */}
      <div className={`glass p-8 rounded-3xl space-y-6 ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h3 className="text-xl font-gaming text-green-500 uppercase">Quick Counter</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase">Tap opponent formation for instant counter</p>
            </div>
          </div>
          {isCalculating && (
            <div className="flex items-center gap-2 text-blue-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase">Analyzing...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickCounters.map(qc => (
            <button
              key={qc.id}
              onClick={() => handleQuickCounter(qc.id)}
              disabled={isCalculating}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${activeQuickCounter === qc.id
                  ? 'border-green-500 bg-green-500/10 scale-105 shadow-lg shadow-green-500/20'
                  : theme === 'light'
                    ? 'border-slate-200 hover:border-green-500'
                    : 'border-slate-800 hover:border-green-500'
                } ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">{qc.icon}</span>
              <span className="text-sm font-gaming">{qc.label}</span>
              <span className="text-[8px] text-slate-500 font-black uppercase">{qc.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual Input + Strategy Result */}
        <div className={`glass p-8 rounded-3xl border-l-4 border-red-600 space-y-6 ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-xl font-gaming text-red-500 uppercase">Blitz Strategist</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase">Manual tactical analysis</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Opponent Formation</label>
              <input
                type="text"
                value={opponentFormation}
                onChange={e => setOpponentFormation(e.target.value)}
                placeholder="e.g., 4-3-3, 4-2-2-2, 5-3-2..."
                className={`w-full p-4 rounded-xl outline-none text-sm ${theme === 'light' ? 'bg-slate-100 border' : 'bg-slate-900 border border-slate-800'} focus:border-red-500`}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Opponent Playstyle</label>
              <div className="flex flex-wrap gap-2">
                {playstyles.map(style => (
                  <button
                    key={style}
                    onClick={() => setOpponentStyle(opponentStyle === style ? '' : style)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${opponentStyle === style
                        ? 'bg-red-600 text-white'
                        : theme === 'light'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating || (!opponentFormation && !opponentStyle)}
            className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCalculating || (!opponentFormation && !opponentStyle)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500 shadow-lg'
              }`}
          >
            {isCalculating ? '🧠 Calculating Counter...' : '⚔️ Calculate Counter Strategy'}
          </button>

          {/* Strategy Result */}
          {strategy && (
            <div className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-[10px] font-black text-red-500 uppercase">Counter Strategy</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{strategy}</div>
            </div>
          )}
        </div>

        {/* Voice Assistant */}
        <div className={`glass p-8 rounded-3xl border-l-4 border-blue-600 flex flex-col items-center justify-center space-y-6 ${theme === 'light' ? 'bg-white shadow-xl' : ''}`}>
          <div className="text-center">
            <h3 className="text-xl font-gaming text-blue-500 uppercase">Touchline Voice</h3>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-1">Real-time AI coaching</p>
          </div>

          <div className="relative">
            <button
              onClick={toggleVoice}
              disabled={isAnalyzingVoice}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isListening
                  ? 'bg-red-600 animate-pulse scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                  : isAnalyzingVoice
                    ? 'bg-blue-900 scale-110'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-xl hover:scale-105'
                }`}
            >
              <span className="text-4xl">{isListening ? '🛑' : isAnalyzingVoice ? '🧠' : '🎙️'}</span>
            </button>
            {isAnalyzingVoice && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
              {isListening ? 'Listening...' : isAnalyzingVoice ? 'AI Processing...' : 'Tap to speak'}
            </p>
            <p className="text-[8px] text-slate-600 max-w-[200px]">
              Describe your match situation and get instant tactical advice
            </p>
          </div>

          {aiResponse && (
            <div className="w-full p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-[9px] font-black text-blue-500 uppercase">Coach Advice</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">"{aiResponse}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    const savedUser = localStorage.getItem('efooty_user');
    if (savedUser) setAuthState({ isAuthenticated: true, user: JSON.parse(savedUser) });

    const sync = () => {
      setGlobalAlert(sharedStore.getGlobalAlert());
      setTactics(sharedStore.getTactics());
      setNotifications(sharedStore.getNotifications());
    };
    sync();
    const interval = setInterval(sync, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchInsights = async () => {
        setIsLoadingInsights(true);
        const insights = await geminiService.getLiveMetaInsights();
        const creators = await geminiService.getTrendingCreators();
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

      {activeTab === 'match' && <MatchMode theme={theme} isAuthenticated={authState.isAuthenticated} onOpenAuth={() => setShowAuthModal(true)} />}

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

      {showAuthModal && (
        <AuthNode
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => { setAuthState({ isAuthenticated: true, user: u }); setShowAuthModal(false); }}
          theme={theme}
        />
      )}

      {showProfileModal && authState.user && (
        <div className="fixed inset-0 z-[800] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className={`glass w-full max-w-md rounded-[2.5rem] p-10 relative animate-scaleIn ${theme === 'light' ? 'bg-white' : ''}`}>
            <button onClick={() => setShowProfileModal(false)} className="absolute top-8 right-8 text-slate-500 text-xl">✕</button>
            <h2 className="text-4xl font-gaming gradient-text uppercase tracking-widest text-center mb-8">Node Profile</h2>
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-4xl font-gaming text-white shadow-2xl">
                  {authState.user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Username</label>
                  <div className="text-sm font-bold">{authState.user.username}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Efootball Name</label>
                  <div className="text-sm font-bold">{authState.user.efootballName}</div>
                </div>
              </div>
              <button onClick={() => { localStorage.removeItem('efooty_user'); setAuthState({ isAuthenticated: false, user: null }); setShowProfileModal(false); }} className="w-full py-4 bg-red-600/10 text-red-500 font-black uppercase text-[10px] rounded-2xl border border-red-500/20 hover:bg-red-600/20 transition-all">TERMINATE SESSION</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
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
    const users = sharedStore.getUsers();
    if (tab === 'login') {
      const user = users.find(u => (u.email === formData.email || u.username === formData.email) && u.password === formData.password);
      if (user) {
        if (user.status === 'suspended') setError("ACCESS REVOKED.");
        else {
          localStorage.setItem('efooty_user', JSON.stringify(user));
          onSuccess(user);
        }
      } else setError("Invalid credentials.");
    } else if (tab === 'signup') {
      const exists = users.find(u => u.email === formData.email || u.username === formData.username);
      if (exists) setError("Identity cluster already registered.");
      else {
        const newUser: User = { id: Date.now().toString(), email: sanitize(formData.email), username: sanitize(formData.username), efootballName: sanitize(formData.eid), password: formData.password, isAdmin: false, isVerified: false, joinedDate: new Date().toLocaleDateString(), status: 'active' };
        sharedStore.saveUser(newUser);
        sharedStore.addNotification({ id: Date.now().toString(), type: 'signup', message: `New Node Initialized: ${newUser.username}`, details: `Registered via ${newUser.email}.`, timestamp: new Date().toLocaleTimeString() });
        setTab('login');
        setError("Success! Login now.");
      }
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
