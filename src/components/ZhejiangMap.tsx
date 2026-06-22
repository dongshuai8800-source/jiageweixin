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
const shortName = (name: string) => name.replace("市", "");

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

  const handleCityClick = (city: CityData) => {
    onSelectCity(selectedCityId === city.id ? null : city.id);
    setHoveredCity(city);
  };

  const activeDoctors = num(activeCity?.activeDoctors);
  const activeDoctorTotal = num(activeCity?.doctors);
  const activeRate = activeDoctorTotal > 0 ? ((activeDoctors / activeDoctorTotal) * 100).toFixed(1) : "-";

  return (
    <div className="relative w-full h-[600px] lg:h-[725px] rounded-2xl border border-cyan-500/20 bg-[#020617]/90 shadow-[0_4px_35px_rgba(0,0,0,0.55),inset_0_0_35px_rgba(34,211,238,0.08)] text-white p-4 flex flex-col justify-between overflow-hidden" id="zhejiang-map-container">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12),transparent_42%),linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:100%_100%,32px_32px,32px_32px]" />
        <div className="absolute right-0 top-0 h-full w-[45%] bg-gradient-to-l from-sky-500/8 via-cyan-500/4 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      </div>

      <div className="flex justify-between items-start z-20 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono tracking-[0.32em] uppercase">
            <Satellite className="w-3.5 h-3.5" />
            Zhejiang Digital Twin Cockpit
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-cyan-500/10 text-cyan-200 border-cyan-400/30">行政底图版</span>
          </h1>
          <span className="text-[11px] text-slate-400 font-mono">数据更新截止时间：{updateTime} ｜ 标准行政区划底图 + 服务数据叠加</span>
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
          <div className="mt-1 text-[9px] text-slate-400 leading-relaxed">保留行政区划轮廓<br />仅在交互时突出服务数据</div>
        </div>

        <svg viewBox="0 0 540 500" className="w-full h-full max-h-[585px] drop-shadow-[0_25px_45px_rgba(8,47,73,0.34)]" onMouseLeave={() => setHoveredCity(null)}>
          <defs>
            <filter id="softMapShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000000" floodOpacity="0.32" />
            </filter>
            <filter id="selectedShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#34d399" floodOpacity="0.75" />
            </filter>
            <radialGradient id="eastSea" cx="80%" cy="22%" r="78%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.14" />
              <stop offset="65%" stopColor="#082f49" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="540" height="500" fill="url(#eastSea)" opacity="0.9" />
          <text x="430" y="76" className="fill-cyan-300/18 text-[18px] tracking-[0.65em] font-serif">东海</text>
          <text x="42" y="462" className="fill-slate-500/55 text-[9px] font-mono">行政区划示意 · 数据图层随点击联动</text>

          <g transform="translate(14 4) scale(0.94)">
            {hubCity && cities.filter((city) => city.id !== hubCity.id).map((city) => {
              const showFlow = !selectedCityId || selectedCityId === city.id || selectedCityId === hubCity.id;
              const mx = (hubCity.labelX + city.labelX) / 2;
              const my = (hubCity.labelY + city.labelY) / 2 - 42;
              return <path key={`flow-${city.id}`} d={`M ${hubCity.labelX} ${hubCity.labelY} Q ${mx} ${my} ${city.labelX} ${city.labelY}`} fill="none" stroke="#38bdf8" strokeOpacity={showFlow ? 0.11 : 0.03} strokeWidth={showFlow ? 1.1 : 0.6} strokeDasharray="5 12" />;
            })}

            <g opacity="0.42" transform="translate(4 8)">
              {cities.map((city) => <path key={`base-shadow-${city.id}`} d={city.svgPath} fill="#020617" stroke="none" />)}
            </g>

            {cities.map((city) => {
              const selected = selectedCityId === city.id;
              const hovered = hoveredCity?.id === city.id;
              const dimOthers = Boolean(selectedCityId && !selected);
              const residentsLevel = num(city.residentsAdded) / maxResidents;
              const fill = selected ? "rgba(16,185,129,0.74)" : hovered ? "rgba(14,165,233,0.42)" : "rgba(15,38,62,0.72)";
              const stroke = selected ? "#bbf7d0" : hovered ? "#a5f3fc" : "rgba(148,163,184,0.52)";
              const node = selected ? "#34d399" : hovered ? "#67e8f9" : "#94a3b8";
              const opacity = dimOthers ? 0.32 : 1;

              return (
                <motion.g key={city.id} animate={{ y: selected ? -6 : hovered ? -2 : 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                  <path d={city.svgPath} fill={fill} stroke={stroke} strokeWidth={selected || hovered ? 2.1 : 1.05} opacity={opacity} filter={selected || hovered ? "url(#selectedShadow)" : "url(#softMapShadow)"} />
                  <path d={city.svgPath} fill="transparent" stroke="transparent" strokeWidth="22" className="cursor-pointer" onMouseEnter={() => setHoveredCity(city)} onClick={() => handleCityClick(city)} />
                  <circle cx={city.labelX} cy={city.labelY} r={5 + residentsLevel * 5} fill={node} opacity={dimOthers ? 0.36 : 0.92} stroke="#e2e8f0" strokeWidth="0.8" />
                  {(selected || hovered) && <circle cx={city.labelX} cy={city.labelY} r="13" fill={selected ? "rgba(52,211,153,0.14)" : "rgba(34,211,238,0.12)"} className="animate-ping" />}
                  <g opacity={dimOthers ? 0.34 : 1} className="pointer-events-none">
                    <rect x={city.labelX - 23} y={city.labelY - 26} width="46" height="18" rx="6" fill="rgba(2,6,23,0.72)" stroke={selected ? "#34d399" : "rgba(148,163,184,0.45)"} strokeWidth="0.8" />
                    <text x={city.labelX} y={city.labelY - 13} textAnchor="middle" className="fill-slate-100 text-[10px] font-bold tracking-wider">{shortName(city.name)}</text>
                  </g>
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

      <div className="flex justify-between items-center border-t border-cyan-400/10 pt-2 z-20"><div className="flex gap-3 text-[10px] text-slate-400"><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-400/70 border border-slate-200/50 block" />行政底图</div><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 border border-emerald-200 block animate-pulse" />选中地市</div><div className="hidden sm:flex items-center gap-1"><span className="w-7 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-300 to-transparent block" />省级数据流</div></div><span className="text-[9px] font-mono opacity-70 flex items-center gap-1 text-slate-400"><Info className="w-3 h-3" />点击地市聚焦，再点一次取消</span></div>
    </div>
  );
}
