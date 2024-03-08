// 此处是自定义的 Interaction 消息类型，约定 type > 10000，你可以根据你业务需要进行修改
export enum CustomMessageTypes {
  Comment = 10001, // 评论
  RemoveComment = 11111, // 删除群消息 新AliyunIM不以群消息的方式hack删除群消息
  ClassStart = 10003, // 上课
  ClassStop = 10004, // 下课
  ClassInfo = 10005, // 课堂信息
  NoticeUpdate = 10006, // 公告更新
  ClassReset = 10007, // 老师刷新课堂页面，重置连麦等状态
  MemberJoined = 11001, // 用户加入
  MemberLeft = 11002, // 用户离开
  MemberKicked = 11003, // 用户被移除
  CheckInStarted = 11004, // 开始签到

  MicChanged = 20007, // 麦克风状态变化
  CameraChanged = 20008, // 摄像头状态变化
  ToggleMic = 20009, // 打开/关闭学生麦克风（仅老师）
  ToggleMicAnswered = 20010, // 响应打开/关闭麦克风（仅学生）
  ToggleCamera = 20011, // 打开/关闭学生摄像头（仅老师）
  ToggleCameraAnswered = 20012, // 响应打开/关闭摄像头（仅学生）
  PublishInfoChanged = 21000, // 推流变化
  WhiteBoardVisible = 21001, // 白板可见
  SwitchScreen = 21002, // 主次画面切换

  InteractionInvitation = 30001, // 老师邀请某个同学上麦
  CancelInteractionInvitation = 30002, // 老师取消邀请某个同学上麦
  AcceptedInteractionInvitation = 30003, // 学生已接受老师上麦邀请
  RejectedInteractionInvitation = 30004, // 学生已拒绝老师上麦邀请
  InteractionApplication = 30010, // 学生提交上麦申请
  CancelInteractionApplication = 30011, // 学生取消上麦申请
  AcceptedInteractionApplication = 30012, // 老师已接受同学上麦申请
  RejectedInteractionApplication = 30013, // 老师已拒绝同学上麦申请
  InteractionApplicationSucceed = 30014, // 学生已上麦
  StudentEndInteraction = 30020, // 学生要下麦
  StudentEndInteractionAllowed = 30022, // 老师同意学生下麦
  TeacherEndInteraction = 30023, // 老师结束某个连麦
  TeacherEndAllInteraction = 30024, // 老师结束所有连麦
  InteractionMemberUpdated = 30032, // 连麦成员状态更新
  InteractionAllowed = 30040, // 允许连麦
  AllMicMuted = 30041, // 全员静音
  InteractionFull = 30042, // 连麦人数已满

  RequestMuteUser = 400001, // 为了兼容aliyunIMV1不支持非创建者单人/群组禁言，因此采用老师端做中心代理的方式触发禁言（因此比其他自定义类型多1位，作为特殊标记）。Demo 将逐步下线aliyunIMV1的功能，若您也不需要使用其功能，您应当弃用该IM自定义类型
  ResponseMuteUser = 400002, // 为了兼容aliyunIMV1不支持非创建者单人/群组禁言，因此采用老师端做中心代理的方式触发禁言（因此比其他自定义类型多1位，作为特殊标记）。Demo 将逐步下线aliyunIMV1的功能，若您也不需要使用其功能，您应当弃用该IM自定义类型
  RequestMuteGroup = 400003, // 为了兼容aliyunIMV1不支持非创建者单人/群组禁言，因此采用老师端做中心代理的方式触发禁言群组（因此比其他自定义类型多1位，作为特殊标记）。Demo 将逐步下线aliyunIMV1的功能，若您也不需要使用其功能，您应当弃用该IM自定义类型
  ResponseMuteGroup = 400004, // 为了兼容aliyunIMV1不支持非创建者单人/群组禁言，因此采用老师端做中心代理的方式触发禁言群组（因此比其他自定义类型多1位，作为特殊标记）。Demo 将逐步下线aliyunIMV1的功能，若您也不需要使用其功能，您应当弃用该IM自定义类型
  SyncAssistantJoinClass = 40001, // 助教同步已加入教室
  SyncAssistantPermissions = 40002, // 教室创建者（老师）同步最新的权限设置
  SyncDocsUpdated = 40003, // 管理员间同步课件有更新
  GroupMessageRemoved = 40004, // 群组消息被删除
}

// 扩散类型
export enum BroadcastTypeEnum {
  nobody = 0, // 不扩散
  somebody = 1, // 扩散到指定人
  all = 2, // 扩散到群组
}
