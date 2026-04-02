/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Settings, 
  Radio as RadioIcon, 
  Camera, 
  Newspaper, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink,
  RefreshCw,
  Layout,
  EyeOff,
  Eye,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { CityConfig, AppConfig } from "./types";

// --- Components ---

const BackgroundCarousel = ({ cameras }: { cameras: string[] }) => {
  const [idx, setIdx] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (cameras.length === 0) return;
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % cameras.length);
      setRefreshKey(k => k + 1);
    }, 15000); // Switch every 15 seconds
    return () => clearInterval(interval);
  }, [cameras]);

  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${cameras[idx]}-${refreshKey}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={`${cameras[idx]}?t=${refreshKey}`}
            alt="Background Traffic"
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1545147986-a9d6f210df77?auto=format&fit=crop&q=80&w=1920";
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

const RadioPlayer = ({ url, isHidden, onToggle, showUI, theme }: { url: string; isHidden: boolean; onToggle: () => void; showUI: boolean; theme: CityConfig['theme'] }) => (
  <div className={cn(
    "transition-all duration-700 ease-in-out relative group",
    isHidden ? "w-16 h-16" : "w-full h-64",
    isHidden && !showUI && "opacity-0 scale-0"
  )}>
    <div className={cn(
      "w-full h-full backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-700",
      isHidden ? "rounded-full flex items-center justify-center cursor-pointer scale-90 hover:scale-100" : "opacity-100"
    )}
    style={{ backgroundColor: `${theme.background}CC` }}
    onClick={() => isHidden && onToggle()}
    >
      {/* The iframe is always present to keep audio playing */}
      <div className={cn("w-full h-full transition-opacity duration-500", isHidden ? "opacity-0 pointer-events-none absolute" : "opacity-100")}>
        <iframe
          src={url}
          className="w-full h-full"
          allow="autoplay"
          title="Police Radio"
        />
      </div>

      {isHidden && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center justify-center gap-0.5"
        >
          <RadioIcon className="w-5 h-5 animate-pulse" style={{ color: theme.primary }} />
          <span className="text-[8px] font-black uppercase tracking-tighter" style={{ color: `${theme.primary}99` }}>Live</span>
        </motion.div>
      )}
      
      {!isHidden && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-all z-20 border border-white/5"
          title="Minimize to background"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// --- Main Views ---

const StreamView = ({ city, showUI }: { city: CityConfig; showUI: boolean }) => {
  const [isRadioHidden, setIsRadioHidden] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const allNews = await Promise.all(
          city.feeds.map(async (url) => {
            const res = await fetch(`/api/news?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return (data.items || []).map((item: any) => ({
              ...item,
              source: data.title || "News"
            }));
          })
        );
        setNews(allNews.flat().sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()));
      } catch (e) {
        console.error("News fetch error", e);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [city.feeds]);

  const tickerText = useMemo(() => {
    if (news.length === 0) return "INITIALIZING NEWS FEEDS • SYSTEM ONLINE • MONITORING DISPATCH";
    return news.slice(0, 15).map(item => `${item.source.toUpperCase()}: ${item.title}`).join(" • ");
  }, [news]);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ backgroundColor: city.theme.background, color: city.theme.text }}>
      {/* Top Bar */}
      <div 
        className="h-20 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-8 z-20 shadow-2xl"
        style={{ backgroundColor: `${city.theme.background}CC` }}
      >
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col gap-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: city.theme.primary, boxShadow: `0 0 15px ${city.theme.primary}` }} />
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              {city.name} <span className="font-light opacity-40">{city.subtitle}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 pl-6" style={{ color: city.theme.primary }}>
            {city.tagline}
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-6"
        >
          <div className="flex flex-col items-end">
            <div className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">System Time</div>
            <div className="text-2xl font-black font-mono leading-none tracking-tighter" style={{ color: city.theme.primary }}>
              {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col p-8">
        <BackgroundCarousel cameras={city.cameras} />

        {/* Center Content (Radio) */}
        <div className="flex-1 flex items-center justify-start z-10">
          <div className="w-full max-w-md">
            <RadioPlayer 
              url={city.radioUrl} 
              isHidden={isRadioHidden} 
              onToggle={() => setIsRadioHidden(!isRadioHidden)} 
              showUI={showUI}
              theme={city.theme}
            />
          </div>
        </div>

        {/* Footer Ticker */}
        <div className="z-10 mt-auto">
          <div 
            className="h-12 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: `${city.theme.background}99` }}
          >
            <div 
              className="px-6 h-full flex items-center text-xs font-black uppercase tracking-tighter italic z-20 shadow-[10px_0_20px_rgba(0,0,0,0.3)]"
              style={{ backgroundColor: city.theme.primary, color: city.theme.background }}
            >
              Local News
            </div>
            <div className="flex-1 px-4 overflow-hidden relative">
              <div className="whitespace-nowrap animate-marquee text-sm font-bold uppercase tracking-wide opacity-90">
                {tickerText} • {tickerText}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 120s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

const AdminView = ({ config, onSave }: { config: AppConfig, onSave: (newConfig: AppConfig) => void }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeCityIdx, setActiveCityIdx] = useState(0);

  const activeCity = localConfig.cities[activeCityIdx];

  const updateCity = (updates: Partial<CityConfig>) => {
    const newCities = [...localConfig.cities];
    newCities[activeCityIdx] = { ...activeCity, ...updates };
    setLocalConfig({ ...localConfig, cities: newCities });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Stream Management</h1>
              <p className="text-slate-500 text-sm">Configure your city sources and themes</p>
            </div>
          </div>
          <button 
            onClick={() => onSave(localConfig)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Cities</div>
            {localConfig.cities.map((city, idx) => (
              <button
                key={city.id}
                onClick={() => setActiveCityIdx(idx)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group",
                  activeCityIdx === idx ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 text-slate-400"
                )}
              >
                <span className="font-medium">{city.name}</span>
                <Layout className={cn("w-4 h-4 opacity-0 transition-opacity", activeCityIdx === idx && "opacity-100")} />
              </button>
            ))}
            <button 
              onClick={() => {
                const newCity: CityConfig = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: "New City",
                  radioUrl: "",
                  subtitle: "Dispatch",
                  tagline: "Live Police, Interstate Traffic, and News",
                  cameras: [],
                  feeds: [],
                  theme: { primary: "#3b82f6", background: "#0f172a", text: "#f8fafc" }
                };
                setLocalConfig({ ...localConfig, cities: [...localConfig.cities, newCity] });
              }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add City
            </button>
          </div>

          {/* Editor */}
          <div className="col-span-9 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">City Name</label>
                <input 
                  value={activeCity.name}
                  onChange={e => updateCity({ name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Radio Player URL</label>
                <input 
                  value={activeCity.radioUrl}
                  onChange={e => updateCity({ radioUrl: e.target.value })}
                  placeholder="https://www.broadcastify.com/webPlayer/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Subtitle (e.g. Dispatch)</label>
                <input 
                  value={activeCity.subtitle}
                  onChange={e => updateCity({ subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tagline (Subtitle Bar)</label>
                <input 
                  value={activeCity.tagline}
                  onChange={e => updateCity({ tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">Traffic Cameras (Image URLs)</label>
                <button 
                  onClick={() => updateCity({ cameras: [...activeCity.cameras, ""] })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Camera
                </button>
              </div>
              <div className="space-y-2">
                {activeCity.cameras.map((cam, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={cam}
                      onChange={e => {
                        const newCams = [...activeCity.cameras];
                        newCams[idx] = e.target.value;
                        updateCity({ cameras: newCams });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm"
                    />
                    <button 
                      onClick={() => {
                        const newCams = activeCity.cameras.filter((_, i) => i !== idx);
                        updateCity({ cameras: newCams });
                      }}
                      className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">News RSS Feeds</label>
                <button 
                  onClick={() => updateCity({ feeds: [...activeCity.feeds, ""] })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Feed
                </button>
              </div>
              <div className="space-y-2">
                {activeCity.feeds.map((feed, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={feed}
                      onChange={e => {
                        const newFeeds = [...activeCity.feeds];
                        newFeeds[idx] = e.target.value;
                        updateCity({ feeds: newFeeds });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm"
                    />
                    <button 
                      onClick={() => {
                        const newFeeds = activeCity.feeds.filter((_, i) => i !== idx);
                        updateCity({ feeds: newFeeds });
                      }}
                      className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase mb-4 block">Theme Configuration</label>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-600 uppercase">Background</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={activeCity.theme.background}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, background: e.target.value } })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent"
                    />
                    <input 
                      value={activeCity.theme.background}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, background: e.target.value } })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-600 uppercase">Primary Accent</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={activeCity.theme.primary}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, primary: e.target.value } })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent"
                    />
                    <input 
                      value={activeCity.theme.primary}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, primary: e.target.value } })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-600 uppercase">Text Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={activeCity.theme.text}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, text: e.target.value } })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent"
                    />
                    <input 
                      value={activeCity.theme.text}
                      onChange={e => updateCity({ theme: { ...activeCity.theme, text: e.target.value } })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<"stream" | "admin">("stream");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowUI(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowUI(false);
      }, 3000); // Hide after 3 seconds of inactivity
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data));
  }, []);

  const handleSave = async (newConfig: AppConfig) => {
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      setConfig(newConfig);
      alert("Configuration saved successfully!");
    } catch (e) {
      alert("Failed to save configuration.");
    }
  };

  if (!config) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* View Switcher (Hidden on stream usually, but for demo we show it) */}
      <div className={cn(
        "fixed top-4 right-4 z-50 flex gap-2 transition-opacity duration-500",
        !showUI && view === "stream" && "opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={() => setView(view === "stream" ? "admin" : "stream")}
          className="p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors group"
          title={view === "stream" ? "Management UI" : "Stream View"}
        >
          {view === "stream" ? <Settings className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "stream" ? (
          <motion.div
            key="stream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <StreamView city={config.cities[activeCityIdx]} showUI={showUI} />
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AdminView config={config} onSave={handleSave} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
