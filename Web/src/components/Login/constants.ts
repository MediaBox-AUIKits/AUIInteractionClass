import { Permission, UserRoleEnum, ClassroomModeEnum } from '@/types';
import { AssistantPermissionGroup } from './types/login';
import {
  AudioWaveSvg,
  InteractionSvg,
  MediaSharePermSvg,
  MuteGroupSvg,
  NextSvg,
  NotifySvg,
  RemoveSvg,
  ShareScreenPermSvg,
  UserSvg,
  WhiteboardSvg,
} from '../ClassRoom/components/icons';

export const RoleOptions = [
  {
    value: UserRoleEnum.Teacher,
    label: '教师',
  },
  {
    value: UserRoleEnum.Assistant,
    label: '助教',
  },
  {
    value: UserRoleEnum.Student,
    label: '学生',
  },
];

export const ModeOptions = [
  {
    value: ClassroomModeEnum.Open,
    label: '公开课',
  },
  {
    value: ClassroomModeEnum.Big,
    label: '大班课',
  },
];

// 默认选中的助教权限（注释掉的权限后续将支持）
export const DefaultAssistantPermissions = [
  Permission.Courceware,
  Permission.RemoveGroupMessage,
  Permission.MuteGroup,
];

export const AssistantPermissionList: AssistantPermissionGroup[] = [
  {
    title: '课程管理',
    options: [
      // {
      //   label: '上课&下课',
      //   icon: NotifySvg,
      //   key: Permission.SwitchClassStatus,
      // },
      {
        label: '成员管理',
        icon: UserSvg,
        key: Permission.MemberManagement,
      },
    ],
  },
  {
    title: '辅助教学',
    options: [
      // {
      //   label: '白板绘制',
      //   icon: WhiteboardSvg,
      //   key: Permission.DrawWhiteboard,
      // },
      {
        label: '可见&白板翻页',
        icon: NextSvg,
        key: Permission.Courceware,
      },
    ],
  },
  {
    title: '互动消息',
    options: [
      {
        label: '删除消息',
        icon: RemoveSvg,
        key: Permission.RemoveGroupMessage,
      },
      {
        label: '全员禁言',
        icon: MuteGroupSvg,
        key: Permission.MuteGroup,
      },
      // {
      //   label: '连麦管理',
      //   icon: InteractionSvg,
      //   key: Permission.InteractionManagement,
      // },
    ],
  },
  // {
  //   title: '参与教学',
  //   options: [
  //     {
  //       label: '共享屏幕',
  //       icon: ShareScreenPermSvg,
  //       key: Permission.ScreenShare,
  //     },
  //     {
  //       label: '分享视频',
  //       icon: MediaSharePermSvg,
  //       key: Permission.LocalMediaShare,
  //     },
  //     {
  //       label: '音视频连麦',
  //       icon: AudioWaveSvg,
  //       key: Permission.JoinInteraction,
  //     },
  //   ],
  // },
];
