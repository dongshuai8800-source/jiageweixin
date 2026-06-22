export interface CityData {
  id: string;
  name: string;
  pinyin: string;
  institutions: number;     // 入驻机构数
  doctors: number;          // 入驻医护人员数
  activeDoctors: number;    // 已激活医护人员数
  activeRate: number;       // 激活比率 (%)
  residentsAdded: number;   // 添加居民总数 (好友数)
  recentAdded: number;      // 最近增加的好友数 (对应198,200的总数分布)
  singleChats: number;      // 单聊总数
  singleMessages: number;   // 单聊发送消息数
  singleReplyRate: number;  // 已回复单聊占比 (%)
  avgFirstReplyTime: string;// 平均首次回复时长 (例如 "28分49秒")
  avgFirstReplySeconds: number; // 用于计算或展示的秒数
  groupChats: number;       // 群聊总数
  activeGroupChats: number; // 有过消息的群聊数
  groupMembers: number;     // 群成员总数
  activeGroupMembers: number; // 发送消息的群成员数
  groupMessages: number;    // 群聊消息总数
  
  // 地图绘制相关属性
  svgPath: string;          // SVG 路径，使每一市能在地图上完美呈现
  labelX: number;           // 标签显示的 X 坐标
  labelY: number;           // 标签显示的 Y 坐标
}

export interface ProvinceData {
  name: string;
  updateTime: string;
  institutions: number;
  doctors: number;
  activeDoctors: number;
  activeRate: number;
  recentAdded: number;     // 添加好友数 (+198,200)
  
  // 单聊互动
  singleReplyRate: number;
  avgFirstReplyTime: string;
  singleChats: number;
  singleMessages: number;

  // 群聊互动
  groupChats: number;
  activeGroupChats: number;
  activeGroupChatsRate: number;
  groupMembers: number;
  activeGroupMembers: number;
  activeGroupMembersRate: number;
  groupMessages: number;
}
