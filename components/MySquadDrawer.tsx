
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Squad, SquadMember } from '../types';
import { geminiService } from '../services/geminiService';

interface MySquadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

// Coach playstyle options
const COACH_PLAYSTYLES = [
  'Possession Game', 'Quick Counter', 'Long Ball Counter', 'Out Wide',
  'Long Ball', 'All-Out Defense', 'High Pressing', 'Balanced'
];

const MySquadDrawer: React.FC<MySquadDrawerProps> = ({ isOpen, onClose, theme }) => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchSquads = async () => {
      try {
        const data = await apiService.getSquads();
        // Ensure we always have 3 slots as per original design
        const slots = ['1', '2', '3'].map(id => {
          const existing = data.find(s => s.id === id);
          return existing || { id, name: `Squad ${id}`, manager: 'TBA', players: [] };
        });
        setSquads(slots);
      } catch (err) { console.error("Squad sync failed"); }
    };
    if (isOpen) fetchSquads();
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, squadId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const analysis = await geminiService.analyzeSquadScreenshot(base64);
        // Only auto-populate players from AI, keep manager for manual input
        const updatedSquads = squads.map(s => {
          if (s.id === squadId) {
            return {
              ...s,
              // Don't auto-set manager - let user input it manually
              players: analysis.players || s.players,
              screenshot: event.target?.result as string,
              // Clear previous analysis when new screenshot is uploaded
              lastAnalysis: undefined
            };
          }
          return s;
        });
        setSquads(updatedSquads);
        const target = updatedSquads.find(s => s.id === squadId);
        if (target) apiService.updateSquad(target.id, target);
      } catch (err) {
        alert("AI Scan failed. Please check your image quality.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSquadManual = (squadId: string, field: keyof Squad, value: any) => {
    const updated = squads.map(s => s.id === squadId ? { ...s, [field]: value } : s);
    setSquads(updated);
    const target = updated.find(s => s.id === squadId);
    if (target) apiService.updateSquad(target.id, target);
  };

  const updatePlayerManual = (squadId: string, index: number, field: keyof SquadMember, value: any) => {
    const updated = squads.map(s => {
      if (s.id === squadId) {
        const newPlayers = [...s.players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        return { ...s, players: newPlayers };
      }
      return s;
    });
    setSquads(updated);
    const target = updated.find(s => s.id === squadId);
    if (target) apiService.updateSquad(target.id, target);
  };

  const addPlayer = (squadId: string) => {
    const updated = squads.map(s => {
      if (s.id === squadId) {
        return { ...s, players: [...s.players, { name: 'New Player', position: 'POS' }] };
      }
      return s;
    });
    setSquads(updated);
  };

  const analyzeTactics = async (squad: Squad) => {
    if (squad.players.length === 0) return alert("Upload a screenshot or add players first!");
    if (!squad.manager || squad.manager === 'TBA') return alert("Please enter your Coach name first!");
    if (!squad.coachSkill) return alert("Please select a Coach Playstyle first!");

    setIsAnalyzing(true);
    try {
      const squadText = `Coach: ${squad.manager} (Playstyle: ${squad.coachSkill}). Players: ${squad.players.map(p => `${p.name} (${p.position})`).join(', ')}`;
      const result = await geminiService.getRealTimeTactics(
        `Analyze this eFootball 2025 squad professionally:
        ${squadText}
        
        Provide:
        1. Overall Squad Rating (A-F grade)
        2. Formation Recommendation based on coach playstyle
        3. Tactical Instructions (Defensive line, pressing, build-up)
        4. Key Player Roles (who should be your playmaker, target man, etc.)
        5. Chemistry Analysis (do these players work well together?)
        6. Weakest Position that needs upgrade
        7. 2 Meta Player Suggestions to improve the squad`
      );
      updateSquadManual(squad.id, 'lastAnalysis', result);
    } catch (err) {
      alert("Analysis stream interrupted.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-start pointer-events-none">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <aside className={`w-full max-w-lg h-full pointer-events-auto shadow-2xl transition-transform duration-300 transform translate-x-0 overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#020617] border-r border-slate-800'}`}>
        <div className="p-8 pb-4 flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <h2 className="text-3xl font-gaming gradient-text uppercase tracking-widest">Squad Builder</h2>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Manual Edit & AI Intelligence</p>
          </div>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100 p-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-32">
          {squads.map(squad => (
            <div key={squad.id} className={`p-6 rounded-3xl border transition-all relative ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'border-slate-800 bg-slate-900/20'}`}>
              <div className="flex justify-between items-center mb-6">
                <input
                  value={squad.name}
                  onChange={e => updateSquadManual(squad.id, 'name', e.target.value)}
                  className="bg-transparent font-bold text-xl outline-none border-b border-transparent focus:border-green-500/30 w-1/2"
                />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Slot {squad.id}</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Coach Name Input */}
                <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">👔 Coach Name</label>
                  <input
                    value={squad.manager}
                    onChange={e => updateSquadManual(squad.id, 'manager', e.target.value)}
                    placeholder="Enter your coach/manager name..."
                    className={`w-full text-sm bg-transparent outline-none font-bold placeholder-slate-600 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}
                  />
                </div>

                {/* Coach Playstyle Selector */}
                <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">⚽ Coach Playstyle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COACH_PLAYSTYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => updateSquadManual(squad.id, 'coachSkill', style)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${squad.coachSkill === style
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
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

                {squad.screenshot ? (
                  <div className="relative group rounded-2xl overflow-hidden aspect-video bg-black border border-slate-800">
                    <img src={squad.screenshot} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="Squad Screenshot" />
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <label className="cursor-pointer bg-blue-600/80 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">
                        📷 Replace
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, squad.id)} />
                      </label>
                      <button
                        onClick={() => {
                          const updated = squads.map(s =>
                            s.id === squad.id ? { ...s, screenshot: undefined, players: [], manager: 'TBA', lastAnalysis: undefined } : s
                          );
                          setSquads(updated);
                          const target = updated.find(s => s.id === squad.id);
                          if (target) apiService.updateSquad(target.id, target);
                        }}
                        className="bg-red-600/80 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <div className="text-center">
                          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-[10px] font-black text-green-500 uppercase">AI Scanning...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl h-40 cursor-pointer hover:bg-white/5 transition-all group ${isScanning ? 'opacity-50 pointer-events-none' : ''} ${theme === 'light' ? 'border-slate-300' : 'border-slate-800'}`}>
                    {isScanning ? (
                      <>
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] font-black text-green-500 uppercase">Scanning Image...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📸</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Import Formation Screenshot</span>
                        <p className="text-[8px] text-slate-600 mt-1 uppercase">AI will extract players automatically</p>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, squad.id)} disabled={isScanning} />
                  </label>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personnel Registry</h4>
                    <button onClick={() => addPlayer(squad.id)} className="text-[9px] font-black text-green-500 uppercase hover:underline">+ Add Player</button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {squad.players.map((p, idx) => (
                      <div key={idx} className="flex gap-2 animate-fadeIn" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <input
                          value={p.position}
                          onChange={e => updatePlayerManual(squad.id, idx, 'position', e.target.value.toUpperCase())}
                          placeholder="POS"
                          className="w-14 bg-slate-900/60 border border-slate-800 p-2 rounded-xl text-[10px] font-black text-center text-green-500 uppercase outline-none focus:border-green-500/50"
                        />
                        <input
                          value={p.name}
                          onChange={e => updatePlayerManual(squad.id, idx, 'name', e.target.value)}
                          placeholder="Player Name"
                          className="flex-1 bg-slate-900/60 border border-slate-800 p-2 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={() => {
                            const newPlayers = squad.players.filter((_, i) => i !== idx);
                            updateSquadManual(squad.id, 'players', newPlayers);
                          }}
                          className="p-2 text-slate-600 hover:text-red-500"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                  <button
                    onClick={() => analyzeTactics(squad)}
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAnalyzing ? 'bg-slate-800 text-slate-500 animate-pulse' : 'bg-green-600 text-white shadow-lg hover:bg-green-500 shadow-green-500/20'}`}
                  >
                    {isAnalyzing ? 'ORACLE THINKING...' : '⚡ Invoke Tactical Analysis'}
                  </button>

                  {squad.lastAnalysis && (
                    <div className={`p-6 rounded-2xl text-xs leading-relaxed italic border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-green-500/5 border-green-500/20 text-green-400'}`}>
                      <div className="text-[9px] font-black uppercase mb-3 opacity-50">AI Strategic Report</div>
                      {squad.lastAnalysis}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 shrink-0 border-t border-slate-800/20 bg-inherit text-[8px] text-center text-slate-600 font-black uppercase tracking-[0.3em]">
          Builder Module ACTIVE // v5.1.0-REVOLUTION
        </div>
      </aside>
    </div>
  );
};

export default MySquadDrawer;
