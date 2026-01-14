import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface LeaderboardProps {
    theme: 'dark' | 'light';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ theme }) => {
    const [leaders, setLeaders] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const data = await apiService.getLeaderboard();
                setLeaders(data);
            } catch (err) { console.error("Leaderboard fetch failed:", err); }
            setIsLoading(false);
        };
        fetchLeaders();
    }, []);

    return (
        <div className="space-y-12 animate-fadeIn pb-20">
            <div className="text-center">
                <h2 className="text-7xl font-gaming gradient-text tracking-tighter uppercase mb-4">Elite Tacticians</h2>
                <p className="text-slate-500 text-sm font-black uppercase tracking-[0.4em]">Global Node Hierarchy [Division 1]</p>
            </div>

            <div className={`glass overflow-hidden rounded-[2.5rem] border ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl' : 'border-slate-800 shadow-[0_0_50px_rgba(59,130,246,0.1)]'}`}>
                <div className="hidden md:grid grid-cols-12 gap-4 p-8 bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-4 pl-4">Tactician</div>
                    <div className="col-span-2">Specialization</div>
                    <div className="col-span-2 text-center">Intel Shared</div>
                    <div className="col-span-3 text-right pr-4">Tactical Impact</div>
                </div>

                <div className="divide-y divide-white/5">
                    {isLoading ? (
                        <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase text-blue-500">Retrieving Secure Node Data...</div>
                    ) : leaders.length === 0 ? (
                        <div className="p-20 text-center opacity-30 text-[10px] font-black uppercase">No tactical signals detected.</div>
                    ) : (
                        leaders.map((leader, index) => {
                            const impact = (leader.stats?.likesReceived || 0) + ((leader.stats?.postsApproved || 0) * 10);
                            return (
                                <div key={leader.id} className="grid grid-cols-6 md:grid-cols-12 gap-4 p-8 items-center hover:bg-white/5 transition-all group">
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-gaming text-xl border-2 ${index === 0 ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                                            index === 1 ? 'bg-slate-300/10 border-slate-300 text-slate-300' :
                                                index === 2 ? 'bg-orange-600/10 border-orange-600 text-orange-600' :
                                                    'bg-slate-800/10 border-slate-800 text-slate-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="col-span-3 md:col-span-4 flex items-center gap-4 pl-0 md:pl-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xl font-gaming text-blue-400">
                                            {leader.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                {leader.username}
                                                {leader.isVerified && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase">Master</span>}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-black uppercase mt-0.5">Joined {leader.joinedDate}</div>
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2">
                                        <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 uppercase border border-blue-500/10">{leader.rank || 'Strategist'}</span>
                                    </div>
                                    <div className="hidden md:block col-span-2 text-center text-sm font-bold">{leader.stats?.postsApproved || 0}</div>
                                    <div className="col-span-2 md:col-span-3 text-right md:pr-4">
                                        <div className="text-lg font-gaming text-green-500">{impact.toLocaleString()}</div>
                                        <div className="text-[8px] text-slate-500 font-black uppercase">Points</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass p-8 rounded-3xl border border-slate-800/50 text-center space-y-3">
                    <div className="text-3xl">🛡️</div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Master Badge</h4>
                    <p className="text-[10px] opacity-60">Verified master tacticians get priority hub placement and exclusive badges.</p>
                </div>
                <div className="glass p-8 rounded-3xl border border-slate-800/50 text-center space-y-3">
                    <div className="text-3xl">🔥</div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Trending Node</h4>
                    <p className="text-[10px] opacity-60">Most active contributors in the last 24 hours receive a 2x impact bonus.</p>
                </div>
                <div className="glass p-8 rounded-3xl border border-slate-800/50 text-center space-y-3">
                    <div className="text-3xl">💎</div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Elite Tier</h4>
                    <p className="text-[10px] opacity-60">Top 3 ranked nodes receive elite tactical flair and direct AI research access.</p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
