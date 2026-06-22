import { provinceData, citiesData } from "../data";
import type { CityData, ProvinceData } from "../types";

export interface DashboardDataPayload {
  schemaVersion?: string;
  publishedAt?: string;
  sourceName?: string;
  province?: Partial<ProvinceData>;
  cities?: Array<Partial<CityData> & { id?: string; name?: string }>;
}

export interface LoadedDashboardData {
  province: ProvinceData;
  cities: CityData[];
  sourceUrl: string;
  sourceName: string;
  publishedAt?: string;
}

export const DASHBOARD_DATA_URL =
  (import.meta.env.VITE_DASHBOARD_DATA_URL as string | undefined) || "/data/dashboard-data.json";

const normalizeName = (name?: string) => (name || "").trim().replace("市", "");

const mergeProvince = (incoming?: Partial<ProvinceData>): ProvinceData => {
  return {
    ...provinceData,
    ...(incoming || {})
  };
};

const mergeCities = (incomingCities?: DashboardDataPayload["cities"]): CityData[] => {
  if (!incomingCities || incomingCities.length === 0) {
    return citiesData.map((city) => ({ ...city }));
  }

  return citiesData.map((fallbackCity) => {
    const matched = incomingCities.find((item) => {
      if (item.id && item.id === fallbackCity.id) return true;
      if (item.name && normalizeName(item.name) === normalizeName(fallbackCity.name)) return true;
      return false;
    });

    if (!matched) return { ...fallbackCity };

    return {
      ...fallbackCity,
      ...matched,
      id: fallbackCity.id,
      name: matched.name || fallbackCity.name,
      pinyin: fallbackCity.pinyin,
      svgPath: fallbackCity.svgPath,
      labelX: fallbackCity.labelX,
      labelY: fallbackCity.labelY
    };
  });
};

export const loadDashboardData = async (): Promise<LoadedDashboardData> => {
  const separator = DASHBOARD_DATA_URL.includes("?") ? "&" : "?";
  const response = await fetch(`${DASHBOARD_DATA_URL}${separator}t=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`统一数据源请求失败：${response.status}`);
  }

  const payload = (await response.json()) as DashboardDataPayload;

  return {
    province: mergeProvince(payload.province),
    cities: mergeCities(payload.cities),
    sourceUrl: DASHBOARD_DATA_URL,
    sourceName: payload.sourceName || "统一 data.json",
    publishedAt: payload.publishedAt
  };
};
