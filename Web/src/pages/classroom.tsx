import { useSearchParams, useNavigate } from 'umi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRoleEnum, MeetingInfo, IdentityForServer } from '@/types';
import services from '@/services';
import ClassRoom from '@/components/ClassRoom';
import { UA } from '@/utils/common';
import reporter from '@/utils/Reporter';
import { EMsgid } from '@/components/ClassRoom/utils/Logger';
import toast from '@/utils/toast';

const ClassRoomPage = () => {
  const navigate = useNavigate();
  const [classId, setClassId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const userInfo = useMemo(() => services.getUserInfo(), []);

  useEffect(() => {
    const idParam = searchParams.get('id');
    const roleParam = Number(searchParams.get('role')) || UserRoleEnum.Student;
    if (!idParam) {
      toast.error('参数异常，请检查！', 3, 3000);
      reporter.classroomParamsIllegal({
        id: idParam,
        role: roleParam,
      });
      return;
    }
    setClassId(idParam);
    reporter.updateCommonParams({
      classid: idParam,
      userid: userInfo.userId,
      username: userInfo.userName,
    });
    reporter.updateEventEnum(EMsgid);
  }, []);

  const onExit = () => {
    navigate('/');
  };

  const getRole = (userId: string, teacherId: string, assistantId: string) => {
    const isTeacher = teacherId === userId;
    const isAssistant = assistantId === userId;
    return isTeacher
      ? UserRoleEnum.Teacher
      : isAssistant
      ? UserRoleEnum.Assistant
      : UserRoleEnum.Student;
  };

  const fetchClassroomInfo = useCallback(async () => {
    const detail = await services.getRoomDetail(classId);

    const role = getRole(
      userInfo.userId,
      detail.teacherId,
      detail.assistantId ?? ''
    );
    reporter.updateCommonParams({
      role,
      classname: detail.title,
    });
    // 当前PC端仅支持老师、移动端仅支持学生，需要校验
    let msg = '';
    if (!UA.isPC && role === UserRoleEnum.Teacher) {
      msg = '当前移动端仅支持学生，老师请使用PC端';
    }
    if (!UA.isPC && role === UserRoleEnum.Assistant) {
      msg = '当前移动端仅支持学生，助教请使用PC端';
    }
    if (msg) {
      toast.error(msg, 0, 0);
      onExit();
      throw new Error(msg);
    }
    return detail;
  }, [classId, userInfo]);

  const fetchAssistantPermissions = useCallback(async () => {
    return services.getAssistantPermissions(classId);
  }, [classId]);

  const fetchIMToken = async (imServer: string[], role?: string) => {
    const res: any = await services.getToken(imServer, role);
    return res;
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
    const role = Number(searchParams.get('role')) ?? UserRoleEnum.Student;
    let identity: IdentityForServer | undefined;
    if (role === UserRoleEnum.Assistant) {
      identity = IdentityForServer.Assistant;
    }
    // 助教登录需要传入身份标识，可根据业务调整
    return services.joinClass(classId, identity);
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

  const setCheckIn = useCallback(
    (duration: number) => {
      return services.setCheckIn({
        class_id: classId,
        user_id: userInfo.userId,
        duration,
      });
    },
    [classId, userInfo]
  );

  if (!classId) {
    return;
  }

  return (
    <ClassRoom
      id={classId}
      userInfo={userInfo}
      whiteBoardHidden={searchParams.get('whiteBoardHidden') === 'true'}
      services={{
        fetchClassroomInfo,
        fetchAssistantPermissions,
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
        setCheckIn,
        getRunningCheckIn: services.getRunningCheckIn.bind(services),
        getAllCheckIns: services.getAllCheckIns.bind(services),
        checkIn: services.checkIn.bind(services),
        getCheckInRecords: services.getCheckInRecords.bind(services),
        getCheckInRecordByUserId:
          services.getCheckInRecordByUserId.bind(services),
      }}
      onExit={onExit}
      reporter={reporter}
    />
  );
};

export default ClassRoomPage;
