import React, {
  useEffect,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useThrottleFn, useMemoizedFn } from 'ahooks';
import {
  IClassRoomProps,
  CustomMessageTypes,
  CommentMessage,
  UserRoleEnum,
  ClassroomStatusEnum,
  IClassroomInfo,
} from './types';
import { Permission } from '@/types';
import { TeacherPermissions, JoinClassErrorMsg } from './constants';
import useClassroomStore from './store';
import { ClassContext } from './ClassContext';
import { UA } from './utils/common';
import logger, { EMsgid } from './utils/Logger';
import PCClassRoom from './pc';
import MobileClassRoom from './mobile';
import {
  AUIMessageEvents,
  AUIMessageInsType,
  IDeleteMessagesData,
} from '@/BaseKits/AUIMessage/types';
import {
  TeacherInteractionManager,
  StudentInteractionManager,
} from './utils/InteractionManager';
import {
  TeacherCooperationManager,
  AssistantCooperationManager,
} from './utils/AdminCooperation';
import toast from '@/utils/toast';
import { getIMServer } from '@/utils/common';

const MaxMessageCount = 100;

const ClassRoom: React.FC<IClassRoomProps> = props => {
  const {
    services,
    userInfo,
    whiteBoardHidden, // 仅对非公开课模式的学生端生效
    onExit,
    reporter,
  } = props;

  const commentListCache = useRef<CommentMessage[]>([]); // 解决消息列表闭包问题
  const {
    isTeacher,
    classroomInfo: { assistantId, teacherId },
    setClassroomInfo,
    setRoleAssertion,
    setAccessibleFunctions,
    setAsstPermAccessibleFunctions,
    increaseMemberListFlag,
    setJoinedGroupId,
    setMessageList,
    setSelfMuted,
    setGroupMuted,
    setGroupMeta,
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
  const [role, setRole] = useState<UserRoleEnum>();
  const [interactionManager, setInteractionManager] = useState<
    TeacherInteractionManager | StudentInteractionManager
  >();
  const [cooperationManager, setCooperationManager] = useState<
    TeacherCooperationManager | AssistantCooperationManager
  >();

  const [initing, setIniting] = useState(false);
  const auiMessageInitStatus = useRef({
    loggedIn: false,
    initialized: false,
  });

  const initMessageList = useCallback(async () => {
    logger.reportInvoke(EMsgid.INIT_MESSAGE_LIST);

    try {
      auiMessage.removeMessageType = CustomMessageTypes.RemoveComment;
      const messageList = await auiMessage.getChatRoomMessages(
        CustomMessageTypes.Comment
      );
      let list: any[] = [];
      if (messageList) {
        list = messageList.map((item: any) => {
          const { messageId, senderId, userInfo: senderInfo, data } = item;
          const nickName = senderInfo?.userNick || senderId;
          const { classroomInfo } = useClassroomStore.getState();
          return {
            content: data.content ?? '',
            nickName,
            messageId,
            sid: data.sid ?? '',
            userId: senderId,
            isSelf: senderId === userInfo.userId,
            isTeacher: senderId === classroomInfo.teacherId,
            isAssistant: senderId === classroomInfo.assistantId,
          };
        });
      }
      list = list.reverse();
      commentListCache.current = list;
      setMessageList(list);
      logger.reportInvokeResult(EMsgid.INIT_MESSAGE_LIST_RESULT, true);
    } catch (err) {
      console.error(err);
      logger.reportInvokeResult(
        EMsgid.INIT_MESSAGE_LIST_RESULT,
        false,
        '',
        err
      );
    }
  }, [userInfo]);

  const initGroupMeta = async () => {
    const data = await auiMessage.getGroupMeta();
    if (data) setGroupMeta(JSON.parse(data));
  };

  // 初始化 IM 消息服务
  const initAUIMessage = useMemoizedFn(
    async (res: IClassroomInfo, isAdmin = false) => {
      const aliyunV2GroupId = CONFIG.imServer.aliyunIMV2.enable
        ? res.aliyunId
        : undefined;
      const aliyunV1GroupId = CONFIG.imServer.aliyunIMV1.enable
        ? res.aliyunId
        : undefined;
      const rongIMId = CONFIG.imServer.rongCloud.enable
        ? res.rongCloudId
        : undefined;

      try {
        logger.reportInvoke(EMsgid.INIT_IM, {
          aliyunV2GroupId,
          aliyunV1GroupId,
          rongIMId,
        });

        if (!aliyunV2GroupId && !rongIMId && !aliyunV1GroupId) {
          throw { code: -1, message: 'IM group id is empty' };
        }

        if (!aliyunV1GroupId || !rongIMId || !aliyunV2GroupId) {
          const destroyInstances = [];
          if (!aliyunV1GroupId) {
            destroyInstances.push(AUIMessageInsType.AliyunIMV1);
          }
          if (!rongIMId) {
            destroyInstances.push(AUIMessageInsType.RongIM);
          }
          if (!aliyunV2GroupId) {
            destroyInstances.push(AUIMessageInsType.AliyunIMV2);
          }
          auiMessage.destroyInstance(destroyInstances);
        }

        const tokenConfig = await services.fetchIMToken(
          getIMServer(),
          isAdmin ? 'admin' : undefined
        );
        auiMessage.setConfig(tokenConfig);
        await auiMessage.init();
        auiMessageInitStatus.current.initialized = true;

        try {
          logger.reportInvoke(EMsgid.AUI_MESSAGE_LOGIN, {});
          await auiMessage.login({
            userId: userInfo.userId,
            userNick: userInfo.userName,
            userAvatar: userInfo.userAvatar || '',
          });
          auiMessageInitStatus.current.loggedIn = true;
          logger.reportInvokeResult(EMsgid.AUI_MESSAGE_LOGIN_RESULT, true);
        } catch (error) {
          logger.reportInvokeResult(
            EMsgid.AUI_MESSAGE_LOGIN_RESULT,
            false,
            '',
            error
          );
          throw error;
        }

        try {
          logger.reportInvoke(EMsgid.AUI_MESSAGE_JOIN_GROUP);
          await auiMessage.joinGroup({
            aliyunV2GroupId,
            aliyunV1GroupId,
            rongIMId,
          });
          logger.reportInvokeResult(EMsgid.AUI_MESSAGE_JOIN_GROUP_RESULT, true);
        } catch (error) {
          logger.reportInvokeResult(
            EMsgid.AUI_MESSAGE_JOIN_GROUP_RESULT,
            false,
            '',
            error
          );
          throw error;
        }
        setJoinedGroupId(
          (aliyunV2GroupId || aliyunV1GroupId || rongIMId) as string
        );

        // 若是有融云，则需要设置 http 接口服务
        auiMessage.rongCloundIM?.setServices(services);

        auiMessage
          .queryMuteStatus()
          .then(res => {
            setGroupMuted(res.groupMuted);
            setSelfMuted(res.selfMuted ?? false);
          })
          .catch(() => {});
        await initMessageList();
        initGroupMeta();
        logger.reportInvokeResult(EMsgid.INIT_IM_RESULT, true);
      } catch (error) {
        logger.reportInvokeResult(EMsgid.INIT_IM_RESULT, false, '', error);
        throw error;
      }
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

  const initClassroom4teacher = useCallback(
    async (res: IClassroomInfo) => {
      setRole(UserRoleEnum.Teacher);
      // 老师初始化后广播重置状态课堂
      await resetInteractionInfo();
      auiMessage.sendGroupSignal({
        type: CustomMessageTypes.ClassReset,
      });
      setInteractionManager(
        new TeacherInteractionManager({
          message: auiMessage,
        })
      );
      setCooperationManager(
        new TeacherCooperationManager({
          message: auiMessage,
          defaultReceiverId: res.assistantId,
        })
      );
    },
    [resetInteractionInfo]
  );

  const initClassroom4assistant = useCallback(
    async (res: IClassroomInfo) => {
      setRole(UserRoleEnum.Assistant);
      getInteractionInfo();
      setCooperationManager(
        new AssistantCooperationManager({
          message: auiMessage,
          defaultReceiverId: res.teacherId,
        })
      );
    },
    [getInteractionInfo]
  );

  const initClassroom4student = useCallback(async () => {
    setRole(UserRoleEnum.Student);
    getInteractionInfo();
    setInteractionManager(
      new StudentInteractionManager({
        message: auiMessage,
      })
    );
  }, [getInteractionInfo]);

  const initClassroom = useCallback(async () => {
    logger.reportInvoke(EMsgid.INIT_CLASSROOM);

    try {
      const res = await services.fetchClassroomInfo();
      setClassroomInfo(res);

      const isTeacher = userInfo.userId === res.teacherId;
      const isAssistant = userInfo.userId === res.assistantId;
      const isStudent = !isTeacher && !isAssistant;

      await initAUIMessage(res, isTeacher || isAssistant);

      if (isTeacher) await initClassroom4teacher(res);
      if (isAssistant) await initClassroom4assistant(res);
      if (isStudent) await initClassroom4student();

      logger.reportInvokeResult(EMsgid.INIT_CLASSROOM_RESULT, true);
    } catch (err) {
      // 初始化失败
      toast.error('初始化课堂失败，请检查后重新进入！', 0, 0);
      console.error('初始化课堂失败', err);
      logger.reportInvokeResult(EMsgid.INIT_CLASSROOM_RESULT, false, '', err);
    }
  }, [
    services,
    auiMessage,
    initClassroom4teacher,
    initClassroom4assistant,
    initClassroom4student,
  ]);

  useEffect(() => {
    if (role === undefined) return;
    setRoleAssertion(role);
  }, [role]);

  // 初始化可用功能列表
  const initAccessibleFunctions = useCallback(
    async (role: UserRoleEnum) => {
      const permissions: Permission[] = [];
      try {
        if (role === UserRoleEnum.Teacher) {
          // 定义本身权限
          permissions.push(...TeacherPermissions);
          // 同步助教权限
          const assistantPermissions =
            (await services.fetchAssistantPermissions()) ?? [];
          (
            cooperationManager as TeacherCooperationManager
          )?.syncAsstPermissions(assistantPermissions);
          setAsstPermAccessibleFunctions(assistantPermissions);
        } else if (role === UserRoleEnum.Assistant) {
          try {
            const assistantPermissions =
              (await services.fetchAssistantPermissions()) ?? [];
            permissions.push(...assistantPermissions);
          } catch (error) {
            const msg = '助教权限获取异常，请刷新页面重试';
            toast.error(msg, 0, 0);
          }
        } else {
          permissions.push(...[Permission.JoinInteraction]);
        }
      } catch (error) {
        console.error('获取助教权限失败', error);
      } finally {
        setAccessibleFunctions(permissions);
      }
    },
    [services, cooperationManager]
  );

  useEffect(() => {
    if (cooperationManager && role) {
      initAccessibleFunctions(role);

      if (role === UserRoleEnum.Assistant) {
        // 助教进入课堂，通知其他成员（避免初开助教功能的教室没有助教信息，各角色端无法识别助教身份）
        auiMessage.sendGroupSignal({
          type: CustomMessageTypes.SyncAssistantJoinClass,
          data: { assistantId: userInfo.userId },
        });
      }
    }
  }, [auiMessage, role, cooperationManager, userInfo, initAccessibleFunctions]);

  const joinClass = useCallback(async () => {
    setIniting(true);
    try {
      logger.reportInvoke(EMsgid.JOIN_CLASSROOM);
      await services.joinClass();
      logger.reportInvokeResult(EMsgid.JOIN_CLASSROOM_RESULT, true);
      await initClassroom();
    } catch (error: any) {
      const msg =
        (typeof error?.message === 'string' &&
          JoinClassErrorMsg[error?.message as string]) ||
        '加入课堂失败，退出课堂页';

      toast.error(msg);
      logger.reportInvokeResult(EMsgid.JOIN_CLASSROOM_RESULT, false, '', msg);
      onExit();
    } finally {
      setIniting(false);
    }
  }, [services, onExit]);

  const uninitAUIMessage = async () => {
    const { initialized: auiMessageInitialized, loggedIn: auiMessageLoggedIn } =
      auiMessageInitStatus.current;
    logger.reportInvoke(EMsgid.UNINIT_IM, {
      auiMessageInitialized,
      auiMessageLoggedIn,
    });

    const { joinedGroupId } = useClassroomStore.getState();
    auiMessage.removeAllEvent();
    try {
      if (joinedGroupId) {
        logger.reportInvoke(EMsgid.AUI_MESSAGE_LEAVE_GROUP);
        await auiMessage.leaveGroup();
        logger.reportInvokeResult(EMsgid.AUI_MESSAGE_LEAVE_GROUP_RESULT, true);
      }

      if (auiMessageInitStatus.current.loggedIn) {
        logger.reportInvoke(EMsgid.AUI_MESSAGE_LOGOUT);
        await auiMessage.logout();
        logger.reportInvokeResult(EMsgid.AUI_MESSAGE_LOGOUT_RESULT, true);
      }

      if (auiMessageInitialized) {
        logger.reportInvoke(EMsgid.AUI_MESSAGE_UNINIT);
        await auiMessage.unInit();
        logger.reportInvokeResult(EMsgid.AUI_MESSAGE_UNINIT_RESULT, true);
      }
      logger.reportInvokeResult(EMsgid.UNINIT_IM_RESULT, true);
    } catch (error) {
      logger.reportInvokeResult(EMsgid.UNINIT_IM_RESULT, false, {
        joinedGroupId,
        auiMessageInitialized,
        auiMessageLoggedIn,
      });
      throw error;
    }
  };

  const leaveClass = useCallback(async () => {
    logger.reportInvoke(EMsgid.LEAVE_CLASSROOM);
    services.leaveClass();
    try {
      await uninitAUIMessage();
      logger.reportInvokeResult(EMsgid.LEAVE_CLASSROOM_RESULT, true);
    } catch (error) {
      console.log(error);
      logger.reportInvokeResult(
        EMsgid.LEAVE_CLASSROOM_RESULT,
        false,
        '',
        error
      );
    }

    const { reset } = useClassroomStore.getState();
    reset();
  }, [services]);

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

  const notifyGroupMessageRemoved = useCallback(
    (senderId: string, removedMsgCount = 1) => {
      if (senderId !== userInfo?.userId && removedMsgCount) {
        const admin =
          teacherId === senderId
            ? '老师'
            : assistantId === senderId
            ? '助教'
            : '管理员';
        toast.warning(`${admin}删除了${removedMsgCount}条消息`);
      }
    },
    [userInfo, teacherId, assistantId]
  );

  const removeMessageItems = useCallback(
    (data: IDeleteMessagesData, senderId: string) => {
      const { messageList } = useClassroomStore.getState();
      const { removeSids, notify } = data;
      const removedMessageSids = removeSids
        .split(';')
        .map((sid: string) => sid.trim())
        .filter(sid => !!sid);

      if (removedMessageSids.length) {
        const list = messageList.filter(
          ({ sid }) => !removedMessageSids.includes(sid)
        );
        commentListCache.current = list;
        throttleUpdateMessageList(list);

        if (notify) {
          notifyGroupMessageRemoved(senderId, removedMessageSids.length);
        }
      }
    },
    [userInfo, notifyGroupMessageRemoved]
  );

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
      increaseMemberListFlag();
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

  const handleAssistantJoinClass = useCallback(
    async (syncAssistantId: string) => {
      if (!syncAssistantId || !services) return;

      // 一旦助教加入教室，则设置为群组管理员
      if (syncAssistantId && isTeacher) {
        auiMessage.modifyGroup({
          admins: [syncAssistantId],
        });
      }

      // 如果老师进入教室时，助教还没有加入过，则需要重新拉取教师信息，设置协作者
      if (!assistantId) {
        const res = await services?.fetchClassroomInfo();
        if (res) {
          setClassroomInfo(res);
          if (isTeacher) {
            if (cooperationManager && res?.assistantId === syncAssistantId)
              cooperationManager.receiverId = res?.assistantId;
          }
        }
      }
    },
    [assistantId, isTeacher, cooperationManager, services]
  );

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
        /**
         * NOTE: 删除群消息的旧版方案，发送 RemoveComment 类型的群消息作为删除信令；
         * 新版则直接调用 deleteMessage 方法，监听 deletegroupmessage 事件，依赖启用 aliyunIMV2 并声明为 primary
         */
        case CustomMessageTypes.RemoveComment:
          // 接收到删除评论消息
          if (data?.removeSids) {
            removeMessageItems(data, senderId);
          }
          break;
        case CustomMessageTypes.Comment:
          // 接收到评论消息
          if (data && data.content) {
            addMessageItem({
              sid: data.sid,
              content: data.content,
              nickName,
              messageId,
              userId: senderId,
              isSelf: senderId === userInfo.userId,
              isTeacher: senderId === classroomInfo.teacherId,
              isAssistant: senderId === classroomInfo.assistantId,
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
        case CustomMessageTypes.SyncAssistantJoinClass:
          if (senderId !== userInfo?.userId) {
            handleAssistantJoinClass(data.assistantId);
          }
          break;
        case CustomMessageTypes.GroupMessageRemoved:
          notifyGroupMessageRemoved(senderId, data?.count);
          break;
        default:
          break;
      }
    },
    [
      userInfo,
      handleClassReset,
      handleAssistantJoinClass,
      removeMessageItems,
      notifyGroupMessageRemoved,
    ]
  );

  useEffect(() => {
    auiMessage.addListener(
      AUIMessageEvents.onMessageReceived,
      handleReceivedMessage
    );
    return () => {
      auiMessage.removeListener(
        AUIMessageEvents.onMessageReceived,
        handleReceivedMessage
      );
    };
  }, [auiMessage, handleReceivedMessage]);

  const handleGroupInfoChange = (data: any) => {
    const { groupMeta: newGroupMeta } = data?.data?.info ?? {};
    const meta = newGroupMeta ? JSON.parse(newGroupMeta) : {};
    const { modifyUserId, content: newContent } = meta.announcement ?? {};
    const {
      groupMeta: { announcement: preAnnouncement },
    } = useClassroomStore.getState();

    if (
      modifyUserId !== userInfo?.userId &&
      preAnnouncement?.content !== newContent
    ) {
      toast('有新公告了');
    }

    setGroupMeta(meta);
  };

  const removeGroupMessage = useCallback(
    (removeMessageId: string) => {
      const list = (commentListCache.current = commentListCache.current.filter(
        item => item.messageId && item.messageId !== removeMessageId
      ));
      throttleUpdateMessageList(list);
    },
    [throttleUpdateMessageList]
  );

  const listenAuiMessageEvents = useCallback(() => {
    auiMessage.addListener(AUIMessageEvents.onJoinGroup, (data: any) => {
      console.log('有人加入房间', data); // IM 消息组的加入
      increaseMemberListFlag();
    });
    auiMessage.addListener(AUIMessageEvents.onLeaveGroup, (data: any) => {
      console.log('有人离开房间', data); // IM 消息组的离开
      const { senderId: userId } = data;
      updateConnectedSpectator(userId);
      updateApplyingList(userId);
      increaseMemberListFlag();
    });
    auiMessage.addListener(AUIMessageEvents.onMuteGroup, () => {
      setGroupMuted(true);
      setCommentInput('');
      toast('已开启全员禁言');
    });
    auiMessage.addListener(AUIMessageEvents.onUnmuteGroup, () => {
      setGroupMuted(false);
      toast('已解除全员禁言');
    });
    auiMessage.addListener(AUIMessageEvents.onMuteUser, (data: any) => {
      if (
        data?.data?.userId === userInfo?.userId || // rongCloud/im1
        data?.data?.status?.muteUserList?.includes(userInfo?.userId) // im2
      ) {
        setSelfMuted(true);
        setCommentInput('');
        toast('您已被禁言');
      }
    });
    auiMessage.addListener(AUIMessageEvents.onUnmuteUser, (data: any) => {
      if (
        data?.data?.userId === userInfo?.userId || // rongCloud/im1
        (data.data?.status?.muteUserList && // im2
          !data.data?.status?.muteUserList?.includes(userInfo?.userId))
      ) {
        setSelfMuted(false);
        toast('您已被解除禁言');
      }
    });
    auiMessage.addListener(AUIMessageEvents.onGroupInfoChange, (data: any) => {
      handleGroupInfoChange(data);
    });
    auiMessage.addListener(
      AUIMessageEvents.onGroupMessageDeleted,
      (data: any) => {
        const { messageId } = data?.data;
        removeGroupMessage(messageId);
      }
    );
  }, [auiMessage, removeGroupMessage]);

  useEffect(() => {
    listenAuiMessageEvents();
    return () => {
      auiMessage.removeAllEvent();
    };
  }, [auiMessage, listenAuiMessageEvents]);

  useEffect(() => {
    joinClass();
    window.addEventListener('beforeunload', leaveClass);
    return () => {
      window.removeEventListener('beforeunload', leaveClass);
      leaveClass();
    };
  }, []);

  useEffect(() => {
    logger.setReporter(reporter); // 更新日志上报模块
  }, [reporter]);

  return (
    <ClassContext.Provider
      value={{
        auiMessage,
        services,
        userInfo,
        whiteBoardHidden,
        interactionManager,
        cooperationManager,
        exit: onExit,
      }}
    >
      {UA.isPC ? <PCClassRoom initing={initing} /> : <MobileClassRoom />}
    </ClassContext.Provider>
  );
};

export default ClassRoom;
