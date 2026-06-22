import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CityData } from "../types";
import { Activity, FileSpreadsheet, Info, MapPin, RotateCcw, Satellite, Waves } from "lucide-react";

interface ZhejiangMapProps {
  cities: CityData[];
  updateTime: string;
  selectedCityId: string | null;
  onSelectCity: (cityId: string | null) => void;
  hoveredCity: CityData | null;
  setHoveredCity: (city: CityData | null) => void;
  theme: "dark" | "light";
  onOpenUpload: () => void;
}

const num = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const wan = (value: number | null | undefined) => {
  const current = num(value);
  return current >= 10000 ? `${(current / 10000).toFixed(1)}万` : current.toLocaleString();
};

const getCityShortName = (name: string) => name.replace("市", "");

export default function ZhejiangMap({
  cities,
  updateTime,
  selectedCityId,
  onSelectCity,
  hoveredCity,
  setHoveredCity,
  onOpenUpload
}: ZhejiangMapProps) {
  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId) ?? null, [cities, selectedCityId]);
  const activeCity = selectedCity ?? hoveredCity;
  const hubCity = useMemo(() => cities.find((city) => city.id === "hangzhou") ?? cities[0], [cities]);
  const maxResidents = useMemo(() => Math.max(1, ...cities.map((city) => num(city.residentsAdded))), [cities]);
  const maxDoctors = useMemo(() => Math.max(1, ...cities.map((city) => num(city.doctors))), [cities]);

  const handleCityClick = (city: CityData) => {
    onSelectCity(selectedCityId === city.id ? null : city.id);
    setHoveredCity(city);
  };

  const activeDoctors = num(activeCity?.activeDoctors);
  const activeDoctorTotal = num(activeCity?.doctors);
  const activeRate = activeDoctorTotal > 0 ? ((activeDoctors / activeDoctorTotal) * 100).toFixed(1) : "-";

  return (
    <div className="relative w-full h-[600px] lg:h-[725px] rounded-2xl border border-cyan-500/20 bg-[#020617]/90 shadow-[0_4px_35px_rgba(0,0,0,0.55),inset_0_0_35px_rgba(34,211,238,0.08)] text-white p-4 flex flex-col justify-between overflow-hidden" id="zhejiang-map-container">
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_43%),linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[size:100%_100%,28px_28px,28px_28px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent animate-pulse" />
        <div className="absolute left-1/2 top-[54%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/8 shadow-[0_0_90px_rgba(34,211,238,0.10)]" />
      </div>

      <div className="flex justify-between items-start z-20 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono tracking-[0.32em] uppercase">
            <Satellite className="w-3.5 h-3.5" />
            Zhejiang Digital Twin Cockpit
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-cyan-500/10 text-cyan-200 border-cyan-400/30">省域联动版</span>
          </h1>
          <span className="text-[11px] text-slate-400 font-mono">数据更新截止时间：{updateTime} ｜ 点击地市联动左侧指标与右侧明细</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button id="open-excel-portal" onClick={onOpenUpload} className="text-[10.5px] px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer font-bold transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" />Excel 导入
          </button>
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/8 text-[10px] text-emerald-300 font-mono"><Activity className="w-3.5 h-3.5" />LIVE</div>
          {selectedCityId && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelectCity(null)} className="text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/30"><RotateCcw className="w-3 h-3" />返回全省</motion.button>}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 mt-1 flex items-center justify-center">
        <div className="absolute left-3 top-4 z-20 rounded-xl border border-cyan-400/15 bg-slate-950/45 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-200 font-semibold"><Waves className="w-3 h-3" />省级数据流向</div>
          <div className="mt-1 text-[9px] text-slate-400 leading-relaxed">杭州枢纽连接各地市<br />光柱高度映射居民连接规模</div>
        </div>

        <svg viewBox="0 0 540 500" className="w-full h-full max-h-[585px] drop-shadow-[0_25px_45px_rgba(8,47,73,0.38)]" onMouseLeave={() => setHoveredCity(null)}>
          <defs>
            <linearGradient id="cityDefaultFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#164e63" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.94" />
            </linearGradient>
            <linearGradient id="cityActiveFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="pillarGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0e7490" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.56" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.98" />
            </linearGradient>
            <filter id="mapGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.45" />
            </filter>
            <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#34d399" floodOpacity="0.85" />
            </filter>
          </defs>

          <g transform="translate(14 4) scale(0.94)">
            {hubCity && cities.filter((city) => city.id !== hubCity.id).map((city) => {
              const mx = (hubCity.labelX + city.labelX) / 2;
              const my = (hubCity.labelY + city.labelY) / 2 - 42;
              return <path key={`flow-${city.id}`} d={`M ${hubCity.labelX} ${hubCity.labelY} Q ${mx} ${my} ${city.labelX} ${city.labelY}`} fill="none" stroke="#38bdf8" strokeOpacity="0.18" strokeWidth="1.2" strokeDasharray="6 10" />;
            })}

            {[10, 7, 4].map((offset) => (
              <g key={`depth-${offset}`} opacity={0.14 - offset * 0.006} transform={`translate(${offset * 0.55} ${offset * 1.15})`}>
                {cities.map((city) => <path key={`depth-city-${city.id}-${offset}`} d={city.svgPath} fill="#0f172a" stroke="#075985" strokeWidth="1" />)}
              </g>
            ))}

            {cities.map((city) => {
              const selected = selectedCityId === city.id;
              const hovered = hoveredCity?.id === city.id;
              const dimOthers = selectedCityId && !selected;
              const residentsLevel = num(city.residentsAdded) / maxResidents;
              const doctorsLevel = num(city.doctors) / maxDoctors;
              const pillarHeight = 22 + residentsLevel * 58;
              const color = selected ? "#34d399" : hovered ? "#67e8f9" : "#38bdf8";

              return (
                <motion.g key={city.id} animate={{ y: selected ? -7 : hovered ? -3 : 0, scale: selected ? 1.014 : hovered ? 1.008 : 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                  <path d={city.svgPath} fill={selected ? "url(#cityActiveFill)" : "url(#cityDefaultFill)"} fillOpacity={dimOthers ? 0.44 : selected ? 0.98 : hovered ? 0.92 : 0.82} stroke={selected ? "#bbf7d0" : hovered ? "#a5f3fc" : "rgba(125,211,252,0.46)"} strokeWidth={selected || hovered ? 2.2 : 1.1} filter={selected || hovered ? "url(#activeGlow)" : "url(#mapGlow)"} />
                  <path d={city.svgPath} fill="transparent" stroke="transparent" strokeWidth="18" className="cursor-pointer" onMouseEnter={() => setHoveredCity(city)} onClick={() => handleCityClick(city)} />
                  <line x1={city.labelX} y1={city.labelY} x2={city.labelX} y2={city.labelY - pillarHeight} stroke="url(#pillarGradient)" strokeWidth={selected ? 5.5 : 3.8} strokeLinecap="round" opacity={dimOthers ? 0.28 : selected ? 1 : 0.62} />
                  <circle cx={city.labelX} cy={city.labelY} r={selected ? 6 : hovered ? 5.2 : 4} fill={color} stroke="#ecfeff" strokeWidth="1.1" opacity={dimOthers ? 0.34 : 0.95} />
                  {(selected || hovered) && <circle cx={city.labelX} cy={city.labelY} r="12" fill={selected ? "rgba(52,211,153,0.14)" : "rgba(34,211,238,0.12)"} className="animate-ping" />}
                  <g opacity={dimOthers ? 0.38 : 1} className="pointer-events-none">
                    <rect x={city.labelX - 23} y={city.labelY - pillarHeight - 28} width="46" height="18" rx="6" fill="rgba(2,6,23,0.78)" stroke={color} strokeOpacity="0.45" />
                    <text x={city.labelX} y={city.labelY - pillarHeight - 15} textAnchor="middle" className="fill-slate-100 text-[10px] font-bold tracking-wider">{getCityShortName(city.name)}</text>
                    <text x={city.labelX} y={city.labelY + 18} textAnchor="middle" className="fill-cyan-100/75 text-[8px] font-mono">{wan(city.residentsAdded)}</text>
                  </g>
                  <circle cx={city.labelX} cy={city.labelY} r={8 + doctorsLevel * 8} fill="none" stroke={color} strokeOpacity={selected ? 0.45 : 0.18} strokeWidth="0.8" />
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      <AnimatePresence>
        {activeCity && <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} className="absolute bottom-14 left-4 right-4 z-30 p-3.5 rounded-xl border shadow-lg bg-slate-950/90 border-cyan-400/25 text-white backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-cyan-400/10 pb-1.5 mb-2"><span className="text-xs font-bold flex items-center gap-1.5 text-cyan-100"><MapPin className="w-3.5 h-3.5 text-cyan-300" />{activeCity.name}<span className="text-[10px] uppercase font-mono font-normal opacity-60">({activeCity.pinyin})</span></span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">激活率: {activeRate}%</span></div>
          <div className="grid grid-cols-4 gap-2 text-[10px]"><div><span className="text-slate-500 block text-[9px] mb-0.5">入驻医护</span><span className="font-mono font-bold">{num(activeCity.doctors).toLocaleString()} 位</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">添加居民</span><span className="font-mono font-bold">{wan(activeCity.residentsAdded)} 人</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">近增好友</span><span className="text-emerald-400 font-mono font-extrabold">+{num(activeCity.recentAdded).toLocaleString()}</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">单聊回复率</span><span className="text-cyan-200 font-mono font-extrabold">{activeCity.singleReplyRate !== null ? `${activeCity.singleReplyRate}%` : "-"}</span></div></div>
        </motion.div>}
      </AnimatePresence>

      <div className="flex justify-between items-center border-t border-cyan-400/10 pt-2 z-20"><div className="flex gap-3 text-[10px] text-slate-400"><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-400/70 border border-cyan-200/70 block" />城市运行节点</div><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 border border-emerald-200 block animate-pulse" />联动聚焦地市</div><div className="hidden sm:flex items-center gap-1"><span className="w-7 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-300 to-transparent block" />省级数据流</div></div><span className="text-[9px] font-mono opacity-70 flex items-center gap-1 text-slate-400"><Info className="w-3 h-3" />点击地市聚焦，再点一次取消</span></div>
    </div>
  );
}
