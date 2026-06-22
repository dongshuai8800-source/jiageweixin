export interface CityData {
  id: string;
  name: string;
  pinyin: string;
  institutions: number | null;     // 入驻机构数
  doctors: number | null;          // 入驻医护人员数
  activeDoctors: number | null;    // 已激活医护人员数
  activeRate: number | null;       // 激活比率 (%)
  residentsAdded: number | null;   // 添加居民总数 (好友数)
  recentAdded: number | null;      // 最近增加的好友数
  singleChats: number | null;      // 单聊总数
  singleMessages: number | null;   // 单聊发送消息数
  singleReplyRate: number | null;  // 已回复单聊占比 (%)
  avgFirstReplyTime: string | null;// 平均首次回复时长 (例如 "28分49秒")
  avgFirstReplySeconds: number | null; // 用于计算的秒数
  groupChats: number | null;       // 群聊总数
  activeGroupChats: number | null; // 有过消息的群聊数
  groupMembers: number | null;     // 群成员总数
  activeGroupMembers: number | null; // 发送消息的群成员数
  groupMessages: number | null;    // 群聊消息总数
  
  // 地图绘制相关属性
  svgPath: string;          // SVG 路径
  labelX: number;           // 标签显示的 X 坐标
  labelY: number;           // 标签显示的 Y 坐标
}

export interface ProvinceData {
  name: string;
  updateTime: string;
  institutions: number | null;
  doctors: number | null;
  activeDoctors: number | null;
  activeRate: number | null;
  recentAdded: number | null;     // 添加好友数
  
  // 单聊互动
  singleReplyRate: number | null;
  avgFirstReplyTime: string | null;
  singleChats: number | null;
  singleMessages: number | null;

  // 群聊互动
  groupChats: number | null;
  activeGroupChats: number | null;
  activeGroupChatsRate: number | null;
  groupMembers: number | null;
  activeGroupMembers: number | null;
  activeGroupMembersRate: number | null;
  groupMessages: number | null;
}
