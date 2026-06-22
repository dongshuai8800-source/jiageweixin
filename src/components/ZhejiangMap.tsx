import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CityData } from "../types";
import { MapPin, Compass, Info, FileSpreadsheet, RotateCcw } from "lucide-react";

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

export default function ZhejiangMap({
  cities,
  updateTime,
  selectedCityId,
  onSelectCity,
  hoveredCity,
  setHoveredCity,
  theme,
  onOpenUpload
}: ZhejiangMapProps) {
  const isDark = theme === "dark";

  return (
    <div 
      className="relative w-full h-[600px] lg:h-[725px] rounded-2xl border border-slate-800 bg-[#0b1329]/80 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_30px_rgba(14,165,233,0.06)] text-white p-4 flex flex-col justify-between overflow-hidden"
      id="zhejiang-map-container"
    >
      {/* Background HUD tech details */}
      <div className={`absolute inset-0 pointer-events-none opacity-20 ${isDark ? "opacity-30" : "opacity-10"}`}>
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${isDark ? "border-sky-450" : "border-[#0052cc]"}`}></div>
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${isDark ? "border-sky-450" : "border-[#0052cc]"}`}></div>
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 ${isDark ? "border-sky-450" : "border-[#0052cc]"}`}></div>
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${isDark ? "border-sky-450" : "border-[#0052cc]"}`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_0.5px,transparent_0.5px)] [background-size:20px_20px] opacity-20 animate-pulse"></div>
      </div>

      {/* Map Control Header */}
      <div className="flex justify-between items-start z-10 flex-wrap gap-2">
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
            浙江省家医有约数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              数据联动版
            </span>
          </h1>
          <span className="text-[11px] text-gray-400 font-mono mt-1">
            数据更新截止时间：{updateTime}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* High Fidelity Excel Portal Button */}
          <button
            id="open-excel-portal"
            onClick={onOpenUpload}
            className="text-[10.5px] px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Excel 导入</span>
          </button>

          {selectedCityId && (
            <motion.button
              id="reset-map-zoom"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCity(null)}
              className={`text-[10px] px-2.5 py-1.5 rounded border transition-all flex items-center gap-1 cursor-pointer font-medium ${
                isDark 
                  ? "bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              返回全省
            </motion.button>
          )}
        </div>
      </div>

      {/* Main SVG Map Area */}
      <div className="flex-1 flex items-center justify-center relative w-full h-[410px] lg:h-[550px]">
        <svg
          viewBox="0 0 540 500"
          className="w-full h-full max-h-[420px] lg:max-h-[530px] transition-all duration-300"
          style={{ 
            filter: isDark 
              ? "drop-shadow(0 15px 30px rgba(8, 47, 73, 0.4))" 
              : "drop-shadow(0 10px 20px rgba(148, 163, 184, 0.15))" 
          }}
        >
          {/* Outer edge high precision shadow glow for paths */}
          <g className="opacity-30">
            {cities.map((city) => (
              <path
                key={`shadow-${city.id}`}
                d={city.svgPath}
                fill="none"
                stroke={isDark ? "#0284c7" : "#cbd5e1"}
                strokeWidth="8"
                strokeLinejoin="round"
                className="blur-sm pointer-events-none opacity-25"
              />
            ))}
          </g>

          {/* Interactive City Paths */}
          <g>
            {cities.map((city) => {
              const isSelected = selectedCityId === city.id;
              const isHoveredLocal = hoveredCity?.id === city.id;
              
              // Define dynamic gradient colors based on theme
              let fillGradient = isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.85)";
              let strokeColor = isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(203, 213, 225, 0.8)";
              
              if (isSelected) {
                fillGradient = isDark ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.15)";
                strokeColor = "#10b981";
              } else if (isHoveredLocal) {
                fillGradient = isDark ? "rgba(14, 165, 233, 0.2)" : "rgba(0, 82, 204, 0.08)";
                strokeColor = isDark ? "#38bdf8" : "#0052cc";
              }

              return (
                <motion.path
                  id={`map-city-${city.id}`}
                  key={city.id}
                  d={city.svgPath}
                  fill={fillGradient}
                  stroke={strokeColor}
                  strokeWidth={isSelected || isHoveredLocal ? "2.5" : "1.2"}
                  strokeLinejoin="round"
                  className="cursor-pointer transition-colors duration-450"
                  whileHover={{ scale: 1.012 }}
                  onClick={() => onSelectCity(isSelected ? null : city.id)}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                />
              );
            })}
          </g>

          {/* City Labels & Indicators */}
          <g className="pointer-events-none">
            {cities.map((city) => {
              const isSelected = selectedCityId === city.id;
              const isHoveredLocal = hoveredCity?.id === city.id;
              const activeColor = isSelected ? "#10b981" : isHoveredLocal ? (isDark ? "#38bdf8" : "#0052cc") : (isDark ? "#0ea5e9" : "#475569");
              
              return (
                <g key={`label-${city.id}`} className="transition-transform duration-300">
                  {/* Outer circle halo for current selected active city */}
                  {(isSelected || isHoveredLocal) && (
                    <circle
                      cx={city.labelX}
                      cy={city.labelY}
                      r="10"
                      fill={isSelected ? "rgba(16,185,129,0.15)" : "rgba(14,165,233,0.15)"}
                      className="animate-ping"
                    />
                  )}
                  
                  {/* Solid indicator dot */}
                  <circle
                    cx={city.labelX}
                    cy={city.labelY}
                    r="4"
                    fill={activeColor}
                    className={`stroke-2 transition-colors duration-300 ${
                      isDark ? "stroke-slate-900" : "stroke-white"
                    }`}
                  />
                  
                  {/* Glassmorphic small label banner */}
                  <rect
                    x={city.labelX - 22}
                    y={city.labelY - 24}
                    width="44"
                    height="16"
                    rx="4"
                    fill={isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)"}
                    stroke={activeColor}
                    strokeWidth="1"
                    className="shadow-sm"
                  />

                  {/* Text Label */}
                  <text
                    x={city.labelX}
                    y={city.labelY - 12}
                    textAnchor="middle"
                    className={`text-[9px] font-bold tracking-wider font-sans select-none ${
                      isDark ? "fill-white" : "fill-slate-800"
                    }`}
                  >
                    {city.name.replace("市", "")}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Popup Overlay */}
        <AnimatePresence>
          {hoveredCity && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute bottom-4 left-4 right-4 p-3.5 rounded-xl border shadow-lg ${
                isDark 
                  ? "bg-slate-950/95 border-sky-550/30 text-white" 
                  : "bg-white/95 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex justify-between items-center border-b border-slate-500/10 pb-1.5 mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 ${isDark ? "text-sky-400" : "text-[#0052cc]"}`} />
                  {hoveredCity.name}
                  <span className="text-[10px] uppercase font-mono font-normal opacity-60">
                    ({hoveredCity.pinyin})
                  </span>
                </span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                  isDark ? "bg-sky-500/10 text-sky-400" : "bg-[#0052cc]/10 text-[#0052cc]"
                }`}>
                  激活率: {hoveredCity.doctors > 0 ? ((hoveredCity.activeDoctors / hoveredCity.doctors) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-gray-500 block text-[9px] mb-0.5">入驻医护 / 激活</span>
                  <span className="font-mono font-bold">{hoveredCity.doctors} / {hoveredCity.activeDoctors} 位</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] mb-0.5">添加居民</span>
                  <span className="font-mono font-bold">{(hoveredCity.residentsAdded / 10000).toFixed(1)} 万人</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] mb-0.5">近增好友</span>
                  <span className="text-emerald-500 font-mono font-extrabold">+{hoveredCity.recentAdded.toLocaleString()}人</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Footer legends */}
      <div className="flex justify-between items-center border-t border-slate-500/10 pt-2 z-10">
        <div className="flex gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-200 border-slate-300"} border block`}></span>
            <span>待选地市</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500 border border-emerald-400 block animate-pulse"></span>
            <span>联动聚焦地市</span>
          </div>
        </div>
        <span className="text-[9px] font-mono opacity-65 flex items-center gap-1">
          <Info className="w-3 h-3" />
          点击城市激发全屏数据联动
        </span>
      </div>
    </div>
  );
}
