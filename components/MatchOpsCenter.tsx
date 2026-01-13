import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';

interface MatchOpsCenterProps {
    theme: 'dark' | 'light';
    isAuthenticated: boolean;
    onOpenAuth: () => void;
}

const MatchOpsCenter: React.FC<MatchOpsCenterProps> = ({ theme, isAuthenticated, onOpenAuth }) => {
    const [timer, setTimer] = useState(120);
    const [timerActive, setTimerActive] = useState(false);
    const [opponentFormation, setOpponentFormation] = useState('');
    const [opponentStyle, setOpponentStyle] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [strategy, setStrategy] = useState<string | null>(null);
    const [activeQuickCounter, setActiveQuickCounter] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [metaInsights, setMetaInsights] = useState<any>(null);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const fetchMeta = async () => {
            setIsLoadingMeta(true);
            try {
                const insights = await geminiService.getLiveMetaInsights();
                setMetaInsights(insights);
            } catch (err) { console.error("Meta sync failed"); }
            finally { setIsLoadingMeta(false); }
        };
        fetchMeta();
    }, []);

    // Quick Counter Options
    const quickCounters = [
        { id: '4-3-3', label: '4-3-3', icon: '⚔️', desc: 'Wing Attack' },
        { id: '4-4-2', label: '4-4-2', icon: '🛡️', desc: 'Balanced' },
        { id: '4-2-3-1', label: '4-2-3-1', icon: '💎', desc: 'Control' },
        { id: '4-1-2-1-2', label: '4-1-2-1-2', icon: '🎯', desc: 'Narrow Diamond' },
        { id: '5-3-2', label: '5-3-2', icon: '🏰', desc: 'Low Block' },
        { id: '4-3-1-2', label: '4-3-1-2', icon: '⚡', desc: 'Quick Attack' },
    ];

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
            if (!timerActive) setTimerActive(true);
        } catch (err) {
            setStrategy("Tactical link failed. Try again.");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleManualCalculate = async () => {
        if (!isAuthenticated) return onOpenAuth();
        setIsCalculating(true);
        setStrategy(null);
        try {
            const result = await geminiService.quickStrategy(`Analyze and counter: ${opponentFormation} with ${opponentStyle} playstyle`);
            setStrategy(result);
            if (!timerActive) setTimerActive(true);
        } catch {
            setStrategy("Analysis failed.");
        } finally {
            setIsCalculating(false);
        }
    };

    const toggleVoice = () => {
        if (!isAuthenticated) return onOpenAuth();
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) return alert("Voice recognition not supported in this browser.");

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setAiResponse('');
            setIsAnalyzingVoice(false);
            const recognition = new SpeechRec();
            recognition.lang = 'en-US';
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = async (e: any) => {
                const text = e.results[0][0].transcript;
                setIsListening(false);
                setIsAnalyzingVoice(true);
                try {
                    const res = await geminiService.analyzeVoiceCommentary(text);
                    setAiResponse(res);
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.speak(new SpeechSynthesisUtterance(res));
                    }
                } catch { setAiResponse("Signal failed."); }
                finally { setIsAnalyzingVoice(false); }
            };
            recognition.onerror = () => setIsListening(false);
            recognition.start();
            recognitionRef.current = recognition;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full group-hover:bg-green-500/10 transition-all"></div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-7xl font-gaming gradient-text tracking-tighter uppercase leading-none">Ops Center</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Tactical Uplink Live [D-04]
                    </p>
                </div>

                <div className="flex items-center gap-10 relative z-10 bg-black/40 p-6 rounded-3xl border border-white/5">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Match Clock</p>
                        <div className={`text-5xl font-mono font-black ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                            {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                        </div>
                    </div>
                    <div className="w-[1px] h-12 bg-white/10"></div>
                    <button
                        onClick={() => { setTimer(120); setTimerActive(false); setStrategy(null); setAiResponse(''); }}
                        className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl transition-all hover:rotate-180"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* QUICK STRIKE PANEL */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-10 rounded-[2.5rem] border border-slate-800 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-gaming text-green-500 uppercase">Quick Strike</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Select formation for neural baseline</p>
                            </div>
                            {isCalculating && <div className="text-green-500 text-[10px] font-black uppercase animate-pulse">Thinking...</div>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {quickCounters.map(qc => (
                                <button
                                    key={qc.id}
                                    onClick={() => handleQuickCounter(qc.id)}
                                    disabled={isCalculating}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${activeQuickCounter === qc.id
                                        ? 'border-green-500 bg-green-500/10 shadow-[0_0_50px_rgba(34,197,94,0.15)] ring-1 ring-green-500'
                                        : 'border-slate-800 bg-slate-900/20 hover:border-green-500/50'
                                        }`}
                                >
                                    <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{qc.icon}</span>
                                    <div className="text-center">
                                        <div className="text-lg font-gaming uppercase tracking-tighter">{qc.label}</div>
                                        <div className="text-[8px] text-slate-600 font-black uppercase mt-1 opacity-60">{qc.desc}</div>
                                    </div>
                                    {activeQuickCounter === qc.id && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC RESPONSE FEED */}
                    {strategy && (
                        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-600/10 to-blue-600/5 border border-green-500/20 shadow-2xl animate-slideUp">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-2xl shadow-lg shadow-green-500/20">📋</div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-green-400">Tactical Directives</h4>
                            </div>
                            <div className="text-lg text-slate-200 leading-relaxed font-medium space-y-4">
                                {strategy.split('\n').map((line, i) => (
                                    <p key={i} className="flex gap-4">
                                        <span className="text-green-500/40 font-mono text-xs mt-1.5">{String(i + 1).padStart(2, '0')}</span>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* VOICE & CUSTOM ANALYSIS */}
                <div className="space-y-8">
                    {/* VOICE MOD COMMAND */}
                    <div className="glass p-10 rounded-[2.5rem] border border-blue-600/20 flex flex-col items-center justify-center space-y-8 text-center bg-gradient-to-b from-blue-600/5 to-transparent">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-gaming text-blue-500 uppercase">Neural Voice</h3>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest max-w-[200px] mx-auto">Instant battlefield override via voice command</p>
                        </div>

                        <button
                            onClick={toggleVoice}
                            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 relative ${isListening
                                ? 'bg-red-600 animate-pulse scale-110'
                                : isAnalyzingVoice
                                    ? 'bg-blue-900'
                                    : 'bg-blue-600 hover:scale-105 shadow-2xl shadow-blue-900/40'
                                }`}
                        >
                            <span className="text-5xl">{isListening ? '🛑' : isAnalyzingVoice ? '🧠' : '🎙️'}</span>
                            {isListening && <div className="absolute inset-0 border-8 border-red-500/50 rounded-[2.5rem] animate-ping"></div>}
                        </button>

                        {aiResponse && (
                            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-sm italic text-blue-100 flex gap-3 animate-fadeIn">
                                <span className="text-lg opacity-50">🧭</span>
                                <p>"{aiResponse}"</p>
                            </div>
                        )}
                    </div>

                    {/* CUSTOM TACTICAL GRID */}
                    <div className="glass p-10 rounded-[2.5rem] border border-slate-800 space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Manual Override</h4>
                        <div className="space-y-4">
                            <input
                                value={opponentFormation}
                                onChange={e => setOpponentFormation(e.target.value)}
                                placeholder="Opponent Formation..."
                                className="w-full bg-slate-900/50 border border-slate-800 p-5 rounded-2xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 text-sm font-bold uppercase transition-all"
                            />
                            <div className="flex flex-wrap gap-2">
                                {playstyles.slice(0, 4).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setOpponentStyle(s)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${opponentStyle === s ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleManualCalculate}
                                className="w-full py-5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg"
                            >
                                Execute Analysis
                            </button>
                        </div>
                    </div>

                    {/* TRENDING META INSIGHTS */}
                    <div className="glass p-10 rounded-[2.5rem] border border-slate-800 space-y-6 bg-gradient-to-br from-green-500/5 to-transparent">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Trending Meta</h4>
                            {isLoadingMeta && <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                        {metaInsights ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Elite Pick</p>
                                    <p className="text-sm font-bold text-green-400">{metaInsights.bestFormation}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Tactical Meta</p>
                                    <p className="text-sm font-bold text-blue-400">{metaInsights.bestManager}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Key Asset</p>
                                    <p className="text-sm font-bold text-purple-400">{metaInsights.hottestCard}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-600 uppercase font-black italic">Synchronizing with global meta...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchOpsCenter;
