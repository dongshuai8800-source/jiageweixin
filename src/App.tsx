import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { provinceData, citiesData } from "./data";
import { CityData, ProvinceData } from "./types";
import { DASHBOARD_DATA_URL, loadDashboardData } from "./utils/dashboardDataSource";
import ZhejiangMap from "./components/ZhejiangMap";
import ExcelPortal from "./components/ExcelPortal";
import {
  Building2,
  Users,
  MessageSquare,
  MessageCircle,
  MapPin,
  ChevronRight,
  Search,
  CheckCircle,
  Award,
  Database,
  RotateCw
} from "lucide-react";

export default function App() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"friends" | "doctors" | "name">("friends");

  const [province, setProvince] = useState<ProvinceData>(provinceData);
  const [cities, setCities] = useState<CityData[]>(citiesData);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [alertText, setAlertText] = useState<string | null>(null);
  const [dataSourceLabel, setDataSourceLabel] = useState("内置默认数据");
  const [isDataSourceLoading, setIsDataSourceLoading] = useState(true);

  const handleSelectCity = (cityId: string | null) => setSelectedCityId(cityId);

  const triggerAlertToast = (text: string) => {
    setAlertText(text);
    setTimeout(() => setAlertText(null), 4000);
  };

  const reloadUnifiedData = async (notify = false) => {
    setIsDataSourceLoading(true);
    try {
      const loaded = await loadDashboardData();
      setProvince(loaded.province);
      setCities(loaded.cities);
      setSelectedCityId(null);
      setDataSourceLabel(`${loaded.sourceName}${loaded.publishedAt ? ` · ${loaded.publishedAt}` : ""}`);
      if (notify) triggerAlertToast(`已从统一数据源重新加载：${DASHBOARD_DATA_URL}`);
    } catch (error) {
      setProvince(provinceData);
      setCities(citiesData);
      setDataSourceLabel("内置默认数据（统一 data.json 不可用）");
      if (notify) {
        triggerAlertToast(error instanceof Error ? error.message : "统一数据源加载失败，已回退到内置数据");
      }
    } finally {
      setIsDataSourceLoading(false);
    }
  };

  useEffect(() => {
    void reloadUnifiedData(false);
  }, []);

  const handleImportExcelData = (newProvince: ProvinceData, newCities: CityData[]) => {
    setProvince(newProvince);
    setCities(newCities);
    setDataSourceLabel("本机 Excel 预览（尚未发布到统一 data.json）");
    triggerAlertToast("Excel 数据已在当前页面预览。发布到统一 data.json 后，手机和大屏才会同步一致。");
  };

  const handleResetData = () => {
    void reloadUnifiedData(true);
  };

  const activeData = useMemo(() => {
    if (!selectedCityId) {
      return {
        isProvince: true,
        name: "浙江省",
        updateTime: province.updateTime,
        institutions: province.institutions,
        doctors: province.doctors,
        activeDoctors: province.activeDoctors,
        activeRate: province.activeRate,
        residentsAdded: cities.reduce((acc, c) => acc + (c.residentsAdded || 0), 0),
        recentAdded: province.recentAdded,
        singleChats: province.singleChats,
        singleReplyRate: province.singleReplyRate,
        avgFirstReplyTime: province.avgFirstReplyTime,
        singleMessages: province.singleMessages,
        groupChats: province.groupChats,
        activeGroupChats: province.activeGroupChats,
        activeGroupChatsRate: province.activeGroupChatsRate,
        groupMembers: province.groupMembers,
        activeGroupMembers: province.activeGroupMembers,
        activeGroupMembersRate: province.activeGroupMembersRate,
        groupMessages: province.groupMessages
      };
    }

    const city = cities.find((c) => c.id === selectedCityId);
    if (!city) return null;

    return {
      isProvince: false,
      name: city.name,
      updateTime: province.updateTime,
      institutions: city.institutions,
      doctors: city.doctors,
      activeDoctors: city.activeDoctors,
      activeRate: city.doctors !== null && city.doctors > 0 && city.activeDoctors !== null
        ? parseFloat(((city.activeDoctors / city.doctors) * 100).toFixed(1))
        : null,
      residentsAdded: city.residentsAdded,
      recentAdded: city.recentAdded,
      singleChats: city.singleChats,
      singleReplyRate: city.singleReplyRate,
      avgFirstReplyTime: city.avgFirstReplyTime,
      singleMessages: city.singleMessages,
      groupChats: city.groupChats,
      activeGroupChats: city.activeGroupChats,
      activeGroupChatsRate: city.groupChats !== null && city.groupChats > 0 && city.activeGroupChats !== null
        ? parseFloat(((city.activeGroupChats / city.groupChats) * 100).toFixed(1))
        : null,
      groupMembers: city.groupMembers,
      activeGroupMembers: city.activeGroupMembers,
      activeGroupMembersRate: city.groupMembers !== null && city.groupMembers > 0 && city.activeGroupMembers !== null
        ? parseFloat(((city.activeGroupMembers / city.groupMembers) * 100).toFixed(1))
        : null,
      groupMessages: city.groupMessages
    };
  }, [selectedCityId, province, cities]);

  const filteredAndSortedCities = useMemo(() => {
    return cities
      .filter((city) => city.name.toLowerCase().includes(searchQuery.toLowerCase()) || city.pinyin.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "friends") return (b.residentsAdded || 0) - (a.residentsAdded || 0);
        if (sortBy === "doctors") return (b.doctors || 0) - (a.doctors || 0);
        return a.name.localeCompare(b.name, "zh-CN");
      });
  }, [searchQuery, sortBy, cities]);

  const fmt = (val: number | string | null | undefined, suffix = "") => {
    if (val === null || val === undefined || val === "" || (typeof val === "number" && isNaN(val))) return "-";
    if (typeof val === "number") return val.toLocaleString() + suffix;
    return String(val) + suffix;
  };

  if (!activeData) return null;

  const profileCards = [
    { label: "入驻机构数", value: activeData.institutions, unit: "家", color: "text-white" },
    { label: "入驻医护", value: activeData.doctors, unit: "位", color: "text-cyan-300" },
    { label: "已激活数", value: activeData.activeDoctors, unit: "人", color: "text-emerald-400" }
  ];

  return (
    <div className="min-h-screen bg-[#030712] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0b1528] via-[#030712] to-[#010308] text-slate-100 p-4 font-sans select-none overflow-x-hidden" id="applet-viewport-root">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,30,56,0.06)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(18,30,56,0.06)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/35 text-[10px] text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-cyan-200 font-bold shrink-0">统一数据源</span>
            <span className="truncate">{dataSourceLabel}</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline truncate">{DASHBOARD_DATA_URL}</span>
          </div>
          <button onClick={() => reloadUnifiedData(true)} className="px-2 py-1 rounded border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1.5">
            <RotateCw className={`w-3 h-3 ${isDataSourceLoading ? "animate-spin" : ""}`} />重新加载
          </button>
        </div>

        {!activeData.isProvince && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-950/20 border border-emerald-500/25 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs text-emerald-300">
            <div className="flex items-center gap-2"><CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" /><span>当前视窗聚焦：<strong>{activeData.name}</strong>。点击其他城市或右侧按钮可重置为全省。</span></div>
            <button onClick={() => handleSelectCity(null)} className="px-2.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded text-xs transition-all border border-emerald-500/35 cursor-pointer">返回全省</button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch" id="dashboard-columns-grid">
          <section className="lg:col-span-4 flex flex-col gap-3">
            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between border-b pb-1 border-slate-800/80"><h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-cyan-400 uppercase"><Building2 className="w-3.5 h-3.5" />机构概况</h3><span className="text-[9px] font-mono text-gray-500">PROFILES</span></div>
              <div className="grid grid-cols-3 gap-1.5 pb-0.5">
                {profileCards.map((card) => <div key={card.label} className="p-2 rounded bg-slate-950/40 border border-slate-800/80 text-center"><span className="text-[9px] text-gray-500 block leading-none">{card.label}</span><div className="mt-1 flex items-baseline justify-center gap-0.5"><span className={`text-base font-extrabold font-mono ${card.color}`}>{fmt(card.value)}</span><span className="text-[8px] text-gray-500">{card.unit}</span></div></div>)}
              </div>
              <div className="bg-cyan-950/15 border border-cyan-500/10 p-2 rounded flex items-center justify-between"><div className="flex flex-col"><span className="text-[9px] text-gray-400">医护人员激活率</span><span className="text-[8px] text-gray-500">已激活及签约占比</span></div><div className="flex items-center gap-2"><span className="text-[13px] font-black font-mono text-teal-400">{fmt(activeData.activeRate, "%")}</span><div className="w-14 bg-slate-900 border border-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-teal-500 h-full rounded-full" style={{ width: `${activeData.activeRate ?? 0}%` }} /></div></div></div>
            </div>

            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]"><div className="flex items-center justify-between border-b pb-1 border-slate-800/80"><h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-amber-500 uppercase"><Users className="w-3.5 h-3.5" />居民概况</h3><span className="text-[9px] font-mono text-gray-500">RESIDENTS</span></div><div className="py-2.5 px-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between"><div><span className="text-[10px] tracking-wider text-slate-300 block font-medium">添加居民总数 (累计)</span><p className="text-[8.5px] text-gray-500 leading-none mt-1">{activeData.isProvince ? "全省" : "当前"}居民及家医微端累计连接</p></div><div className="flex items-baseline gap-1"><span className="text-lg font-black font-mono tracking-tight text-white">{fmt(activeData.residentsAdded)}</span><span className="text-[9px] font-semibold text-gray-500">人</span></div></div><div className="py-2 px-3 rounded-lg bg-slate-950/20 border border-slate-800/50 flex items-center justify-between"><span className="text-[9.5px] text-slate-400">近期或最近的新增好友数</span><div className="flex items-baseline gap-0.5"><span className="text-sm font-extrabold font-mono text-emerald-400">{activeData.recentAdded !== null ? `+${fmt(activeData.recentAdded)}` : "-"}</span><span className="text-[8px] text-gray-500">人</span></div></div></div>

            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]"><div className="flex items-center justify-between border-b pb-1 border-slate-800/80"><h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-cyan-400 uppercase"><MessageSquare className="w-3.5 h-3.5" />单聊互动概况</h3><span className="text-[9px] font-mono text-gray-500">SINGLE CHATS</span></div><div className="grid grid-cols-2 gap-2"><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">已回复占比</span><span className="text-sm font-extrabold font-mono text-emerald-400">{fmt(activeData.singleReplyRate, "%")}</span></div><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">平均首次回复时长</span><span className="text-[10.5px] font-bold text-slate-200">{fmt(activeData.avgFirstReplyTime)}</span></div></div><div className="grid grid-cols-2 gap-2"><div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded flex justify-between items-center text-[10.5px]"><span className="text-gray-400">单聊总数</span><span className="font-mono font-bold text-white">{fmt(activeData.singleChats)}</span></div><div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded flex justify-between items-center text-[10.5px]"><span className="text-gray-400">发送消息数</span><span className="font-mono font-bold text-cyan-400">{fmt(activeData.singleMessages)}</span></div></div></div>

            <div className="bg-[#0b1329]/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)]"><div className="flex items-center justify-between border-b pb-1 border-slate-800/80"><h3 className="font-bold text-xs tracking-wider flex items-center gap-1.5 text-emerald-400 uppercase"><MessageCircle className="w-3.5 h-3.5" />群聊互动概况</h3><span className="text-[9px] font-mono text-gray-500">GROUP CHATS</span></div><div className="grid grid-cols-2 gap-2"><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">群聊总数</span><span className="text-sm font-extrabold font-mono text-white">{fmt(activeData.groupChats)}</span></div><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">发言活跃群数</span><div className="flex items-baseline justify-between gap-1 text-white"><span className="text-sm font-extrabold font-mono">{fmt(activeData.activeGroupChats)}</span><span className="text-[8px] bg-sky-500/10 text-sky-400 px-1 rounded font-bold">{fmt(activeData.activeGroupChatsRate, "%")}</span></div></div></div><div className="grid grid-cols-2 gap-2"><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">群成员总数</span><span className="text-[10.5px] font-bold font-mono text-white">{fmt(activeData.groupMembers)}人</span></div><div className="p-2 rounded bg-slate-950/40 border border-slate-800/60"><span className="text-[9px] text-gray-500 block leading-none mb-1">活跃群成员数</span><div className="flex items-baseline justify-between gap-1 text-white"><span className="text-[10.5px] font-bold font-mono">{fmt(activeData.activeGroupMembers)}人</span><span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1 rounded font-bold">{fmt(activeData.activeGroupMembersRate, "%")}</span></div></div></div><div className="relative px-3 py-1.5 rounded border border-emerald-500/10 bg-emerald-950/10 flex justify-between items-center overflow-hidden"><div><span className="text-[9.5px] text-gray-400 block leading-none mb-1.5">群聊消息总数</span><strong className="text-[15px] font-black font-mono text-emerald-400">{fmt(activeData.groupMessages)} <span className="text-[9px] font-normal text-slate-500">条</span></strong></div></div></div>
          </section>

          <section className="lg:col-span-5 flex flex-col justify-between h-full"><ZhejiangMap cities={cities} updateTime={province.updateTime} selectedCityId={selectedCityId} onSelectCity={handleSelectCity} hoveredCity={hoveredCity} setHoveredCity={setHoveredCity} theme="dark" onOpenUpload={() => setIsExcelOpen(true)} /></section>

          <section className="lg:col-span-3 flex flex-col h-full"><div className="p-3.5 rounded-xl border border-slate-800 bg-[#0b1329]/80 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)] flex flex-col h-full min-h-[600px] lg:h-[725px]"><div className="flex flex-col flex-1 min-h-0"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2 mb-2"><div className="flex items-center gap-1.5"><div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/35 text-emerald-400"><Award className="w-3.5 h-3.5" /></div><div><h3 className="text-xs font-bold tracking-wider text-white uppercase">各地市明细</h3><p className="text-[9.5px] text-gray-500 font-medium">点击项目于地图联动聚焦</p></div></div><div className="flex items-center gap-1"><span className="text-[9px] text-gray-500 whitespace-nowrap">排序:</span><div className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950 border border-slate-800"><button onClick={() => setSortBy("friends")} className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${sortBy === "friends" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white"}`}>好友数</button><button onClick={() => setSortBy("doctors")} className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${sortBy === "doctors" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white"}`}>医护数</button><button onClick={() => setSortBy("name")} className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${sortBy === "name" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white"}`}>名称</button></div></div></div><div className="relative mb-2.5"><Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" /><input type="text" placeholder="快速查找地市 (如: 温州、Jiaxing)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/30 transition-all font-sans" /></div><div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent mb-2">{filteredAndSortedCities.map((city) => { const isSelected = selectedCityId === city.id; return <div key={city.id} onClick={() => handleSelectCity(isSelected ? null : city.id)} className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all duration-300 ${isSelected ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-950/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-950/50"}`}><div className="flex items-center gap-2"><div className={`p-1 rounded transition-transform ${isSelected ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-950 text-gray-400 group-hover:scale-105 border border-slate-900"}`}><MapPin className="w-3.5 h-3.5 fill-current opacity-75" /></div><div><strong className={`block text-xs font-bold ${isSelected ? "text-emerald-400" : "text-gray-100"}`}>{city.name}</strong><p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap font-sans"><span>已入驻: <strong className="text-gray-400 font-mono font-medium">{fmt(city.doctors)}</strong>位</span><span className="opacity-30">•</span><span>添加居民数: <strong className="text-gray-400 font-mono font-medium">{fmt(city.residentsAdded)}</strong>人</span></p></div></div><div className={`w-5.5 h-5.5 flex items-center justify-center rounded border transition-all ${isSelected ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-slate-955 border-slate-800 text-gray-500 group-hover:text-emerald-400 group-hover:border-slate-700"}`}><ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? "rotate-90 text-emerald-450" : ""}`} /></div></div>; })}{filteredAndSortedCities.length === 0 && <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-1"><span>没有找到任何匹配的地市</span></div>}</div></div><div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] text-gray-500 font-mono"><span>共计统计 11 地市</span><span className="text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>实时联动已就绪</span></div></div></section>
        </div>
      </div>

      <ExcelPortal isOpen={isExcelOpen} onClose={() => setIsExcelOpen(false)} province={province} cities={cities} onImport={handleImportExcelData} onReset={handleResetData} />

      <AnimatePresence>{alertText && <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed bottom-6 right-6 bg-slate-900/95 border border-emerald-500/40 text-[#10b981] px-4 py-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 z-50 text-xs selection:bg-emerald-500/10"><CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /><div className="font-sans"><p className="font-extrabold text-white text-[11px]">大屏数据更新成功</p><p className="text-[10px] text-emerald-300/90 mt-0.5">{alertText}</p></div></motion.div>}</AnimatePresence>
    </div>
  );
}
