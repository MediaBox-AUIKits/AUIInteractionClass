import services from '@/services';
import {
  UserRoleEnum,
  ClassroomModeEnum,
  IClassroomInfo,
  ClassroomStatusEnum,
} from '@/types';
import reporter from '@/utils/Reporter';

interface IHandleEnterClassroomProps {
  role?: number;
  mode?: number;
  id?: string;
  userName: string;
}

export const handleEnterClassroom = async (
  props: IHandleEnterClassroomProps
) => {
  const { role, mode, id, userName } = props;

  // 先登录，userId 与 userName 为相同值，此为体验逻辑，实际开发请修改
  await services.login(userName, userName);
  reporter.updateCommonParams({
    userid: userName,
    username: userName,
  });

  let detail: IClassroomInfo;
  if (id) {
    // 若 id 有值，调用 get 接口
    detail = await services.getRoomDetail(id);
    if (detail.status === ClassroomStatusEnum.ended) {
      throw new Error('该课程已结束');
    }
    // 若是老师，是否判断是该课堂的创建者，不能以教师身份进入非自己创建的课堂
    if (role === UserRoleEnum.Teacher && detail.teacherId !== userName) {
      throw new Error('该课堂非您创建，不能以老师身份进入');
    }
  } else {
    // 若无 id，调用 create 接口创建新的课堂
    // 不允许学生创建
    if (role !== UserRoleEnum.Teacher) {
      throw new Error('非老师身份不能创建课堂');
    }
    // 目前未支持输入课堂名称，所以使用当前时间生成默认名称
    const now = new Date();
    const title = `课堂${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    const im_server: string[] = [];
    if (CONFIG.imServer.aliyun.enable) {
      im_server.push('aliyun');
    }
    if (CONFIG.imServer.rongCloud.enable && CONFIG.imServer.rongCloud.appKey) {
      im_server.push('rongCloud');
    }
    detail = await services.createRoom({
      teacher_id: userName,
      teacher_nick: userName,
      extends: '{}',
      mode: mode || ClassroomModeEnum.Open,
      title,
      im_server,
    });
  }

  return detail;
};
