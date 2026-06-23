import { motion } from "motion/react";
import { Cloud, MessageCircle, Sparkles } from "lucide-react";

const WORDS = [
  { text: "血压", weight: 98 },
  { text: "用药", weight: 92 },
  { text: "随访", weight: 88 },
  { text: "复诊", weight: 82 },
  { text: "签约", weight: 78 },
  { text: "转诊", weight: 73 },
  { text: "血糖", weight: 70 },
  { text: "体检报告", weight: 66 },
  { text: "慢病管理", weight: 64 },
  { text: "家庭病床", weight: 58 },
  { text: "疫苗", weight: 52 },
  { text: "康复", weight: 48 },
  { text: "上门服务", weight: 44 },
  { text: "健康咨询", weight: 42 },
  { text: "预约", weight: 40 },
  { text: "报告解读", weight: 36 }
];

const CONVERSATIONS = [
  { text: "医生，我爸这两天血压还是有点高，降压药需要调整吗？", city: "杭州市", district: "西湖区", community: "翠苑街道社区卫生服务中心", doctor: "王医生" },
  { text: "今天空腹血糖 7.8，早餐后能不能继续原来的药？", city: "嘉兴市", district: "桐乡市", community: "梧桐街道社区卫生服务中心", doctor: "沈医生" },
  { text: "体检报告出来了，甘油三酯偏高，麻烦帮我看看。", city: "宁波市", district: "江北区", community: "孔浦街道社区卫生服务中心", doctor: "周医生" },
  { text: "我想预约下周的慢病复诊，需要带哪些资料？", city: "绍兴市", district: "嵊州市", community: "剡湖街道社区卫生服务中心", doctor: "陈医生" },
  { text: "孩子疫苗提醒收到了，周六上午可以过去吗？", city: "丽水市", district: "莲都区", community: "白云街道社区卫生服务中心", doctor: "叶医生" },
  { text: "老人行动不方便，能不能申请上门随访？", city: "杭州市", district: "上城区", community: "小营街道社区卫生服务中心", doctor: "刘医生" },
  { text: "上次开的药快吃完了，可以线上续方还是需要来现场？", city: "杭州市", district: "拱墅区", community: "祥符街道社区卫生服务中心", doctor: "赵医生" },
  { text: "最近咳嗽反复，慢阻肺随访时间能提前吗？", city: "丽水市", district: "莲都区", community: "岩泉街道社区卫生服务中心", doctor: "吴医生" }
];

const wordStyle = (weight: number, index: number) => {
  const size = 12 + Math.round((weight / 100) * 18);
  const colors = ["text-cyan-200", "text-emerald-300", "text-sky-300", "text-teal-200", "text-amber-200"];
  return `${colors[index % colors.length]} font-black`;
};

export default function ConversationInsights() {
  const rollingItems = [...CONVERSATIONS, ...CONVERSATIONS];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch" id="conversation-insights-panel">
      <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0b1329]/80 p-3.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(6,182,212,0.05)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"><Cloud className="w-3.5 h-3.5" /></span>
            <div>
              <h3 className="text-xs font-bold tracking-wider text-white uppercase">居民咨询词云</h3>
              <p className="text-[9.5px] text-slate-500">从近期医患会话中提取高频主题</p>
            </div>
          </div>
          <span className="text-[9px] text-cyan-300 font-mono">WORD CLOUD</span>
        </div>
        <div className="min-h-[170px] rounded-lg border border-cyan-500/10 bg-slate-950/35 p-4 flex flex-wrap content-center justify-center gap-x-5 gap-y-3">
          {WORDS.map((word, index) => (
            <motion.span
              key={word.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className={`${wordStyle(word.weight, index)} leading-none drop-shadow-[0_0_10px_rgba(34,211,238,0.18)]`}
              style={{ fontSize: `${12 + Math.round((word.weight / 100) * 20)}px` }}
            >
              {word.text}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0b1329]/80 p-3.5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_0_15px_rgba(16,185,129,0.05)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"><MessageCircle className="w-3.5 h-3.5" /></span>
            <div>
              <h3 className="text-xs font-bold tracking-wider text-white uppercase">最新对话</h3>
              <p className="text-[9.5px] text-slate-500">滚动展示居民最近咨询内容与服务医生来源</p>
            </div>
          </div>
          <span className="text-[9px] text-emerald-300 font-mono flex items-center gap-1"><Sparkles className="w-3 h-3" />LIVE</span>
        </div>
        <div className="relative h-[190px] overflow-hidden rounded-lg border border-emerald-500/10 bg-slate-950/35">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-950 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950 to-transparent z-10" />
          <motion.div
            className="space-y-2 p-3"
            animate={{ y: [0, -CONVERSATIONS.length * 68] }}
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          >
            {rollingItems.map((item, index) => (
              <div key={`${item.text}-${index}`} className="rounded-lg border border-slate-800/80 bg-slate-900/45 px-3 py-2">
                <p className="text-[11px] text-slate-100 leading-relaxed">“{item.text}”</p>
                <p className="mt-1 text-[9.5px] text-emerald-300/90 font-mono truncate">
                  {item.city}-{item.district}-{item.community}-{item.doctor}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
