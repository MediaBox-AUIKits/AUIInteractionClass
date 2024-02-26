import { ClassroomStatusEnum, ClassroomFunction } from './types';
import { Permission } from '@/types';

export const StreamWidth = 1920;
export const StreamHeight = 1080;

export const SubStreamWidth = 480;
export const SubStreamHeight = 270;

export const CameraFps = window.AlivcLivePush?.AlivcFpsEnum?.FPS_30;
export const CameraResolution =
  window.AlivcLivePush?.AlivcResolutionEnum?.RESOLUTION_540P;
export const CameraWidth =
  window.AlivcLivePush?.AlivcResolution?.GetResolutionWidth(CameraResolution);
export const CameraHeight =
  window.AlivcLivePush?.AlivcResolution?.GetResolutionHeight(CameraResolution);

export const ShadowCameraFps = window.AlivcLivePush?.AlivcFpsEnum?.FPS_10;
export const ShadowCameraResolution =
  window.AlivcLivePush?.AlivcResolutionEnum?.RESOLUTION_180P;

export const PreviewPlayerId = 'selfPlayer';

// 网易白板sdk的版本号
export const NeteaseSDKVersion = '3.9.10';

// 连麦用户最大数量
export const MaxConnectedSpectatorNum = 9;

export enum LiveTranscodingSourceType {
  /*! 相机流 */
  LiveTranscodingCamera = 0,
  /*! 屏幕流 */
  LiveTranscodingShareScreen = 1,
}

export const ClassStatusTips = {
  [ClassroomStatusEnum.no_data]: '课堂初始化中...',
  [ClassroomStatusEnum.not_start]: '课程尚未开始，请耐心等候',
  [ClassroomStatusEnum.ended]: '课程已结束',
  [ClassroomStatusEnum.started]: '课程进行中',
};

// 权限与功能的映射
export const FunctionMapByPermission: Record<Permission, ClassroomFunction[]> =
  {
    [Permission.SwitchClassStatus]: [ClassroomFunction.SwitchClassStatus],
    [Permission.MemberManagement]: [ClassroomFunction.KickMember],
    [Permission.EditAnnouncement]: [ClassroomFunction.EditAnnouncement],
    [Permission.AttendanceManagement]: [ClassroomFunction.AttendanceManagement],
    [Permission.DrawWhiteboard]: [ClassroomFunction.DrawWhiteboard],
    [Permission.Courceware]: [
      ClassroomFunction.UpdateCourceware,
      ClassroomFunction.WhiteboardPageTurner,
    ],
    [Permission.RemoveGroupMessage]: [ClassroomFunction.RemoveGroupMessage],
    [Permission.MuteGroup]: [ClassroomFunction.MuteGroup],
    [Permission.MuteUser]: [ClassroomFunction.MuteUser],
    [Permission.InteractionManagement]: [
      ClassroomFunction.InteractionManagement,
      ClassroomFunction.MuteInteraction,
      ClassroomFunction.AllowInteraction,
    ],
    [Permission.ScreenShare]: [ClassroomFunction.ScreenShare],
    [Permission.LocalMediaShare]: [ClassroomFunction.LocalMediaShare],
    [Permission.JoinInteraction]: [
      ClassroomFunction.Camera,
      ClassroomFunction.Mic,
      ClassroomFunction.JoinInteraction,
    ],
  };

export const HasNoPermission = '缺乏权限，请联系管理员开通';
export const TeacherPermissions = [
  Permission.InteractionManagement,
  Permission.SwitchClassStatus,
  Permission.MemberManagement,
  Permission.AttendanceManagement,
  Permission.Courceware,
  Permission.EditAnnouncement,
  Permission.RemoveGroupMessage,
  Permission.MuteGroup,
  Permission.MuteUser,
  Permission.ScreenShare,
  Permission.LocalMediaShare,
  Permission.JoinInteraction,
];

export const JoinClassErrorMsg: Record<string, string> = {
  InBlackList: '您被移除教室，无法加入',
  ClassHasAssistant: '您不是当前教室的助教，请确认教室号',
  ClassNotAssistantPermit: '当前教室没有开启助教功能，请确认教室号',
};
