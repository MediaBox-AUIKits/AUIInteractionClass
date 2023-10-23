import React, {
  useEffect,
  useCallback,
  useContext,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useThrottleFn, useMemoizedFn } from 'ahooks';
import {
  IClassRoomProps,
  CustomMessageTypes,
  CommentMessage,
  UserRoleEnum,
  ClassroomStatusEnum,
} from './types';
import useClassroomStore from './store';
import { ClassContext } from './ClassContext';
import { UA } from './utils/common';
import logger from './utils/Logger';
import PCClassRoom from './pc';
import MobileClassRoom from './mobile';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage';
import {
  TeacherInteractionManager,
  StudentInteractionManager,
} from './utils/InteractionManager';
import toast from '@/utils/toast';

const MaxMessageCount = 100;

const ClassRoom: React.FC<IClassRoomProps> = props => {
  const {
    services,
    userInfo,
    role = UserRoleEnum.Student,
    onExit,
    report,
  } = props;

  const commentListCache = useRef<CommentMessage[]>([]); // 解决消息列表闭包问题
  const {
    joinedGroupId,
    setClassroomInfo,
    increaseMemberListFlag,
    setJoinedGroupId,
    setMessageList,
    setGroupMuted,
    setCommentInput,
    setConnectedSpectators,
    setInteractionAllowed,
    setControlledCameraOpened,
    setControlledMicOpened,
    setAllMicMuted,
    updateConnectedSpectator,
    updateApplyingList,
  } = useClassroomStore.getState();
  const { auiMessage } = useContext(ClassContext);
  const isStudent = useMemo(
    () => userInfo.role === UserRoleEnum.Student,
    [userInfo]
  );
  const interactionManager = useMemo(() => {
    if (auiMessage && userInfo) {
      return isStudent
        ? new StudentInteractionManager({
            message: auiMessage,
            groupId: joinedGroupId,
          })
        : new TeacherInteractionManager({
            message: auiMessage,
            groupId: joinedGroupId,
          });
    }
  }, [role, userInfo, auiMessage]);
  const [initing, setIniting] = useState(false);

  const initMessageList = useCallback(() => {
    auiMessage
      .listMessage(CustomMessageTypes.Comment)
      .then((res: any) => {
        let list: any[] = [];
        if (res.messageList) {
          list = res.messageList.map((item: any) => {
            const { messageId, senderId, userInfo: senderInfo } = item;
            const nickName = senderInfo?.userNick || senderId;
            let data: any = {};
            try {
              data = JSON.parse(item.data || '{}');
            } catch (error) {
              console.log(error);
            }
            const { classroomInfo } = useClassroomStore.getState();
            return {
              content: data.content || '',
              nickName,
              messageId,
              userId: senderId,
              isSelf: senderId === userInfo.userId,
              isTeacher: senderId === classroomInfo.teacherId,
            };
          });
        }
        list = list.reverse();
        commentListCache.current = list;
        setMessageList(list);
      })
      .catch((err: any) => {
        console.log('获取失败', err);
        logger.initMessageListError(err);
      });
  }, [userInfo]);

  const initAUIMessage = useMemoizedFn(
    async (aliyunGroupId?: string, rongIMId?: string) => {
      if (!aliyunGroupId && !rongIMId) {
        throw { code: -1, message: 'IM group id is empty' };
      }
      const imServer: string[] = [];
      if (aliyunGroupId) {
        imServer.push('aliyun');
      }
      if (rongIMId) {
        imServer.push('rongCloud');
      }
      const { aliyunAccessToken, rongCloudToken } = await services.fetchIMToken(
        imServer
      );
      auiMessage.setConfig({ aliyunAccessToken, rongCloudToken });
      await auiMessage.login({
        userId: userInfo.userId,
        userNick: userInfo.userName,
        userAvatar: userInfo.userAvatar || '',
      });
      await auiMessage.joinGroup(aliyunGroupId, rongIMId);
      setJoinedGroupId((aliyunGroupId || rongIMId) as string);

      // 若是有融云，则需要设置 http 接口服务
      auiMessage.rongCloundIM?.setServices(services);

      auiMessage
        .queryMuteGroup()
        .then(res => {
          setGroupMuted(res.groupMuted);
          // 老师初始化后广播重置状态
          if (role === UserRoleEnum.Teacher) {
            auiMessage.sendMessageToGroup({
              type: CustomMessageTypes.ClassReset,
              skipAudit: true,
              skipMuteCheck: true,
            });
          }
        })
        .catch(() => {});

      initMessageList();
    }
  );

  // 获取当前连麦、推流用户信息
  const getInteractionInfo = useCallback(async () => {
    const data = await services.getMeetingInfo();
    const { members = [], allMute = false, interactionAllowed = true } = data;

    setConnectedSpectators(members);
    setAllMicMuted(allMute);
    setInteractionAllowed(interactionAllowed);

    const interactionInfo = members.find(
      ({ userId }) => userInfo?.userId === userId
    );
    setControlledCameraOpened(interactionInfo?.controlledCameraOpened ?? true);
    setControlledMicOpened(
      !allMute && (interactionInfo?.controlledMicOpened ?? true)
    );
  }, [userInfo, services]);

  // 进入课堂，重置连麦状态
  const resetInteractionInfo = useCallback(async () => {
    await services.updateMeetingInfo({
      members: [],
      allMute: false,
      interactionAllowed: true,
    });
  }, [services]);

  const initClassroom = useCallback(() => {
    services
      .fetchClassroomInfo()
      .then(async res => {
        setClassroomInfo(res);

        if (isStudent) {
          await getInteractionInfo();
        } else {
          await resetInteractionInfo();
        }

        // 初始化 IM 消息服务
        return initAUIMessage(res.aliyunId || res.chatId, res.rongCloudId);
      })
      .catch(err => {
        // 初始化失败
        if (err instanceof AggregateError) {
          const msg = err.errors
            .map((error: any) => error.message || error)
            .join(';');
          logger.initError(msg);
          console.log('初始化失败-》', msg);
        } else {
          logger.initError(err);
          console.log('初始化失败-》', err);
        }
        toast.error('初始化课堂失败，请检查后重新进入！', 0);
      })
      .finally(() => {
        setIniting(false);
      });
  }, [isStudent, services, setClassroomInfo, getInteractionInfo]);

  const joinClass = useCallback(async () => {
    setIniting(true);
    try {
      await services.joinClass();
      initClassroom();
    } catch (error: any) {
      let msg = '加入课堂失败，退出课堂页';
      if (error && error.message === 'InBlackList') {
        msg = '您被移除教室，无法加入';
      }
      toast.error(msg);
      onExit();
    }
  }, [services, onExit]);

  const { run: throttleUpdateMessageList } = useThrottleFn(
    (list: CommentMessage[]) => {
      setMessageList(list);
    },
    {
      wait: 500,
    }
  );

  const addMessageItem = (messageItem: CommentMessage) => {
    const list: CommentMessage[] = [...commentListCache.current, messageItem];
    // 别超过最大消息个数
    if (list.length > MaxMessageCount) {
      list.shift();
    }
    commentListCache.current = list;
    throttleUpdateMessageList(list);
  };

  const updateClassStatus = useCallback((status: ClassroomStatusEnum) => {
    const { classroomInfo, setClassroomInfo } = useClassroomStore.getState();
    const info = {
      ...classroomInfo,
      status,
    };
    setClassroomInfo(info);
  }, []);

  const handleKicked = (kickedUserId: string) => {
    if (userInfo.userId !== kickedUserId) {
      return;
    }
    toast.warning('您已被移除教室，3 秒后自动退出');
    setTimeout(() => {
      onExit();
    }, 3000);
  };

  const handleClassReset = useCallback(async () => {
    const data = await services?.getMeetingInfo();
    if (data) {
      const { members = [], allMute = false, interactionAllowed = true } = data;
      setConnectedSpectators(members);
      setAllMicMuted(allMute);
      setInteractionAllowed(interactionAllowed);
    }
  }, [services]);

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const {
        type,
        data,
        messageId,
        senderId,
        senderInfo = {},
      } = eventData || {};
      const nickName = senderInfo.userNick || senderId;
      const classroomInfo = useClassroomStore.getState().classroomInfo;

      switch (type) {
        case CustomMessageTypes.Comment:
          // 接收到评论消息
          if (data && data.content) {
            addMessageItem({
              content: data.content,
              nickName,
              messageId,
              userId: senderId,
              isSelf: senderId === userInfo.userId,
              isTeacher: senderId === classroomInfo.teacherId,
            });
          }
          break;
        case CustomMessageTypes.MemberJoined:
          // 进入课堂
          increaseMemberListFlag();
          break;
        case CustomMessageTypes.MemberLeft:
          // 离开课堂
          increaseMemberListFlag();
          break;
        case CustomMessageTypes.MemberKicked:
          // 被移除课堂
          if (data) {
            handleKicked(data.user_id || data.userId);
          }
          break;
        case CustomMessageTypes.ClassStart:
          // 上课
          updateClassStatus(ClassroomStatusEnum.started);
          break;
        case CustomMessageTypes.ClassStop:
          // 下课
          updateClassStatus(ClassroomStatusEnum.ended);
          break;
        case CustomMessageTypes.MicChanged:
          // 用户麦克风状态变化，目前仅学生需要展示老师麦克风状态
          if (
            senderId === classroomInfo.teacherId &&
            senderId !== userInfo.userId
          ) {
            toast(data.micOpened ? '老师已取消静音' : '老师已静音');
          }
          break;
        case CustomMessageTypes.PublishInfoChanged:
          console.log('PublishInfoChanged ->', data);
          if (
            senderId === classroomInfo.teacherId &&
            senderId !== userInfo.userId
          ) {
            const { sid, ...publishInfo } = data;
            // 更新老师的推流信息，后续做连麦时需要调整
            updateConnectedSpectator(senderId, publishInfo);
          }
          break;
        case CustomMessageTypes.InteractionMemberUpdated:
          if (
            senderId === classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            setConnectedSpectators(data.data);
          }
          break;
        case CustomMessageTypes.ClassReset:
          if (
            senderId === classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleClassReset();
          }
          break;
        default:
          break;
      }
    },
    [userInfo, handleClassReset]
  );

  const listenEvents = () => {
    auiMessage.addListener(AUIMessageEvents.onJoinGroup, (data: any) => {
      console.log('有人加入房间', data); // IM 消息组的加入
    });
    auiMessage.addListener(AUIMessageEvents.onLeaveGroup, (data: any) => {
      console.log('有人离开房间', data); // IM 消息组的离开
      const { senderId: userId } = data;
      updateConnectedSpectator(userId);
      updateApplyingList(userId);
    });
    auiMessage.addListener(
      AUIMessageEvents.onMessageReceived,
      handleReceivedMessage
    );
    auiMessage.addListener(AUIMessageEvents.onMuteGroup, () => {
      setGroupMuted(true);
      setCommentInput('');
      toast('已开启全员禁言');
    });
    auiMessage.addListener(AUIMessageEvents.onUnmuteGroup, () => {
      setGroupMuted(false);
      toast('已解除全员禁言');
    });
  };

  useEffect(() => {
    logger.setReport(report); // 更新日志上报的函数
  }, [report]);

  const leaveClass = useCallback(() => {
    const { joinedGroupId, reset } = useClassroomStore.getState();
    auiMessage.removeAllEvent();
    if (joinedGroupId) {
      auiMessage.leaveGroup().finally(() => {
        auiMessage.logout();
      });
    } else {
      auiMessage.logout();
    }

    services.leaveClass();

    reset();
  }, [services]);

  useEffect(() => {
    logger.enter(); // 上报进入课堂记录
    listenEvents();
    joinClass();

    window.addEventListener('beforeunload', leaveClass);

    return () => {
      window.removeEventListener('beforeunload', leaveClass);
      leaveClass();
    };
  }, []);

  return (
    <ClassContext.Provider
      value={{
        auiMessage,
        services,
        userInfo,
        interactionManager,
        exit: onExit,
      }}
    >
      {UA.isPC ? <PCClassRoom initing={initing} /> : <MobileClassRoom />}
    </ClassContext.Provider>
  );
};

export default ClassRoom;
