// 此处是自定义的 Interaction 消息类型，约定 type > 10000，你可以根据你业务需要进行修改
export enum CustomMessageTypes {
  Comment = 10001, // 评论
  ClassStart = 10003, // 上课
  ClassStop = 10004, // 下课
  ClassInfo = 10005, // 课堂信息
  NoticeUpdate = 10006, // 公告更新
  ApplyRTC = 20001, // 申请连麦（学生发送、老师接收）
  RespondRTC = 20002, // 同意/拒绝 连麦申请（老师发送，学生接收）
  RTCStart = 20003, // 上麦通知
  RTCStop = 20004, // 下麦通知
  RTCKick = 20005, // 踢下麦（老师发送，学生接收）
  CancelApplyRTC = 20006, // 取消申请连麦（仅学生）
  MicChanged = 20007, // 麦克风状态变化
  CameraChanged = 20008, // 摄像头状态变化
  ToggleSpectatorMic = 20009, // 打开/关闭学生麦克风（仅老师）
  ToggleSpectatorCamera = 20010, // 打开/关闭学生摄像头（仅老师）
  PublishInfoChanged = 21000, // 推流变化
}

// 扩散类型
export enum BroadcastTypeEnum {
  nobody = 0, // 不扩散
  somebody = 1, // 扩散到指定人
  all = 2, // 扩散到群组
}
