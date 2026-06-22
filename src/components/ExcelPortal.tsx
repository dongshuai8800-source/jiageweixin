import { useState, useRef, DragEvent, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { ProvinceData, CityData } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Database,
  RotateCcw,
  FileSpreadsheet,
  FileCode,
  Sparkles
} from "lucide-react";

interface ExcelPortalProps {
  isOpen: boolean;
  onClose: () => void;
  province: ProvinceData;
  cities: CityData[];
  onImport: (newProvince: ProvinceData, newCities: CityData[]) => void;
  onReset: () => void;
}

// Map Chinese column headers to internal property names
const PROVINCE_KEYS_MAP: Record<string, keyof ProvinceData> = {
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

const CITY_KEYS_MAP: Record<string, keyof CityData> = {
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

export default function ExcelPortal({
  isOpen,
  onClose,
  province,
  cities,
  onImport,
  onReset
}: ExcelPortalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedProvince, setParsedProvince] = useState<ProvinceData | null>(null);
  const [parsedCities, setParsedCities] = useState<CityData[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Current Excel Template
  const handleDownloadTemplate = () => {
    try {
      // Sheet 1: Province Data Row
      const provinceRow = {
        "数据更新截止时间": province.updateTime,
        "入驻机构数": province.institutions,
        "入驻医护数": province.doctors,
        "已激活医护数": province.activeDoctors,
        "最近增加好友数": province.recentAdded,
        "单聊已回复占比 (%)": province.singleReplyRate,
        "平均首次回复时间": province.avgFirstReplyTime,
        "单聊总数": province.singleChats,
        "单聊发送消息数": province.singleMessages,
        "群聊总数": province.groupChats,
        "活跃群聊数": province.activeGroupChats,
        "群成员总数": province.groupMembers,
        "活跃群成员数": province.activeGroupMembers,
        "群聊消息总数": province.groupMessages
      };

      // Sheet 2: Cities Rows
      const citiesRows = cities.map(c => ({
        "地市名称": c.name,
        "入驻机构数 (家)": c.institutions,
        "入驻医护数 (人)": c.doctors,
        "已激活医护数 (人)": c.activeDoctors,
        "添加居民好友数 (人)": c.residentsAdded,
        "最近新增好友数 (人)": c.recentAdded,
        "单聊已回复占比 (%)": c.singleReplyRate,
        "首次回复时长": c.avgFirstReplyTime,
        "首次回复时长秒数": c.avgFirstReplySeconds,
        "单聊总数 (条)": c.singleChats,
        "单聊发送消息数 (条)": c.singleMessages,
        "群聊总数 (个)": c.groupChats,
        "活跃群聊数 (个)": c.activeGroupChats,
        "群成员总数 (人)": c.groupMembers,
        "活跃群成员数 (人)": c.activeGroupMembers,
        "群聊消息总数 (条)": c.groupMessages
      }));

      const wb = XLSX.utils.book_new();

      const wsProvince = XLSX.utils.json_to_sheet([provinceRow]);
      XLSX.utils.book_append_sheet(wb, wsProvince, "全省总览指标");

      const wsCities = XLSX.utils.json_to_sheet(citiesRows);
      XLSX.utils.book_append_sheet(wb, wsCities, "各地市数据统计");

      // Auto Sizing Columns
      const fitCols = (ws: XLSX.WorkSheet) => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        const cols = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxLen = 12;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v) {
              const len = cell.v.toString().length * 2.1;
              if (len > maxLen) maxLen = len;
            }
          }
          cols.push({ wch: Math.min(Math.round(maxLen), 35) });
        }
        ws['!cols'] = cols;
      };

      fitCols(wsProvince);
      fitCols(wsCities);

      XLSX.writeFile(wb, "浙江省家医有约大屏数据模板.xlsx");
      setSuccessMsg("模板生成成功！请在Excel中编辑并上传。");
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg("生成模板失败: " + err.message);
      setSuccessMsg(null);
    }
  };

  // 2. Parsed File logic
  const processExcelBuffer = (buffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      setErrorMsg(null);
      setSuccessMsg(null);

      let sheet1 = workbook.Sheets["全省总览指标"] || workbook.Sheets[workbook.SheetNames[0]];
      let sheet2 = workbook.Sheets["各地市数据统计"] || workbook.Sheets[workbook.SheetNames[1]];

      if (!sheet1) {
        throw new Error("Excel中未找到全省总览数据表 (Sheet 1)");
      }

      const pRaw: any[] = XLSX.utils.sheet_to_json(sheet1);
      const cRaw: any[] = sheet2 ? XLSX.utils.sheet_to_json(sheet2) : [];

      if (pRaw.length === 0) {
        throw new Error("全省总览表（Sheet 1）中未检测到任何数据行");
      }

      // Parse Province
      const newProvince: ProvinceData = { ...province };
      const provDataRow = pRaw[0];
      
      Object.keys(provDataRow).forEach(colName => {
        const trimmed = colName.trim();
        const mappedKey = PROVINCE_KEYS_MAP[trimmed];
        if (mappedKey) {
          const val = provDataRow[colName];
          if (mappedKey === "updateTime" || mappedKey === "avgFirstReplyTime") {
            (newProvince as any)[mappedKey] = String(val);
          } else {
            (newProvince as any)[mappedKey] = Number(val) || 0;
          }
        }
      });

      // Recalculate automatic ratios for Province if possible
      if (newProvince.doctors > 0) {
        newProvince.activeRate = parseFloat(((newProvince.activeDoctors / newProvince.doctors) * 100).toFixed(1));
      }
      if (newProvince.groupChats > 0) {
        newProvince.activeGroupChatsRate = parseFloat(((newProvince.activeGroupChats / newProvince.groupChats) * 100).toFixed(1));
      }
      if (newProvince.groupMembers > 0) {
        newProvince.activeGroupMembersRate = parseFloat(((newProvince.activeGroupMembers / newProvince.groupMembers) * 100).toFixed(1));
      }

      // Parse Cities
      const updatedCities: CityData[] = cities.map(originalCity => ({ ...originalCity }));
      let matchedCount = 0;

      if (cRaw.length > 0) {
        cRaw.forEach((row: any) => {
          // Identify city name column
          let cityNameVal = "";
          Object.keys(row).forEach(k => {
            if (k.trim() === "地市" || k.trim() === "地市名称" || k.trim() === "名称" || k.trim() === "市区") {
              cityNameVal = String(row[k]);
            }
          });

          if (!cityNameVal) return;

          const normExcelName = cityNameVal.trim().replace("市", "");
          const cityIndex = updatedCities.findIndex(c => c.name.replace("市", "") === normExcelName);

          if (cityIndex !== -1) {
            matchedCount++;
            const cityNode = updatedCities[cityIndex];

            Object.keys(row).forEach(colName => {
              const trimmed = colName.trim();
              const mappedKey = CITY_KEYS_MAP[trimmed];
              if (mappedKey) {
                const val = row[colName];
                if (mappedKey === "avgFirstReplyTime") {
                  (cityNode as any)[mappedKey] = String(val);
                } else if (mappedKey === "name" || mappedKey === "pinyin" || mappedKey === "svgPath") {
                  // Do not overwrite topological drawings or static IDs
                } else {
                  (cityNode as any)[mappedKey] = Number(val) || 0;
                }
              }
            });

            // Auto-recalculate activeRate
            if (cityNode.doctors > 0) {
              cityNode.activeRate = parseFloat(((cityNode.activeDoctors / cityNode.doctors) * 100).toFixed(1));
            }
          }
        });
      }

      if (matchedCount === 0 && cRaw.length > 0) {
        throw new Error("没能匹配到浙江11地市中的任何一个，请确保‘地市名称’列的值如：杭州市、温州市 或 宁波市。");
      }

      setParsedProvince(newProvince);
      setParsedCities(updatedCities);
      setSuccessMsg(`数据解析完成！匹配全省主指标：1项，成功匹配地市：${matchedCount}/11个。`);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg("解析文件失败: " + err.message);
      setParsedProvince(null);
      setParsedCities(null);
      setSuccessMsg(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result;
        if (buffer instanceof ArrayBuffer) {
          processExcelBuffer(buffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Drag and Drop files handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result;
        if (buffer instanceof ArrayBuffer) {
          processExcelBuffer(buffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (parsedProvince && parsedCities) {
      onImport(parsedProvince, parsedCities);
      setSuccessMsg("所有导入修改已成功写入内存并实时更新！");
      setTimeout(() => {
        onClose();
        setFileName(null);
        setParsedProvince(null);
        setParsedCities(null);
        setSuccessMsg(null);
      }, 1000);
    }
  };

  const triggerResetOriginal = () => {
    if (window.confirm("确定要恢复到浙江省家庭医生的默认初始数据吗？该操作会清空当前正在展示的所有外部Excel修改。")) {
      onReset();
      setSuccessMsg("已成功回滚至出厂默认演示数据！");
      setErrorMsg(null);
      setFileName(null);
      setParsedProvince(null);
      setParsedCities(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Main card box */}
      <div 
        className="relative bg-[#0d162d] border border-slate-700/60 w-full max-w-3xl rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(16,185,129,0.05)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
        id="excel-modal-container"
      >
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-[#080d1a] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider flex items-center gap-1.5">
                浙江省家医大屏 • Excel 数据导入中心
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-normal">
                  SheetJS 引擎
                </span>
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">您可以下载实时模板，修改数值后重新上传以覆盖全省或地市指标。</p>
            </div>
          </div>
          <button 
            id="close-excel-portal"
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Section 1: Template Downloader */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max mb-1">步骤 1</span>
              <h3 className="text-xs font-bold text-slate-200">下载当前动态数据生成的 Excel 模板</h3>
              <p className="text-[10px] text-gray-400 mt-1">
                此按钮将以您<b>当前屏幕上显示的数据</b>为基础，自动生成一份包含“全省总览指标”和“各地市数据统计”两个工作表的规范 Excel 模板。
              </p>
            </div>
            <button
              id="download-excel-template"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-100 rounded text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-sm hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>下载数据模板 (Excel)</span>
            </button>
          </div>

          {/* Section 2: Drag & Drop Zone */}
          <div className="space-y-1.5 flex flex-col">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">步骤 2</span>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200">上传并解析您的 Excel 文件</h3>
              <span className="text-[10px] text-gray-500">支持拖拽或手动选择 .xlsx / .xls 格式</span>
            </div>

            <div
              id="excel-drag-drop-area"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative ${
                dragActive 
                  ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                  : fileName 
                    ? "border-cyan-500/50 bg-slate-900/30" 
                    : "border-slate-800 hover:border-slate-750 bg-slate-950/20 hover:bg-slate-950/35"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden" 
              />

              <div className="p-3 bg-[#080d1a] border border-slate-850 rounded-full mb-2">
                <Upload className={`w-6 h-6 ${fileName ? "text-cyan-400" : "text-gray-500"}`} />
              </div>

              {fileName ? (
                <div>
                  <p className="text-xs font-extrabold text-[#38bdf8] truncate max-w-[400px] mb-1">
                    {fileName}
                  </p>
                  <p className="text-[9.5px] text-gray-400">已就绪！如需更换请重新拖拽或点击此区域。</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-gray-300 mb-0.5">点击本区域或把 Excel 拖拽到这里</p>
                  <p className="text-[9.5px] text-gray-500 leading-none">请勿更改地市名称以及列的对应关系，仅编辑数值即可</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages & Feedback Alerts */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/20 border border-red-500/20 text-red-300 text-xs rounded-xl p-3 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-400">解析时出现错误：</strong>
                <span className="text-[10.5px] font-sans opacity-95">{errorMsg}</span>
              </div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-[#10b981] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-400">进行中 / 提示：</strong>
                <span className="text-[10.5px] font-sans opacity-95">{successMsg}</span>
              </div>
            </motion.div>
          )}

          {/* Section 3: Live Preview Table */}
          {parsedCities && (
            <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-900 pb-1.5 font-sans">
                <span>实时导入数据缩影 (地市预览前4个)</span>
                <span className="text-[9.5px] font-normal text-gray-500">
                  对比匹配详情
                </span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-500">
                      <th className="pb-1">地市</th>
                      <th className="pb-1 text-right">入驻机构 (家)</th>
                      <th className="pb-1 text-right">入驻医护 (人)</th>
                      <th className="pb-1 text-right">已激活数 (人)</th>
                      <th className="pb-1 text-right">近增好友 (人)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCities.slice(0, 4).map((c, idx) => (
                      <tr key={idx} className="border-b border-slate-900 last:border-b-0 text-slate-300">
                        <td className="py-1 py-1.5 font-bold text-slate-100">{c.name}</td>
                        <td className="py-1 text-right font-mono">{c.institutions}</td>
                        <td className="py-1 text-right font-mono text-cyan-300">{c.doctors}</td>
                        <td className="py-1 text-right font-mono text-emerald-400">{c.activeDoctors}</td>
                        <td className="py-1 text-right font-mono text-amber-500">+{c.recentAdded.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Drawer Actions */}
        <div className="bg-[#080d1a] border-t border-slate-800 p-4 flex items-center justify-between gap-3">
          
          {/* Recovery original static data */}
          <button
            id="reset-dashboard-data"
            onClick={triggerResetOriginal}
            className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/20 hover:text-red-300 border border-red-500/20 text-red-400 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>重置原始演示数据</span>
          </button>

          <div className="flex gap-2">
            <button
              id="cancel-excel-portal"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              id="confirm-excel-import"
              onClick={handleConfirmImport}
              disabled={!parsedProvince || !parsedCities}
              className={`px-4 py-1.5 rounded text-xs font-black flex items-center gap-1.5 transition-all ${
                parsedProvince && parsedCities 
                  ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] cursor-pointer" 
                  : "bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>确认覆盖更新</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
