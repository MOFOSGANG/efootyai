
import React, { useState, useEffect } from 'react';
import { NewsItem, ContentSubmission, NewsCategory, User } from '../types';
import { geminiService } from '../services/geminiService';
import { sharedStore } from '../sharedStore';

interface CommunityHubProps {
  theme: 'dark' | 'light';
  user: User | null;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ theme, user }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submission, setSubmission] = useState<ContentSubmission>({
    title: '', link: '', category: 'News', description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const allPosts = sharedStore.getPosts();
      setNews(allPosts.filter(p => p.status === 'approved'));
    };
    sync();
    const i = setInterval(sync, 10000);
    return () => clearInterval(i);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const latest = await geminiService.scrapeLatestNews();
    if (latest.length > 0) {
      latest.forEach(post => {
        const posts = sharedStore.getPosts();
        if (!posts.find(p => p.title === post.title)) sharedStore.addPost(post);
      });
      setNews(sharedStore.getPosts().filter(p => p.status === 'approved').slice(0, 20));
    }
    setIsRefreshing(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setSubmission(prev => ({ ...prev, mediaFile: event.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("System Identity required for broadcast. Access the Hub first.");

    setIsSubmitting(true);
    const id = 'META-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setUploadId(id);
    setModerationFeedback("INITIALIZING BROADCAST NODE...");

    try {
      // AI Moderation starts immediately
      const result = await geminiService.moderateSubmission(submission);

      const newItem: NewsItem = {
        id: id,
        title: submission.title,
        summary: submission.description,
        category: result.refinedCategory as NewsCategory || submission.category,
        url: submission.link,
        mediaUrl: submission.mediaFile,
        timestamp: 'Just now',
        author: user.username,
        status: 'pending',
        thumbnail: submission.mediaFile || `https://picsum.photos/seed/${id}/400/200`
      };

      sharedStore.addPost(newItem);
      sharedStore.addNotification({
        id: Date.now().toString(),
        type: 'moderation',
        message: `INTEL RECEIVED: ${id}`,
        details: `Transmission from node ${user.username} is in quarantine for final validation. Status: UNDER REVIEW.`,
        timestamp: new Date().toLocaleTimeString()
      });

      setModerationFeedback(`BROADCAST SUCCESS! ID: ${id} - UNDER REVIEW.`);

      setTimeout(() => {
        setShowSubmitModal(false);
        setModerationFeedback(null);
        setUploadId(null);
        setSubmission({ title: '', link: '', category: 'News', description: '' });
      }, 4000);

    } catch (err) {
      console.error("Submission Error:", err);
      setModerationFeedback("Transmission relay interrupted. Retrying...");
      setTimeout(() => setIsSubmitting(false), 2000);
    } finally {
      // Logic for keeping the modal open briefly to show the ID
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className={`text-5xl font-gaming mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Intelligence Feed</h2>
          <p className="text-slate-500 text-sm max-w-lg">Live tactical telemetry and social meta trends.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRefresh} disabled={isRefreshing} className={`px-5 py-2.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass border-green-500/30 text-green-400'}`}>
            {isRefreshing ? '🤖 SCRAPING...' : '🔄 REFRESH HUB'}
          </button>
          <button onClick={() => setShowSubmitModal(true)} className="px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95">
            + BROADCAST INTEL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-30 text-sm uppercase font-black tracking-[0.4em]">🛰️ Waiting for Global Signals...</div>
        ) : (
          news.map(item => (
            <div key={item.id} className={`rounded-[2rem] overflow-hidden border transition-all group flex flex-col ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'glass border-slate-800 hover:border-blue-500/20 shadow-lg'}`}>
              <div className="h-52 overflow-hidden relative">
                <img src={item.thumbnail || item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <span className="absolute top-4 left-4 text-[9px] font-black px-3 py-1.5 rounded-lg backdrop-blur-md bg-white/10 text-white uppercase border border-white/10">{item.category}</span>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase mb-4"><span>{item.author}</span><span>{item.timestamp}</span></div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                <p className="text-sm opacity-80 mb-6 line-clamp-3 leading-relaxed">{item.summary}</p>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-400 uppercase hover:text-blue-300">Explore Data ↗</a>}
                  <button className="text-[10px] font-black text-green-500 uppercase hover:underline">Full Analysis →</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className={`glass w-full max-w-xl rounded-[2.5rem] border p-12 space-y-8 relative animate-scaleIn ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl' : 'border-slate-800 shadow-[0_0_50px_rgba(30,58,138,0.2)]'}`}>
            <button onClick={() => setShowSubmitModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            <div className="text-center space-y-3">
              <h3 className="text-5xl font-gaming gradient-text tracking-tighter">Broadcast Intel</h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">AI-Powered Submission Node</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select value={submission.category} onChange={e => setSubmission({ ...submission, category: e.target.value as NewsCategory })} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none"><option value="Video">Video</option><option value="Tutorial">Tutorial</option><option value="Guide">Guide</option><option value="News">News</option></select>
                <input required value={submission.title} onChange={e => setSubmission({ ...submission, title: e.target.value })} placeholder="Intel Title" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
              </div>
              <input value={submission.link} onChange={e => setSubmission({ ...submission, link: e.target.value })} placeholder="Link (YouTube/X/Tiktok)" className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold focus:border-blue-500 outline-none" />
              <label className="flex flex-col items-center border-2 border-dashed border-slate-800 rounded-3xl p-6 cursor-pointer hover:bg-white/5 transition-all group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</span>
                <span className="text-[10px] font-black uppercase text-slate-500">{submission.mediaFile ? 'ASSET ENCRYPTED' : 'ATTACH TACTICAL ASSET'}</span>
                <input type="file" className="hidden" onChange={handleFile} accept="image/*,video/*" />
              </label>
              <textarea required value={submission.description} onChange={e => setSubmission({ ...submission, description: e.target.value })} rows={3} placeholder="Describe tactical importance and meta relevance..." className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium focus:border-blue-500 outline-none" />

              {moderationFeedback && (
                <div className={`p-5 rounded-2xl border text-[10px] font-black uppercase text-center animate-pulse shadow-inner ${uploadId ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  {moderationFeedback}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
                {isSubmitting ? '🤖 SCANNING TRANSMISSION...' : '🚀 INITIALIZE BROADCAST'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;
