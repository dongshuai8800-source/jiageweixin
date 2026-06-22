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

const cityPalette: Record<string, { fill: string; stroke: string; halo: string }> = {
  huzhou: { fill: "#7dd3fc", stroke: "#bae6fd", halo: "rgba(125,211,252,0.25)" },
  jiaxing: { fill: "#a5b4fc", stroke: "#c7d2fe", halo: "rgba(165,180,252,0.24)" },
  hangzhou: { fill: "#fde68a", stroke: "#fef3c7", halo: "rgba(253,230,138,0.24)" },
  shaoxing: { fill: "#6ee7b7", stroke: "#bbf7d0", halo: "rgba(110,231,183,0.24)" },
  ningbo: { fill: "#f0abfc", stroke: "#f5d0fe", halo: "rgba(240,171,252,0.23)" },
  zhoushan: { fill: "#fcd34d", stroke: "#fde68a", halo: "rgba(252,211,77,0.22)" },
  jinhua: { fill: "#fca5a5", stroke: "#fecaca", halo: "rgba(252,165,165,0.23)" },
  quzhou: { fill: "#c4b5fd", stroke: "#ddd6fe", halo: "rgba(196,181,253,0.23)" },
  taizhou: { fill: "#93c5fd", stroke: "#bfdbfe", halo: "rgba(147,197,253,0.23)" },
  lishui: { fill: "#86efac", stroke: "#bbf7d0", halo: "rgba(134,239,172,0.23)" },
  wenzhou: { fill: "#fbbf24", stroke: "#fde68a", halo: "rgba(251,191,36,0.22)" }
};

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_43%),linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:100%_100%,30px_30px,30px_30px]" />
        <div className="absolute right-0 top-0 h-full w-[46%] bg-gradient-to-l from-cyan-500/10 via-sky-500/5 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent animate-pulse" />
      </div>

      <div className="flex justify-between items-start z-20 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono tracking-[0.32em] uppercase">
            <Satellite className="w-3.5 h-3.5" />
            Zhejiang Digital Twin Cockpit
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-cyan-500/10 text-cyan-200 border-cyan-400/30">标准行政区划版</span>
          </h1>
          <span className="text-[11px] text-slate-400 font-mono">数据更新截止时间：{updateTime} ｜ 参考浙江省标准地图视觉结构优化</span>
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
          <div className="mt-1 text-[9px] text-slate-400 leading-relaxed">杭州枢纽连接各地市<br />行政区划底图 + 服务数据叠加</div>
        </div>

        <svg viewBox="0 0 540 500" className="w-full h-full max-h-[585px] drop-shadow-[0_25px_45px_rgba(8,47,73,0.38)]" onMouseLeave={() => setHoveredCity(null)}>
          <defs>
            <radialGradient id="seaGlow" cx="77%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#0f172a" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <filter id="mapGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.35" />
            </filter>
            <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#34d399" floodOpacity="0.85" />
            </filter>
          </defs>

          <rect x="0" y="0" width="540" height="500" fill="url(#seaGlow)" opacity="0.9" />
          <text x="420" y="70" className="fill-cyan-300/20 text-[18px] tracking-[0.9em] font-serif">东 海</text>
          <text x="38" y="462" className="fill-slate-500/55 text-[9px] font-mono">省界 / 市界 / 群岛示意 · 数据服务图层</text>
          <g transform="translate(14 4) scale(0.94)">
            {hubCity && cities.filter((city) => city.id !== hubCity.id).map((city) => {
              const mx = (hubCity.labelX + city.labelX) / 2;
              const my = (hubCity.labelY + city.labelY) / 2 - 42;
              return <path key={`flow-${city.id}`} d={`M ${hubCity.labelX} ${hubCity.labelY} Q ${mx} ${my} ${city.labelX} ${city.labelY}`} fill="none" stroke="#38bdf8" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="5 11" />;
            })}

            {[8, 5].map((offset) => (
              <g key={`depth-${offset}`} opacity={0.11 - offset * 0.006} transform={`translate(${offset * 0.5} ${offset})`}>
                {cities.map((city) => <path key={`depth-city-${city.id}-${offset}`} d={city.svgPath} fill="#0f172a" stroke="#075985" strokeWidth="1" />)}
              </g>
            ))}

            {cities.map((city) => {
              const selected = selectedCityId === city.id;
              const hovered = hoveredCity?.id === city.id;
              const dimOthers = Boolean(selectedCityId && !selected);
              const residentsLevel = num(city.residentsAdded) / maxResidents;
              const doctorsLevel = num(city.doctors) / maxDoctors;
              const pillarHeight = 18 + residentsLevel * 46;
              const palette = cityPalette[city.id] ?? { fill: "#67e8f9", stroke: "#bae6fd", halo: "rgba(103,232,249,0.22)" };
              const fillOpacity = dimOthers ? 0.34 : selected ? 0.96 : hovered ? 0.86 : 0.66;
              const strokeOpacity = dimOthers ? 0.22 : selected || hovered ? 0.95 : 0.56;

              return (
                <motion.g key={city.id} animate={{ y: selected ? -7 : hovered ? -3 : 0, scale: selected ? 1.014 : hovered ? 1.008 : 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                  <path d={city.svgPath} fill={palette.fill} fillOpacity={fillOpacity} stroke={selected ? "#bbf7d0" : palette.stroke} strokeOpacity={strokeOpacity} strokeWidth={selected || hovered ? 2.2 : 1.05} filter={selected || hovered ? "url(#activeGlow)" : "url(#mapGlow)"} />
                  <path d={city.svgPath} fill="transparent" stroke="transparent" strokeWidth="20" className="cursor-pointer" onMouseEnter={() => setHoveredCity(city)} onClick={() => handleCityClick(city)} />
                  <circle cx={city.labelX} cy={city.labelY} r={9 + doctorsLevel * 9} fill={palette.halo} opacity={dimOthers ? 0.28 : 0.72} />
                  <line x1={city.labelX} y1={city.labelY} x2={city.labelX} y2={city.labelY - pillarHeight} stroke={selected ? "#34d399" : palette.stroke} strokeWidth={selected ? 5 : 3.2} strokeLinecap="round" opacity={dimOthers ? 0.25 : selected ? 1 : 0.58} />
                  <circle cx={city.labelX} cy={city.labelY} r={selected ? 6 : hovered ? 5.2 : 4} fill={selected ? "#34d399" : palette.stroke} stroke="#ecfeff" strokeWidth="1" opacity={dimOthers ? 0.32 : 0.95} />
                  {(selected || hovered) && <circle cx={city.labelX} cy={city.labelY} r="12" fill={selected ? "rgba(52,211,153,0.14)" : palette.halo} className="animate-ping" />}
                  <g opacity={dimOthers ? 0.36 : 1} className="pointer-events-none">
                    <rect x={city.labelX - 24} y={city.labelY - pillarHeight - 28} width="48" height="18" rx="6" fill="rgba(2,6,23,0.78)" stroke={selected ? "#34d399" : palette.stroke} strokeOpacity="0.42" />
                    <text x={city.labelX} y={city.labelY - pillarHeight - 15} textAnchor="middle" className="fill-slate-100 text-[10px] font-bold tracking-wider">{getCityShortName(city.name)}</text>
                    <text x={city.labelX} y={city.labelY + 18} textAnchor="middle" className="fill-slate-100/75 text-[8px] font-mono">{wan(city.residentsAdded)}</text>
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

      <div className="flex justify-between items-center border-t border-cyan-400/10 pt-2 z-20"><div className="flex gap-3 text-[10px] text-slate-400"><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-400/70 border border-cyan-200/70 block" />行政区划图层</div><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 border border-emerald-200 block animate-pulse" />联动聚焦地市</div><div className="hidden sm:flex items-center gap-1"><span className="w-7 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-300 to-transparent block" />省级数据流</div></div><span className="text-[9px] font-mono opacity-70 flex items-center gap-1 text-slate-400"><Info className="w-3 h-3" />点击地市聚焦，再点一次取消</span></div>
    </div>
  );
}
