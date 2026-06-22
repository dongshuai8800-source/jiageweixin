import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";

const ROOT = process.cwd();
const DEFAULT_OUTPUT = path.join(ROOT, "public/data/dashboard-data.json");

const PROVINCE_KEYS_MAP = {
  "数据截至更新时间": "updateTime",
  "数据更新截止时间": "updateTime",
  "更新时间": "updateTime",
  "入驻机构数": "institutions",
  "入驻医护数": "doctors",
  "已激活医护数": "activeDoctors",
  "已激活数": "activeDoctors",
  "最近增加好友数": "recentAdded",
  "添加好友数": "recentAdded",
  "单聊已回复占比 (%)": "singleReplyRate",
  "单聊已回复占比(%)": "singleReplyRate",
  "单聊已回复占比": "singleReplyRate",
  "平均首次回复时间": "avgFirstReplyTime",
  "单聊总数": "singleChats",
  "单聊发送消息数": "singleMessages",
  "群聊总数": "groupChats",
  "活跃群聊数": "activeGroupChats",
  "群成员总数": "groupMembers",
  "活跃群成员数": "activeGroupMembers",
  "群聊消息总数": "groupMessages"
};

const CITY_KEYS_MAP = {
  "地市": "name",
  "地市名称": "name",
  "市区": "name",
  "名称": "name",
  "入驻机构数 (家)": "institutions",
  "入驻机构数": "institutions",
  "入驻医护数 (人)": "doctors",
  "入驻医护数": "doctors",
  "已激活医护数 (人)": "activeDoctors",
  "已激活医护数": "activeDoctors",
  "添加居民好友数 (人)": "residentsAdded",
  "添加居民好友数": "residentsAdded",
  "最近新增好友数 (人)": "recentAdded",
  "最近新增好友数": "recentAdded",
  "单聊已回复占比 (%)": "singleReplyRate",
  "单聊已回复占比": "singleReplyRate",
  "首次回复时长": "avgFirstReplyTime",
  "首次回复时长 (秒数)": "avgFirstReplySeconds",
  "首次回复时长秒数": "avgFirstReplySeconds",
  "单聊总数 (条)": "singleChats",
  "单聊总数": "singleChats",
  "单聊发送消息数 (条)": "singleMessages",
  "单聊发送消息数": "singleMessages",
  "群聊总数 (个)": "groupChats",
  "群聊总数": "groupChats",
  "活跃群聊数 (个)": "activeGroupChats",
  "活跃群聊数": "activeGroupChats",
  "群成员总数 (人)": "groupMembers",
  "群成员总数": "groupMembers",
  "活跃群成员数 (人)": "activeGroupMembers",
  "活跃群成员数": "activeGroupMembers",
  "群聊消息总数 (条)": "groupMessages",
  "群聊消息总数": "groupMessages"
};

const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith("--"));
const outArg = args.find((arg) => arg.startsWith("--out="));
const outputPath = outArg ? path.resolve(outArg.replace("--out=", "")) : DEFAULT_OUTPUT;

if (!inputArg) {
  console.error("用法：npm run data:excel -- <Excel文件路径> [--out=public/data/dashboard-data.json]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`Excel 文件不存在：${inputPath}`);
  process.exit(1);
}

const readCurrentData = () => {
  if (!fs.existsSync(outputPath)) {
    return {
      schemaVersion: "1.0.0",
      sourceName: "浙江省家医有约统一数据源",
      province: {},
      cities: []
    };
  }
  return JSON.parse(fs.readFileSync(outputPath, "utf-8"));
};

const getCellValue = (row, expectedHeader) => {
  const actualKey = Object.keys(row).find((key) => key.trim() === expectedHeader.trim());
  return actualKey ? row[actualKey] : undefined;
};

const normalizeCityName = (name = "") => String(name).trim().replace("市", "");
const isTextField = (field) => field === "name" || field === "updateTime" || field === "avgFirstReplyTime";

const coerceValue = (field, value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === "") return fallback ?? null;
  if (isTextField(field)) return String(value);
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback ?? null : parsed;
};

const readMappedFields = (row, mapping, base = {}) => {
  const next = { ...base };
  Object.entries(mapping).forEach(([header, field]) => {
    const value = getCellValue(row, header);
    if (value !== undefined) {
      next[field] = coerceValue(field, value, next[field]);
    }
  });
  return next;
};

const recalcProvinceRates = (province) => {
  if (province.doctors > 0 && province.activeDoctors !== null && province.activeDoctors !== undefined) {
    province.activeRate = Number(((province.activeDoctors / province.doctors) * 100).toFixed(1));
  }
  if (province.groupChats > 0 && province.activeGroupChats !== null && province.activeGroupChats !== undefined) {
    province.activeGroupChatsRate = Number(((province.activeGroupChats / province.groupChats) * 100).toFixed(1));
  }
  if (province.groupMembers > 0 && province.activeGroupMembers !== null && province.activeGroupMembers !== undefined) {
    province.activeGroupMembersRate = Number(((province.activeGroupMembers / province.groupMembers) * 100).toFixed(1));
  }
};

const recalcCityRates = (city) => {
  if (city.doctors > 0 && city.activeDoctors !== null && city.activeDoctors !== undefined) {
    city.activeRate = Number(((city.activeDoctors / city.doctors) * 100).toFixed(1));
  }
};

const workbook = XLSX.readFile(inputPath);
const provinceSheet = workbook.Sheets["全省总览指标"] || workbook.Sheets[workbook.SheetNames[0]];
const citySheet = workbook.Sheets["各地市数据统计"] || workbook.Sheets[workbook.SheetNames[1]];

if (!provinceSheet) {
  console.error("Excel 中未找到全省总览指标 Sheet。");
  process.exit(1);
}

const current = readCurrentData();
const provinceRows = XLSX.utils.sheet_to_json(provinceSheet);
const cityRows = citySheet ? XLSX.utils.sheet_to_json(citySheet) : [];

if (provinceRows.length === 0) {
  console.error("全省总览指标 Sheet 没有数据行。");
  process.exit(1);
}

const nextProvince = readMappedFields(provinceRows[0], PROVINCE_KEYS_MAP, current.province || {});
recalcProvinceRates(nextProvince);

const currentCities = Array.isArray(current.cities) ? current.cities : [];
const nextCities = currentCities.map((city) => ({ ...city }));
let matchedCount = 0;

cityRows.forEach((row) => {
  const nameValue = getCellValue(row, "地市") || getCellValue(row, "地市名称") || getCellValue(row, "名称") || getCellValue(row, "市区");
  if (!nameValue) return;

  const index = nextCities.findIndex((city) => normalizeCityName(city.name) === normalizeCityName(nameValue));
  if (index < 0) return;

  nextCities[index] = readMappedFields(row, CITY_KEYS_MAP, nextCities[index]);
  nextCities[index].id = currentCities[index].id;
  nextCities[index].name = nextCities[index].name || currentCities[index].name;
  recalcCityRates(nextCities[index]);
  matchedCount += 1;
});

const output = {
  schemaVersion: current.schemaVersion || "1.0.0",
  sourceName: current.sourceName || "浙江省家医有约统一数据源",
  publishedAt: new Date().toISOString(),
  province: nextProvince,
  cities: nextCities
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf-8");

console.log("✅ 已更新统一数据源 JSON");
console.log(`Excel：${inputPath}`);
console.log(`输出：${outputPath}`);
console.log(`匹配地市：${matchedCount}/${nextCities.length}`);
console.log("下一步：提交 public/data/dashboard-data.json 并重新部署，手机端和大屏端会读取同一份数据。");
