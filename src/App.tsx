import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { provinceData, citiesData } from "./data";
import { CityData } from "./types";
import ZhejiangMap from "./components/ZhejiangMap";
import {
  Building2,
  Users,
  MessageSquare,
  MessageCircle,
  MapPin,
  ChevronRight,
  Search,
  CheckCircle,
  ChevronUp,
  Award
} from "lucide-react";

export default function App() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"friends" | "doctors" | "name">("friends");

  const handleSelectCity = (cityId: string | null) => {
    setSelectedCityId(cityId);
  };

  // Resolve current active dataset based on selected city (or general province overview)
  const activeData = useMemo(() => {
    if (!selectedCityId) {
      return {
        isProvince: true,
        name: "浙江省",
        updateTime: provinceData.updateTime,
        institutions: provinceData.institutions,
        doctors: provinceData.doctors,
        activeDoctors: provinceData.activeDoctors,
        activeRate: provinceData.activeRate,
        recentAdded: provinceData.recentAdded,
        singleChats: provinceData.singleChats,
        singleReplyRate: provinceData.singleReplyRate,
        avgFirstReplyTime: provinceData.avgFirstReplyTime,
        singleMessages: provinceData.singleMessages,
        groupChats: provinceData.groupChats,
        activeGroupChats: provinceData.activeGroupChats,
        activeGroupChatsRate: provinceData.activeGroupChatsRate,
        groupMembers: provinceData.groupMembers,
        activeGroupMembers: provinceData.activeGroupMembers,
        activeGroupMembersRate: provinceData.activeGroupMembersRate,
        groupMessages: provinceData.groupMessages
      };
    }

    const city = citiesData.find((c) => c.id === selectedCityId)!;
    return {
      isProvince: false,
      name: city.name,
      updateTime: "2024年8月5日 23:59:59",
      institutions: city.institutions,
      doctors: city.doctors,
      activeDoctors: city.activeDoctors,
      activeRate: parseFloat(((city.activeDoctors / city.doctors) * 100).toFixed(1)),
      recentAdded: city.recentAdded,
      singleChats: city.singleChats,
      singleReplyRate: city.singleReplyRate,
      avgFirstReplyTime: city.avgFirstReplyTime,
      singleMessages: city.singleMessages,
      groupChats: city.groupChats,
      activeGroupChats: city.activeGroupChats,
      activeGroupChatsRate: parseFloat(((city.activeGroupChats / city.groupChats) * 100).toFixed(1)),
      groupMembers: city.groupMembers,
      activeGroupMembers: city.activeGroupMembers,
      activeGroupMembersRate: parseFloat(((city.activeGroupMembers / city.groupMembers) * 100).toFixed(1)),
      groupMessages: city.groupMessages
    };
  }, [selectedCityId]);

  // Filter and sort cities list for "各地市明细"
  const filteredAndSortedCities = useMemo(() => {
    return citiesData
      .filter((city) => {
        const matchesSearch =
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.pinyin.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "friends") {
          return b.residentsAdded - a.residentsAdded;
        } else if (sortBy === "doctors") {
          return b.doctors - a.doctors;
        } else {
          return a.name.localeCompare(b.name, "zh-CN");
        }
      });
  }, [searchQuery, sortBy]);

  return (
    <div 
      className="min-h-screen bg-[#030712] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0b1528] via-[#030712] to-[#010308] text-slate-100 p-4 font-sans select-none overflow-x-hidden"
      id="applet-viewport-root"
    >
      {/* Background cyber grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,30,56,0.06)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(18,30,56,0.06)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none"></div>

      {/* Main 16:9 Dashboard Frame */}
      <div className="max-w-[1600px] mx-auto space-y-3 relative z-10">
        
        {/* Selected Area Local Notification */}
        {!activeData.isProvince && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/20 border border-emerald-500/25 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>
                当前视窗聚焦：<strong>{activeData.name}</strong>。点击其他城市或右侧按钮可重置为全省。
              </span>
            </div>
            <button
              id="clear-city-context"
              onClick={() => handleSelectCity(null)}
              className="px-2.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded text-xs transition-all border border-emerald-500/35 cursor-pointer"
            >
              返回全省
            </button>
          </motion.div>
        )}

        {/* 16:9 Widescreen Adaptive Layout columns (Maximum density, tight padding, zero blank spaces) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch" id="dashboard-columns-grid">
          
          {/* LEFT COLUMN: 4 KPIs (Hospital Profile, Resident Profile, Single Chat, Group Chat) */}
          <section className="lg:col-span-4 flex flex-col gap-3">
            
            {/* 1. 机构概况 */}
            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between border-b pb-1 border-slate-800/80">
                <h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-cyan-400 uppercase">
                  <Building2 className="w-3.5 h-3.5 text-cyan-455" />
                  机构概况
                </h3>
                <span className="text-[9px] font-mono text-gray-500">PROFILES</span>
              </div>

              {/* 3 Stats indicators in 1 row (Neat, responsive) */}
              <div className="grid grid-cols-3 gap-1.5 pb-0.5">
                {/* 入驻机构数 */}
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/80 text-center">
                  <span className="text-[9px] text-gray-500 block leading-none">入驻机构数</span>
                  <div className="mt-1 flex items-baseline justify-center gap-0.5">
                    <span className="text-base font-extrabold font-mono text-white">
                      {activeData.institutions}
                    </span>
                    <span className="text-[8px] text-gray-500">家</span>
                  </div>
                </div>

                {/* 入驻医护 */}
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/80 text-center">
                  <span className="text-[9px] text-gray-500 block leading-none">入驻医护</span>
                  <div className="mt-1 flex items-baseline justify-center gap-0.5">
                    <span className="text-base font-extrabold font-mono text-cyan-300">
                      {activeData.doctors.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-gray-500">位</span>
                  </div>
                </div>

                {/* 已激活医护 */}
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/80 text-center">
                  <span className="text-[9px] text-gray-500 block leading-none">已激活数</span>
                  <div className="mt-1 flex items-baseline justify-center gap-0.5">
                    <span className="text-base font-extrabold font-mono text-emerald-400">
                      {activeData.activeDoctors.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-gray-500">人</span>
                  </div>
                </div>
              </div>

              {/* Activation rate segment */}
              <div className="bg-cyan-950/15 border border-cyan-500/10 p-2 rounded flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400">医护人员激活率</span>
                  <span className="text-[8px] text-gray-500">已激活及签约占比</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black font-mono text-teal-400">
                    {activeData.activeRate}%
                  </span>
                  <div className="w-14 bg-slate-900 border border-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full" 
                      style={{ width: `${activeData.activeRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 居民概况 */}
            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between border-b pb-1 border-slate-800/80">
                <h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-amber-500 uppercase">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  居民概况
                </h3>
                <span className="text-[9px] font-mono text-gray-500">RESIDENTS</span>
              </div>

              <div className="py-2.5 px-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
                <div className="text-left">
                  <span className="text-[10px] tracking-wider text-gray-404 text-slate-300 block font-medium">添加好友居民数</span>
                  <p className="text-[8.5px] text-gray-500 leading-none mt-1">
                    全省居民及家医微端累计连接
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black font-mono tracking-tight text-emerald-400">
                    +{activeData.recentAdded.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-500">人</span>
                </div>
              </div>
            </div>

            {/* 3. 单聊互动概况 */}
            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between border-b pb-1 border-slate-800/80">
                <h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-cyan-400 uppercase">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-455" />
                  单聊互动概况
                </h3>
                <span className="text-[9px] font-mono text-gray-500">SINGLE CHATS</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">已回复占比</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-400">
                    {activeData.singleReplyRate}%
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">平均首次回复时长</span>
                  <span className="text-[10.5px] font-bold text-slate-200">
                    {activeData.avgFirstReplyTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">单聊总数</span>
                  <span className="font-mono font-bold text-white">
                    {activeData.singleChats.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">发送消息数</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {activeData.singleMessages.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. 群聊互动概况 */}
            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between border-b pb-1 border-slate-800/80">
                <h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-emerald-400 uppercase">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  群聊互动概况
                </h3>
                <span className="text-[9px] font-mono text-gray-500">GROUP CHATS</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">群聊总数</span>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-sm font-extrabold font-mono text-white">
                      {activeData.groupChats.toLocaleString()}
                    </span>
                    <ChevronUp className="w-3 h-3 text-emerald-500 shrink-0" />
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">发言活跃群数</span>
                  <div className="flex items-baseline justify-between gap-1 text-white">
                    <span className="text-sm font-extrabold font-mono">
                      {activeData.activeGroupChats.toLocaleString()}
                    </span>
                    <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1 rounded font-bold">
                      {activeData.activeGroupChatsRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">群成员总数</span>
                  <span className="text-[10.5px] font-bold font-mono text-white">
                    {activeData.groupMembers.toLocaleString()}人
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[9px] text-gray-500 block leading-none mb-1">活跃群成员数</span>
                  <div className="flex items-baseline justify-between gap-1 text-white">
                    <span className="text-[10.5px] font-bold font-mono">
                      {activeData.activeGroupMembers.toLocaleString()}人
                    </span>
                    <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1 rounded font-bold">
                      {activeData.activeGroupMembersRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative px-3 py-1.5 rounded border border-emerald-500/10 bg-emerald-950/10 flex justify-between items-center overflow-hidden">
                <div className="z-10">
                  <span className="text-[9.5px] text-gray-400 block leading-none mb-1.5">群聊消息总数</span>
                  <strong className="text-[15px] font-black font-mono text-emerald-400">
                    {activeData.groupMessages.toLocaleString()} <span className="text-[9px] font-normal text-slate-500">条</span>
                  </strong>
                </div>
                <div className="absolute right-2 bottom-0 text-emerald-500/10 translate-y-2 translate-x-1">
                  <MessageCircle className="w-10 h-10 fill-current stroke-0" />
                </div>
              </div>
            </div>

          </section>

          {/* CENTER COLUMN: Zhejiang Map and Title Area (Sized to lg:col-span-5 to amplify maps and visual cockpit focus) */}
          <section className="lg:col-span-5 flex flex-col justify-between h-full">
            <ZhejiangMap
              selectedCityId={selectedCityId}
              onSelectCity={handleSelectCity}
              hoveredCity={hoveredCity}
              setHoveredCity={setHoveredCity}
              theme="dark"
            />
          </section>

          {/* RIGHT COLUMN: 各地市明细 (Regional Cities Detail) (COMPACT LIST - NO GAPS OR BLANK FILLINGS) */}
          <section className="lg:col-span-3 flex flex-col h-full">
            
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0b1329]/80 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)] flex flex-col h-full min-h-[600px] lg:h-[725px]">
              <div className="flex flex-col flex-1 min-h-0">
                
                {/* Header detail menu */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/35 text-emerald-400">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold tracking-wider text-white uppercase">各地市明细</h3>
                      <p className="text-[9.5px] text-gray-500 font-medium">点击项目于地图联动聚焦</p>
                    </div>
                  </div>

                  {/* Filter controls matching image 2 */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 whitespace-nowrap">排序:</span>
                    <div className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950 border border-slate-800">
                      <button
                        id="sort-choice-friends"
                        onClick={() => setSortBy("friends")}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                          sortBy === "friends" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        好友数
                      </button>
                      <button
                        id="sort-choice-doctors"
                        onClick={() => setSortBy("doctors")}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                          sortBy === "doctors" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        医护数
                      </button>
                      <button
                        id="sort-choice-name"
                        onClick={() => setSortBy("name")}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                          sortBy === "name" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        名称
                      </button>
                    </div>
                  </div>
                </div>

                {/* Input Search Block */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-cities-input"
                    type="text"
                    placeholder="快速查找地市 (如: 温州、Jiaxing)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/30 transition-all font-sans"
                  />
                </div>

                {/* Table details list (Dynamically stretches to exact boundary with absolute limit scrollbar) */}
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent mb-2">
                  {filteredAndSortedCities.map((city) => {
                    const isSelected = selectedCityId === city.id;
                    
                    return (
                      <div
                        id={`city-list-item-${city.id}`}
                        key={city.id}
                        onClick={() => handleSelectCity(isSelected ? null : city.id)}
                        className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? "bg-emerald-500/10 border-emerald-500/40" 
                            : "bg-slate-950/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-950/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded transition-transform ${
                            isSelected 
                              ? "bg-emerald-500/15 text-emerald-400" 
                              : "bg-slate-950 text-gray-400 group-hover:scale-105 border border-slate-900"
                          }`}>
                            <MapPin className="w-3.5 h-3.5 fill-current opacity-75" />
                          </div>
                          
                          <div>
                            <strong className={`block text-xs font-bold ${isSelected ? "text-emerald-400" : "text-gray-250 dark:text-gray-100"}`}>
                              {city.name}
                            </strong>
                            <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap font-sans">
                              <span>已入驻: <strong className="text-gray-400 font-mono font-medium">{city.doctors.toLocaleString()}</strong>位</span>
                              <span className="opacity-30">•</span>
                              <span>添加居民数: <strong className="text-gray-400 font-mono font-medium">{city.residentsAdded.toLocaleString()}</strong>人</span>
                            </p>
                          </div>
                        </div>

                        <div className={`w-5.5 h-5.5 flex items-center justify-center rounded border transition-all ${
                          isSelected 
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                            : "bg-slate-955 border-slate-800 text-gray-500 group-hover:text-emerald-400 group-hover:border-slate-700"
                        }`}>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? "rotate-90 text-emerald-450" : ""}`} />
                        </div>
                      </div>
                    );
                  })}

                  {filteredAndSortedCities.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-1">
                      <span>没有找到任何匹配的地市</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls Footer detail */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] text-gray-500 font-mono">
                <span>共计统计 11 地市</span>
                <span className="text-emerald-500 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  实时联动已就绪
                </span>
              </div>
            </div>

          </section>

        </div>



      </div>
    </div>
  );
}
