import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import "echarts-gl";
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

type GeoCoordinate = [number, number];

const MAP_NAME = "zhejiang-digital-twin";
const GEO_JSON_SOURCES = [
  "https://geo.datav.aliyun.com/areas_v3/bound/330000_full.json",
  "https://geo.datav.aliyun.com/areas_v3/bound/330000.json"
];

const cityCoordinates: Record<string, GeoCoordinate> = {
  hangzhou: [120.1536, 30.2875],
  ningbo: [121.5498, 29.8683],
  wenzhou: [120.6994, 27.9949],
  jiaxing: [120.7555, 30.7461],
  huzhou: [120.1024, 30.8672],
  shaoxing: [120.5821, 29.9971],
  jinhua: [119.6495, 29.0895],
  quzhou: [118.8726, 28.9417],
  zhoushan: [122.2072, 29.9853],
  taizhou: [121.4286, 28.6614],
  lishui: [119.9219, 28.451]
};

const safeNumber = (value: number | null | undefined) => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const formatTenThousand = (value: number | null | undefined) => {
  const current = safeNumber(value);
  if (current >= 10000) return `${(current / 10000).toFixed(1)}万`;
  return current.toLocaleString();
};

const resolveCityByRegionName = (cities: CityData[], regionName?: string) => {
  if (!regionName) return null;
  return cities.find((city) => city.name === regionName || city.name.replace("市", "") === regionName.replace("市", "")) ?? null;
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const isDark = theme === "dark";
  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId) ?? null, [cities, selectedCityId]);
  const activeCity = selectedCity ?? hoveredCity;

  const maxResidents = useMemo(() => Math.max(1, ...cities.map((city) => safeNumber(city.residentsAdded))), [cities]);
  const maxDoctors = useMemo(() => Math.max(1, ...cities.map((city) => safeNumber(city.doctors))), [cities]);

  useEffect(() => {
    if (!chartDomRef.current) return;

    const chart = echarts.init(chartDomRef.current, isDark ? "dark" : undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.showLoading("default", {
      text: "正在加载浙江省真实 GeoJSON 地图...",
      color: "#22d3ee",
      textColor: "#94a3b8",
      maskColor: "rgba(3, 7, 18, 0.82)"
    });

    let cancelled = false;

    const loadGeoJson = async () => {
      let lastError: unknown = null;

      for (const source of GEO_JSON_SOURCES) {
        try {
          const response = await fetch(source);
          if (!response.ok) throw new Error(`GeoJSON 请求失败：${response.status}`);
          const geoJson = await response.json();
          if (cancelled) return;

          if (!(echarts as any).getMap?.(MAP_NAME)) {
            echarts.registerMap(MAP_NAME, geoJson as any);
          }

          setMapReady(true);
          setLoadError(null);
          chart.hideLoading();
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!cancelled) {
        chart.hideLoading();
        setLoadError(lastError instanceof Error ? lastError.message : "GeoJSON 地图加载失败");
      }
    };

    loadGeoJson();

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartDomRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [isDark]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mapReady) return;

    const citiesWithCoordinates = cities.filter((city) => cityCoordinates[city.id]);

    const regionStyles = citiesWithCoordinates.map((city) => {
      const isSelected = selectedCityId === city.id;
      const isHovered = hoveredCity?.id === city.id;
      const residentLevel = safeNumber(city.residentsAdded) / maxResidents;

      return {
        name: city.name,
        itemStyle: {
          color: isSelected
            ? "rgba(16, 185, 129, 0.92)"
            : isHovered
              ? "rgba(34, 211, 238, 0.86)"
              : `rgba(${18 + residentLevel * 28}, ${64 + residentLevel * 75}, ${112 + residentLevel * 105}, 0.86)`,
          borderColor: isSelected ? "#a7f3d0" : isHovered ? "#67e8f9" : "rgba(125, 211, 252, 0.46)",
          borderWidth: isSelected || isHovered ? 2.4 : 1.2
        },
        label: {
          show: true,
          color: "#e0f2fe",
          fontSize: isSelected || isHovered ? 13 : 10,
          fontWeight: isSelected || isHovered ? 800 : 600
        }
      };
    });

    const mapData = citiesWithCoordinates.map((city) => {
      const isSelected = selectedCityId === city.id;
      const isHovered = hoveredCity?.id === city.id;
      return {
        name: city.name,
        value: safeNumber(city.residentsAdded),
        height: 3 + (safeNumber(city.residentsAdded) / maxResidents) * 9 + (isSelected ? 4 : 0),
        itemStyle: {
          color: isSelected
            ? "rgba(16, 185, 129, 0.96)"
            : isHovered
              ? "rgba(34, 211, 238, 0.9)"
              : "rgba(14, 116, 144, 0.82)"
        }
      };
    });

    const dataPillars = citiesWithCoordinates.map((city) => {
      const coordinate = cityCoordinates[city.id];
      const isSelected = selectedCityId === city.id;
      const normalizedHeight = 5 + (safeNumber(city.residentsAdded) / maxResidents) * 38;
      return {
        name: city.name,
        value: [coordinate[0], coordinate[1], normalizedHeight],
        itemStyle: {
          color: isSelected ? "#34d399" : "#22d3ee",
          opacity: isSelected ? 0.96 : 0.62
        }
      };
    });

    const cityNodes = citiesWithCoordinates.map((city) => {
      const coordinate = cityCoordinates[city.id];
      const isSelected = selectedCityId === city.id;
      const isHovered = hoveredCity?.id === city.id;
      return {
        name: city.name,
        value: [coordinate[0], coordinate[1], 6 + (safeNumber(city.doctors) / maxDoctors) * 18],
        symbolSize: isSelected ? 18 : isHovered ? 15 : 10,
        itemStyle: {
          color: isSelected ? "#10b981" : "#38bdf8",
          opacity: isSelected || isHovered ? 1 : 0.82
        }
      };
    });

    const hangzhouCoordinate = cityCoordinates.hangzhou;
    const dataFlows = citiesWithCoordinates
      .filter((city) => city.id !== "hangzhou")
      .map((city) => ({
        name: `杭州-${city.name}`,
        coords: [hangzhouCoordinate, cityCoordinates[city.id]],
        value: safeNumber(city.recentAdded)
      }));

    const option: any = {
      backgroundColor: "transparent",
      tooltip: {
        show: true,
        trigger: "item",
        borderWidth: 1,
        borderColor: "rgba(34, 211, 238, 0.35)",
        backgroundColor: "rgba(2, 6, 23, 0.92)",
        textStyle: { color: "#e2e8f0" },
        formatter: (params: any) => {
          const city = resolveCityByRegionName(cities, params.name);
          if (!city) return params.name ?? "浙江省";
          const doctors = safeNumber(city.doctors);
          const activeDoctors = safeNumber(city.activeDoctors);
          const activeRate = doctors > 0 ? ((activeDoctors / doctors) * 100).toFixed(1) : "-";

          return [
            `<strong style=\"font-size:13px;color:#67e8f9\">${city.name}</strong>`,
            `入驻医护：${doctors.toLocaleString()} 位`,
            `添加居民：${formatTenThousand(city.residentsAdded)} 人`,
            `近增好友：+${safeNumber(city.recentAdded).toLocaleString()} 人`,
            `医护激活率：${activeRate}%`
          ].join("<br/>");
        }
      },
      geo3D: {
        map: MAP_NAME,
        roam: true,
        silent: false,
        regionHeight: 5.6,
        groundPlane: { show: true, color: "rgba(15, 23, 42, 0.34)" },
        shading: "lambert",
        realisticMaterial: { roughness: 0.56, metalness: 0.1 },
        environment: "rgba(2, 6, 23, 0)",
        boxWidth: 92,
        boxDepth: 76,
        label: { show: true, color: "#cbd5e1", fontSize: 10, distance: 3 },
        itemStyle: {
          color: "rgba(15, 118, 164, 0.86)",
          borderColor: "rgba(125, 211, 252, 0.48)",
          borderWidth: 1.1,
          opacity: 0.98
        },
        emphasis: {
          label: { show: true, color: "#ffffff", fontSize: 13, fontWeight: 800 },
          itemStyle: { color: "rgba(34, 211, 238, 0.92)", borderColor: "#a7f3d0", borderWidth: 2.4 }
        },
        regions: regionStyles,
        viewControl: {
          projection: "perspective",
          autoRotate: !selectedCityId,
          autoRotateAfterStill: 6,
          autoRotateSpeed: 1.8,
          distance: selectedCityId ? 78 : 95,
          alpha: 47,
          beta: -16,
          center: [0, 0, selectedCityId ? 3 : 0],
          rotateSensitivity: 1.2,
          zoomSensitivity: 1.1,
          panSensitivity: 0.8,
          minDistance: 58,
          maxDistance: 138
        },
        light: {
          main: { intensity: 1.58, shadow: true, alpha: 48, beta: 26 },
          ambient: { intensity: 0.58 },
          ambientCubemap: { exposure: 0.9, diffuseIntensity: 0.45, specularIntensity: 0.24 }
        },
        postEffect: {
          enable: true,
          bloom: { enable: true, bloomIntensity: 0.18 },
          SSAO: { enable: true, radius: 2, intensity: 1.2 }
        },
        temporalSuperSampling: { enable: true }
      },
      series: [
        {
          name: "省域服务热力",
          type: "map3D",
          map: MAP_NAME,
          data: mapData,
          silent: true,
          regionHeight: 1.2,
          shading: "lambert",
          itemStyle: { opacity: 0.04 },
          emphasis: { disabled: true }
        },
        {
          name: "城市数据光柱",
          type: "bar3D",
          coordinateSystem: "geo3D",
          data: dataPillars,
          bevelSize: 0.18,
          bevelSmoothness: 3,
          barSize: 1.25,
          minHeight: 2,
          shading: "lambert",
          label: { show: false },
          emphasis: {
            label: { show: true, formatter: "{b}", color: "#ffffff", fontSize: 12, fontWeight: 700 }
          }
        },
        {
          name: "城市运行节点",
          type: "scatter3D",
          coordinateSystem: "geo3D",
          data: cityNodes,
          symbol: "circle",
          blendMode: "lighter",
          label: { show: true, formatter: "{b}", distance: 8, color: "#e0f2fe", fontSize: 10, fontWeight: 700 },
          itemStyle: { borderColor: "#ecfeff", borderWidth: 1.2, shadowBlur: 18, shadowColor: "#22d3ee" },
          emphasis: { scale: true, itemStyle: { color: "#34d399" } }
        },
        {
          name: "省级数据流",
          type: "lines3D",
          coordinateSystem: "geo3D",
          data: dataFlows,
          blendMode: "lighter",
          effect: { show: true, trailWidth: 4, trailLength: 0.16, trailOpacity: 0.72, constantSpeed: 22 },
          lineStyle: { width: 1.8, color: "#38bdf8", opacity: 0.42 }
        }
      ]
    };

    chart.setOption(option, true);
  }, [cities, hoveredCity, isDark, mapReady, maxDoctors, maxResidents, selectedCityId]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mapReady) return;

    const handleMouseOver = (params: any) => {
      const city = resolveCityByRegionName(cities, params.name);
      if (city) setHoveredCity(city);
    };

    const handleClick = (params: any) => {
      const city = resolveCityByRegionName(cities, params.name);
      if (!city) return;
      onSelectCity(selectedCityId === city.id ? null : city.id);
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

  const activeDoctors = safeNumber(activeCity?.activeDoctors);
  const activeDoctorTotal = safeNumber(activeCity?.doctors);
  const activeRate = activeDoctorTotal > 0 ? ((activeDoctors / activeDoctorTotal) * 100).toFixed(1) : "-";

  return (
    <div
      className="relative w-full h-[600px] lg:h-[725px] rounded-2xl border border-cyan-500/20 bg-[#020617]/90 shadow-[0_4px_35px_rgba(0,0,0,0.55),inset_0_0_35px_rgba(34,211,238,0.08)] text-white p-4 flex flex-col justify-between overflow-hidden"
      id="zhejiang-map-container"
    >
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_42%),linear-gradient(rgba(34,211,238,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.055)_1px,transparent_1px)] bg-[size:100%_100%,26px_26px,26px_26px]" />
        <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-cyan-400/10 shadow-[0_0_90px_rgba(34,211,238,0.18)]" />
        <div className="absolute right-8 top-20 h-40 w-40 rounded-full border border-emerald-400/10 shadow-[0_0_70px_rgba(16,185,129,0.12)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent animate-pulse" />
      </div>

      <div className="flex justify-between items-start z-20 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono tracking-[0.32em] uppercase">
            <Satellite className="w-3.5 h-3.5" />
            Zhejiang Digital Twin Cockpit
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
            浙江省“加个微信，多个医生朋友”数据统计大屏
            <span className="text-[9.5px] py-0.5 px-2 rounded-full font-bold border bg-cyan-500/10 text-cyan-200 border-cyan-400/30 shadow-[0_0_16px_rgba(34,211,238,0.18)]">
              GeoJSON · 3D
            </span>
          </h1>
          <span className="text-[11px] text-slate-400 font-mono">
            数据更新截止时间：{updateTime} ｜ 真实地理边界 · 省市联动 · 运行态势
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="open-excel-portal"
            onClick={onOpenUpload}
            className="text-[10.5px] px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Excel 导入</span>
          </button>

          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/8 text-[10px] text-emerald-300 font-mono">
            <Activity className="w-3.5 h-3.5" />
            LIVE
          </div>

          {selectedCityId && (
            <motion.button
              id="reset-map-zoom"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCity(null)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer font-medium bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
            >
              <RotateCcw className="w-3 h-3" />
              返回全省
            </motion.button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 mt-1">
        <div ref={chartDomRef} className="w-full h-full min-h-[480px] lg:min-h-[585px]" />

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-xs text-rose-200 shadow-lg">
              浙江省真实 GeoJSON 地图加载失败：{loadError}
              <div className="mt-1 text-[10px] text-rose-200/70">
                请检查网络是否允许访问 geo.datav.aliyun.com，或将 GeoJSON 文件改为本地静态资源。
              </div>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-4 z-20 rounded-xl border border-cyan-400/15 bg-slate-950/45 px-3 py-2 backdrop-blur-sm shadow-[0_0_18px_rgba(34,211,238,0.08)]">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-200 font-semibold">
            <Waves className="w-3 h-3" />
            省级数据流向
          </div>
          <div className="mt-1 text-[9px] text-slate-400 leading-relaxed">
            杭州枢纽连接各地市<br />光柱高度映射居民连接规模
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeCity && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="absolute bottom-14 left-4 right-4 z-30 p-3.5 rounded-xl border shadow-lg bg-slate-950/90 border-cyan-400/25 text-white backdrop-blur-md"
          >
            <div className="flex justify-between items-center border-b border-cyan-400/10 pb-1.5 mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-100">
                <MapPin className="w-3.5 h-3.5 text-cyan-300" />
                {activeCity.name}
                <span className="text-[10px] uppercase font-mono font-normal opacity-60">({activeCity.pinyin})</span>
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                激活率: {activeRate}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block text-[9px] mb-0.5">入驻医护</span>
                <span className="font-mono font-bold">{safeNumber(activeCity.doctors).toLocaleString()} 位</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] mb-0.5">添加居民</span>
                <span className="font-mono font-bold">{formatTenThousand(activeCity.residentsAdded)} 人</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] mb-0.5">近增好友</span>
                <span className="text-emerald-400 font-mono font-extrabold">+{safeNumber(activeCity.recentAdded).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] mb-0.5">单聊回复率</span>
                <span className="text-cyan-200 font-mono font-extrabold">
                  {activeCity.singleReplyRate !== null ? `${activeCity.singleReplyRate}%` : "-"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center border-t border-cyan-400/10 pt-2 z-20">
        <div className="flex gap-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-cyan-400/70 border border-cyan-200/70 block shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
            <span>城市运行节点</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-400 border border-emerald-200 block animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span>联动聚焦地市</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="w-7 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-300 to-transparent block" />
            <span>省级数据流</span>
          </div>
        </div>
        <span className="text-[9px] font-mono opacity-70 flex items-center gap-1 text-slate-400">
          <Info className="w-3 h-3" />
          点击城市激发全屏数据联动
        </span>
      </div>
    </div>
  );
}
