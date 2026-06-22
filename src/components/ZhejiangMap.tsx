import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { motion, AnimatePresence } from "motion/react";
import type { CityData } from "../types";
import { zhejiangLocalGeoJson } from "../assets/zhejiangLocalGeoJson";
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

type GeoCoordinate = [number, number];

const MAP_NAME = "zhejiang-high-quality-boundary";
const HIGH_QUALITY_GEOJSON_SOURCES = [
  "https://cdn.jsdelivr.net/gh/longwosion/geojson-map-china@master/geometryProvince/33.json",
  "https://raw.githubusercontent.com/longwosion/geojson-map-china/master/geometryProvince/33.json"
];

const cityCoordinates: Record<string, GeoCoordinate> = {
  hangzhou: [119.5313, 29.8773],
  ningbo: [121.5967, 29.6466],
  wenzhou: [120.498, 27.8119],
  jiaxing: [120.9155, 30.6354],
  huzhou: [119.8608, 30.7782],
  shaoxing: [120.564, 29.7565],
  jinhua: [120.0037, 29.1028],
  quzhou: [118.6853, 28.8666],
  zhoushan: [122.2559, 30.2234],
  taizhou: [121.1353, 28.6688],
  lishui: [119.5642, 28.1854]
};

const num = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const wan = (value: number | null | undefined) => {
  const current = num(value);
  return current >= 10000 ? `${(current / 10000).toFixed(1)}万` : current.toLocaleString();
};
const findCity = (cities: CityData[], name?: string) => {
  if (!name) return null;
  return cities.find((city) => city.name === name || city.name.replace("市", "") === name.replace("市", "")) ?? null;
};

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
  const chartDomRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);
  const [mapSource, setMapSource] = useState<"local" | "remote">("local");
  const [loadError, setLoadError] = useState<string | null>(null);
  const isDark = theme === "dark";

  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId) ?? null, [cities, selectedCityId]);
  const activeCity = selectedCity ?? hoveredCity;
  const maxResidents = useMemo(() => Math.max(1, ...cities.map((city) => num(city.residentsAdded))), [cities]);
  const hubCoordinate = cityCoordinates.hangzhou;

  useEffect(() => {
    if (!chartDomRef.current) return;
    const chart = echarts.init(chartDomRef.current, isDark ? "dark" : undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.showLoading("default", {
      text: "正在加载浙江省高质量边界地图...",
      color: "#22d3ee",
      textColor: "#94a3b8",
      maskColor: "rgba(3,7,18,0.82)"
    });

    let cancelled = false;
    const registerMap = (geoJson: unknown, source: "local" | "remote") => {
      echarts.registerMap(MAP_NAME, geoJson as any);
      chart.hideLoading();
      setMapSource(source);
      setLoadError(null);
      setMapReady(true);
      setMapVersion((version) => version + 1);
    };

    try {
      registerMap(zhejiangLocalGeoJson, "local");
    } catch (error) {
      chart.hideLoading();
      setLoadError(error instanceof Error ? error.message : "本地地图加载失败");
    }

    const loadRemoteMap = async () => {
      for (const source of HIGH_QUALITY_GEOJSON_SOURCES) {
        try {
          const response = await fetch(source);
          if (!response.ok) continue;
          const geoJson = await response.json();
          if (!cancelled) registerMap(geoJson, "remote");
          return;
        } catch {
          // 高质量远程 GeoJSON 加载失败时保留本地兜底地图。
        }
      }
    };
    loadRemoteMap();

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartDomRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [isDark]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mapReady) return;

    const validCities = cities.filter((city) => cityCoordinates[city.id]);
    const regions = validCities.map((city) => {
      const selected = selectedCityId === city.id;
      const hovered = hoveredCity?.id === city.id;
      const dim = Boolean(selectedCityId && !selected);
      return {
        name: city.name,
        itemStyle: {
          areaColor: selected ? "rgba(16,185,129,0.72)" : hovered ? "rgba(14,165,233,0.48)" : dim ? "rgba(15,38,62,0.38)" : "rgba(15,38,62,0.72)",
          borderColor: selected ? "#bbf7d0" : hovered ? "#a5f3fc" : "rgba(148,163,184,0.58)",
          borderWidth: selected || hovered ? 2 : 1
        },
        label: {
          show: selected || hovered,
          color: "#f8fafc",
          fontSize: 12,
          fontWeight: 800
        }
      };
    });

    const nodeData = validCities.map((city) => {
      const coordinate = cityCoordinates[city.id];
      const selected = selectedCityId === city.id;
      const hovered = hoveredCity?.id === city.id;
      return {
        name: city.name,
        value: [coordinate[0], coordinate[1], num(city.residentsAdded)],
        symbolSize: selected ? 14 : hovered ? 12 : 7 + (num(city.residentsAdded) / maxResidents) * 7,
        itemStyle: {
          color: selected ? "#34d399" : hovered ? "#67e8f9" : "#94a3b8",
          borderColor: "#e2e8f0",
          borderWidth: selected || hovered ? 1.3 : 0.7
        }
      };
    });

    const flowData = validCities
      .filter((city) => city.id !== "hangzhou")
      .map((city) => ({
        name: `杭州-${city.name}`,
        coords: [hubCoordinate, cityCoordinates[city.id]],
        value: num(city.recentAdded)
      }));

    const option: any = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        borderColor: "rgba(34,211,238,0.35)",
        backgroundColor: "rgba(2,6,23,0.92)",
        textStyle: { color: "#e2e8f0" },
        formatter: (params: any) => {
          const city = findCity(cities, params.name);
          if (!city) return params.name ?? "浙江省";
          const doctors = num(city.doctors);
          const rate = doctors > 0 ? ((num(city.activeDoctors) / doctors) * 100).toFixed(1) : "-";
          return `${city.name}<br/>入驻医护：${doctors.toLocaleString()} 位<br/>添加居民：${wan(city.residentsAdded)} 人<br/>近增好友：+${num(city.recentAdded).toLocaleString()} 人<br/>医护激活率：${rate}%`;
        }
      },
      geo: {
        map: MAP_NAME,
        roam: false,
        layoutCenter: ["51%", "52%"],
        layoutSize: "88%",
        aspectScale: 0.9,
        silent: false,
        itemStyle: {
          areaColor: "rgba(15,38,62,0.72)",
          borderColor: "rgba(148,163,184,0.58)",
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: "rgba(14,165,233,0.48)", borderColor: "#a5f3fc", borderWidth: 2 },
          label: { show: true, color: "#ffffff", fontWeight: 800 }
        },
        regions
      },
      series: [
        {
          name: "省级数据流",
          type: "lines",
          coordinateSystem: "geo",
          zlevel: 2,
          data: flowData,
          silent: true,
          effect: { show: true, period: 6, trailLength: 0.18, symbol: "circle", symbolSize: 3 },
          lineStyle: { color: "#38bdf8", width: 1, opacity: selectedCityId ? 0.16 : 0.08, curveness: 0.18 }
        },
        {
          name: "城市服务节点",
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 3,
          data: nodeData,
          rippleEffect: { brushType: "stroke", scale: 2.5, period: 4 },
          label: {
            show: true,
            formatter: "{b}",
            position: "top",
            color: "#e2e8f0",
            fontSize: 10,
            fontWeight: 700,
            backgroundColor: "rgba(2,6,23,0.62)",
            borderColor: "rgba(148,163,184,0.38)",
            borderWidth: 1,
            borderRadius: 6,
            padding: [3, 6]
          }
        }
      ]
    };

    chart.setOption(option, true);
  }, [cities, hoveredCity, hubCoordinate, mapReady, mapVersion, maxResidents, selectedCityId]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mapReady) return;

    const handleMouseOver = (params: any) => {
      const city = findCity(cities, params.name);
      if (city) setHoveredCity(city);
    };
    const handleClick = (params: any) => {
      const city = findCity(cities, params.name);
      if (city) onSelectCity(selectedCityId === city.id ? null : city.id);
    };
    const handleGlobalOut = () => setHoveredCity(null);

    chart.off("mouseover");
    chart.off("click");
    chart.off("globalout");
    chart.on("mouseover", handleMouseOver);
    chart.on("click", handleClick);
    chart.on("globalout", handleGlobalOut);
    return () => {
      chart.off("mouseover", handleMouseOver);
      chart.off("click", handleClick);
      chart.off("globalout", handleGlobalOut);
    };
  }, [cities, mapReady, onSelectCity, selectedCityId, setHoveredCity]);

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
          <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono tracking-[0.32em] uppercase"><Satellite className="w-3.5 h-3.5" />Zhejiang Digital Twin Cockpit</div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-cyan-500/10 text-cyan-200 border-cyan-400/30">高质量 GeoJSON 版</span>
          </h1>
          <span className="text-[11px] text-slate-400 font-mono">数据更新截止时间：{updateTime} ｜ {mapSource === "remote" ? "高质量浙江地市边界已加载" : "本地地图兜底加载中"}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button id="open-excel-portal" onClick={onOpenUpload} className="text-[10.5px] px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer font-bold transition-all"><FileSpreadsheet className="w-3.5 h-3.5" />Excel 导入</button>
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/8 text-[10px] text-emerald-300 font-mono"><Activity className="w-3.5 h-3.5" />LIVE</div>
          {selectedCityId && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelectCity(null)} className="text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/30"><RotateCcw className="w-3 h-3" />返回全省</motion.button>}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 mt-1 flex items-center justify-center">
        <div className="absolute left-3 top-4 z-20 rounded-xl border border-cyan-400/15 bg-slate-950/45 px-3 py-2 backdrop-blur-sm"><div className="flex items-center gap-1.5 text-[10px] text-cyan-200 font-semibold"><Waves className="w-3 h-3" />省级数据流向</div><div className="mt-1 text-[9px] text-slate-400 leading-relaxed">高质量地市边界<br />服务节点与数据流叠加</div></div>
        <div ref={chartDomRef} className="w-full h-full min-h-[480px] lg:min-h-[585px]" />
        {loadError && <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><div className="rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-xs text-rose-200 shadow-lg">浙江省地图加载失败：{loadError}</div></div>}
      </div>

      <AnimatePresence>
        {activeCity && <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} className="absolute bottom-14 left-4 right-4 z-30 p-3.5 rounded-xl border shadow-lg bg-slate-950/90 border-cyan-400/25 text-white backdrop-blur-md"><div className="flex justify-between items-center border-b border-cyan-400/10 pb-1.5 mb-2"><span className="text-xs font-bold flex items-center gap-1.5 text-cyan-100"><MapPin className="w-3.5 h-3.5 text-cyan-300" />{activeCity.name}<span className="text-[10px] uppercase font-mono font-normal opacity-60">({activeCity.pinyin})</span></span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">激活率: {activeRate}%</span></div><div className="grid grid-cols-4 gap-2 text-[10px]"><div><span className="text-slate-500 block text-[9px] mb-0.5">入驻医护</span><span className="font-mono font-bold">{num(activeCity.doctors).toLocaleString()} 位</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">添加居民</span><span className="font-mono font-bold">{wan(activeCity.residentsAdded)} 人</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">近增好友</span><span className="text-emerald-400 font-mono font-extrabold">+{num(activeCity.recentAdded).toLocaleString()}</span></div><div><span className="text-slate-500 block text-[9px] mb-0.5">单聊回复率</span><span className="text-cyan-200 font-mono font-extrabold">{activeCity.singleReplyRate !== null ? `${activeCity.singleReplyRate}%` : "-"}</span></div></div></motion.div>}
      </AnimatePresence>

      <div className="flex justify-between items-center border-t border-cyan-400/10 pt-2 z-20"><div className="flex gap-3 text-[10px] text-slate-400"><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-400/70 border border-slate-200/50 block" />高质量边界</div><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 border border-emerald-200 block animate-pulse" />选中地市</div><div className="hidden sm:flex items-center gap-1"><span className="w-7 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-300 to-transparent block" />省级数据流</div></div><span className="text-[9px] font-mono opacity-70 flex items-center gap-1 text-slate-400"><Info className="w-3 h-3" />点击地市聚焦，再点一次取消</span></div>
    </div>
  );
}
