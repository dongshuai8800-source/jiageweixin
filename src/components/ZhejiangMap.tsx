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
  onOpenUpload
}: ZhejiangMapProps) {
  const chartDomRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);
  const [mapSource, setMapSource] = useState<"local" | "remote">("local");
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId) ?? null, [cities, selectedCityId]);
  const activeCity = selectedCity ?? hoveredCity;
  const maxResidents = useMemo(() => Math.max(1, ...cities.map((city) => num(city.residentsAdded))), [cities]);
  const hubCoordinate = cityCoordinates.hangzhou;

  useEffect(() => {
    if (!chartDomRef.current) return;
    const chart = echarts.init(chartDomRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.showLoading("default", {
      text: "正在加载浙江省高质量边界地图...",
      color: "#0f9f72",
      textColor: "#6f827b",
      maskColor: "rgba(246,250,246,0.72)"
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
  }, []);

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
          areaColor: selected ? "rgba(15,159,114,0.70)" : hovered ? "rgba(47,127,159,0.32)" : dim ? "rgba(207,224,216,0.42)" : "rgba(196,218,209,0.76)",
          borderColor: selected ? "#08775f" : hovered ? "#2f7f9f" : "rgba(82,111,103,0.42)",
          borderWidth: selected || hovered ? 2 : 1
        },
        label: {
          show: selected || hovered,
          color: selected ? "#064e3b" : "#17342f",
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
        symbolSize: selected ? 15 : hovered ? 12 : 7 + (num(city.residentsAdded) / maxResidents) * 7,
        itemStyle: {
          color: selected ? "#0f9f72" : hovered ? "#2f7f9f" : "#6d8f7d",
          borderColor: "rgba(255,255,255,0.92)",
          borderWidth: selected || hovered ? 2 : 1
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
        borderColor: "rgba(15,159,114,0.24)",
        backgroundColor: "rgba(255,255,255,0.96)",
        textStyle: { color: "#17342f" },
        extraCssText: "box-shadow:0 14px 34px rgba(31,68,58,0.18);border-radius:12px;",
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
        layoutCenter: ["51%", "53%"],
        layoutSize: "88%",
        aspectScale: 0.9,
        silent: false,
        itemStyle: {
          areaColor: "rgba(196,218,209,0.76)",
          borderColor: "rgba(82,111,103,0.42)",
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: "rgba(47,127,159,0.32)", borderColor: "#2f7f9f", borderWidth: 2 },
          label: { show: true, color: "#17342f", fontWeight: 800 }
        },
        regions
      },
      series: [
        {
          name: "省级服务流",
          type: "lines",
          coordinateSystem: "geo",
          zlevel: 2,
          data: flowData,
          silent: true,
          effect: { show: true, period: 6, trailLength: 0.18, symbol: "circle", symbolSize: 3 },
          lineStyle: { color: "#0f9f72", width: 1.2, opacity: selectedCityId ? 0.18 : 0.12, curveness: 0.18 }
        },
        {
          name: "城市服务节点",
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 3,
          data: nodeData,
          rippleEffect: { brushType: "stroke", scale: 2.3, period: 4 },
          label: {
            show: true,
            formatter: "{b}",
            position: "top",
            color: "#17342f",
            fontSize: 10,
            fontWeight: 800,
            backgroundColor: "rgba(255,255,255,0.82)",
            borderColor: "rgba(145,171,161,0.55)",
            borderWidth: 1,
            borderRadius: 7,
            padding: [3, 7]
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
    <div className="relative w-full h-[600px] lg:h-[725px] rounded-2xl border border-emerald-500/20 bg-white/75 shadow-[0_18px_54px_rgba(31,68,58,0.16),inset_0_1px_0_rgba(255,255,255,0.7)] text-[#17342f] p-4 flex flex-col justify-between overflow-hidden jiangnan-map-panel" id="zhejiang-map-container">
      <div className="absolute inset-0 pointer-events-none jiangnan-ink-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_18%,rgba(15,159,114,0.10),transparent_35%),radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.86),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(rgba(15,159,114,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(47,127,159,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute left-0 right-0 bottom-0 h-48 jiangnan-mountain-layer" />
        <div className="absolute left-0 right-0 bottom-0 h-32 jiangnan-water-layer" />
      </div>

      <div className="flex justify-between items-start z-20 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-[#2f7f9f] font-mono tracking-[0.32em] uppercase"><Satellite className="w-3.5 h-3.5" />Zhejiang Jiangnan Service Cockpit</div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#17342f] flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-[#0f9f72]/10 text-[#08775f] border-[#0f9f72]/25">江南水墨服务版</span>
          </h1>
          <span className="text-[11px] text-[#6f827b] font-mono">数据更新截止时间：{updateTime} ｜ {mapSource === "remote" ? "高质量浙江地市边界已加载" : "本地地图兜底加载中"}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button id="open-excel-portal" onClick={onOpenUpload} className="text-[10.5px] px-3 py-1.5 rounded bg-[#0f9f72]/10 hover:bg-[#0f9f72]/15 text-[#08775f] border border-[#0f9f72]/30 flex items-center gap-1.5 cursor-pointer font-bold transition-all"><FileSpreadsheet className="w-3.5 h-3.5" />Excel 导入</button>
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#0f9f72]/20 bg-[#0f9f72]/8 text-[10px] text-[#08775f] font-mono"><Activity className="w-3.5 h-3.5" />LIVE</div>
          {selectedCityId && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelectCity(null)} className="text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer bg-[#2f7f9f]/10 hover:bg-[#2f7f9f]/15 text-[#2f7f9f] border-[#2f7f9f]/25"><RotateCcw className="w-3 h-3" />返回全省</motion.button>}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 mt-1 flex items-center justify-center">
        <div className="absolute left-3 top-4 z-20 rounded-xl border border-[#91aba1]/40 bg-white/60 px-3 py-2 backdrop-blur-md shadow-[0_10px_28px_rgba(31,68,58,0.10)]"><div className="flex items-center gap-1.5 text-[10px] text-[#2f7f9f] font-semibold"><Waves className="w-3 h-3" />省级服务流向</div><div className="mt-1 text-[9px] text-[#6f827b] leading-relaxed">水墨地市边界<br />微信服务节点与数据流</div></div>
        <div ref={chartDomRef} className="w-full h-full min-h-[480px] lg:min-h-[585px]" />
        {loadError && <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><div className="rounded-xl border border-rose-400/25 bg-rose-50/80 px-4 py-3 text-xs text-rose-700 shadow-lg">浙江省地图加载失败：{loadError}</div></div>}
      </div>

      <AnimatePresence>
        {activeCity && <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} className="absolute bottom-14 left-4 right-4 z-30 p-3.5 rounded-xl border shadow-lg bg-white/86 border-[#91aba1]/45 text-[#17342f] backdrop-blur-md"><div className="flex justify-between items-center border-b border-[#91aba1]/30 pb-1.5 mb-2"><span className="text-xs font-bold flex items-center gap-1.5 text-[#17342f]"><MapPin className="w-3.5 h-3.5 text-[#0f9f72]" />{activeCity.name}<span className="text-[10px] uppercase font-mono font-normal opacity-60">({activeCity.pinyin})</span></span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0f9f72]/10 text-[#08775f] border border-[#0f9f72]/20">激活率: {activeRate}%</span></div><div className="grid grid-cols-4 gap-2 text-[10px]"><div><span className="text-[#6f827b] block text-[9px] mb-0.5">入驻医护</span><span className="font-mono font-bold">{num(activeCity.doctors).toLocaleString()} 位</span></div><div><span className="text-[#6f827b] block text-[9px] mb-0.5">添加居民</span><span className="font-mono font-bold">{wan(activeCity.residentsAdded)} 人</span></div><div><span className="text-[#6f827b] block text-[9px] mb-0.5">近增好友</span><span className="text-[#08775f] font-mono font-extrabold">+{num(activeCity.recentAdded).toLocaleString()}</span></div><div><span className="text-[#6f827b] block text-[9px] mb-0.5">单聊回复率</span><span className="text-[#2f7f9f] font-mono font-extrabold">{activeCity.singleReplyRate !== null ? `${activeCity.singleReplyRate}%` : "-"}</span></div></div></motion.div>}
      </AnimatePresence>

      <div className="flex justify-between items-center border-t border-[#91aba1]/30 pt-2 z-20"><div className="flex gap-3 text-[10px] text-[#6f827b]"><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#c4dad1] border border-white/80 block" />江南地市边界</div><div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#0f9f72] border border-white block animate-pulse" />选中地市</div><div className="hidden sm:flex items-center gap-1"><span className="w-7 h-px bg-gradient-to-r from-[#0f9f72]/15 via-[#0f9f72] to-transparent block" />微信服务流</div></div><span className="text-[9px] font-mono opacity-75 flex items-center gap-1 text-[#6f827b]"><Info className="w-3 h-3" />点击地市聚焦，再点一次取消</span></div>
    </div>
  );
}
