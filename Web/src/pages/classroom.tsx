import { useSearchParams, useNavigate } from 'umi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRoleEnum, MeetingInfo } from '@/types';
import services from '@/services';
import ClassRoom from '@/components/ClassRoom';
import { UA } from '@/utils/common';
import reporter from '@/utils/Reporter';
import toast from '@/utils/toast';

const ClassRoomPage = () => {
  const navigate = useNavigate();
  const [classId, setClassId] = useState<string>('');
  const [role, setRole] = useState<number>();
  const [searchParams, setSearchParams] = useSearchParams();
  const userInfo = useMemo(() => {
    return {
      ...services.getUserInfo(),
      role,
    };
  }, [role]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    const roleParam = Number(searchParams.get('role')) || UserRoleEnum.Student;
    console.log(idParam, roleParam);
    if (!idParam) {
      toast.error('参数异常，请检查！', 3, 3000);
      reporter.classroomParamsIllegal({
        id: idParam,
        role: roleParam,
      });
      return;
    }
    setClassId(idParam);
    setRole(roleParam);
    reporter.updateCommonParams({
      classid: idParam,
      userid: userInfo.userId,
      username: userInfo.userName,
    });
  }, []);

  const onExit = () => {
    navigate('/');
  };

  const reportLog = (msgid: number, args?: any) => {
    reporter.report({ msgid, args });
  };

  const fetchClassroomInfo = useCallback(async () => {
    const detail = await services.getRoomDetail(classId);
    const isTeacher = detail.teacherId === userInfo.userId;
    if (isTeacher) {
      setRole(UserRoleEnum.Teacher);
    }
    reporter.updateCommonParams({
      biz: isTeacher ? UserRoleEnum.Teacher : UserRoleEnum.Student,
      classname: detail.title,
    });
    // 当前PC端仅支持老师、移动端仅支持学生，需要校验
    let msg = '';
    if (!UA.isPC && isTeacher) {
      msg = '当前移动端仅支持学生，老师请使用PC端';
    }
    if (msg) {
      // TOOD: 考虑身份异常跳回登录页
      showMessage(msg, 0);
      throw new Error(msg);
    }
    return detail;
  }, [classId, userInfo]);

  const fetchIMToken = async (imServer: string[]) => {
    const res: any = await services.getToken(imServer);
    return {
      aliyunAccessToken:
        res.aliyun_access_token || res.aliyunAccessToken || res.access_token,
      rongCloudToken: res.rongCloudToken || res.rong_cloud_token,
      rongCloudAppKey: CONFIG.imServer.rongCloud.appKey,
    };
  };

  const getWhiteboardAuthInfo = useCallback(() => {
    return services.getWhiteboardAuthInfo();
  }, []);

  const queryDoc = useCallback(() => {
    return services.queryDoc(classId).then((res: any) => {
      if (res && res.docInfos) {
        return res.docInfos;
      }
      return [];
    });
  }, [classId]);

  const addDocs = useCallback(
    (docInfo: any[]) => {
      return services.addDocs({
        docInfo,
        classId,
      });
    },
    [classId]
  );

  const deleteDocs = useCallback(
    (docIds: string) => {
      return services.deleteDocs({
        docIds,
        classId,
      });
    },
    [classId]
  );

  const startClass = useCallback(() => {
    return services.startClass(classId);
  }, [classId]);

  const stopClass = useCallback(() => {
    return services.stopClass(classId);
  }, [classId]);

  const updateMeetingInfo = useCallback(
    (payload: Partial<MeetingInfo>) => {
      return services.updateMeetingInfo(classId, payload);
    },
    [classId]
  );

  const getMeetingInfo = useCallback(() => {
    return services.getMeetingInfo(classId);
  }, [classId]);

  const joinClass = useCallback(() => {
    return services.joinClass(classId);
  }, [classId]);

  const leaveClass = useCallback(() => {
    return services.leaveClass(classId);
  }, [classId]);

  const kickClass = useCallback(
    (userId: string) => {
      return services.kickClass(classId, userId);
    },
    [classId]
  );

  if (!classId) {
    return;
  }

  return (
    <ClassRoom
      id={classId}
      role={role}
      userInfo={userInfo}
      services={{
        fetchClassroomInfo,
        fetchIMToken,
        queryDoc,
        getWhiteboardAuthInfo,
        addDocs,
        deleteDocs,
        startClass,
        stopClass,
        getMeetingInfo,
        updateMeetingInfo,
        isMuteChatroom: services.isMuteChatroom.bind(services),
        muteChatroom: services.muteChatroom.bind(services),
        cancelMuteChatroom: services.cancelMuteChatroom.bind(services),
        muteUser: services.muteUser.bind(services),
        cancelMuteUser: services.cancelMuteUser.bind(services),
        joinClass,
        leaveClass,
        kickClass,
        listMembers: services.listMembers.bind(services),
      }}
      onExit={onExit}
      report={reportLog}
    />
  );
};

export default ClassRoomPage;
