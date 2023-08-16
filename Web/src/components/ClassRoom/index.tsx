import React, {
  useEffect,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { message } from 'antd';
import { Toast } from 'antd-mobile';
import { useThrottleFn } from 'ahooks';
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
    setClassroomInfo,
    setJoinedGroupId,
    setMessageList,
    setGroupMuted,
    setSelfMuted,
    setCommentInput,
  } = useClassroomStore.getState();
  const { auiMessage } = useContext(ClassContext);
  const [initing, setIniting] = useState(false);

  const initMessageList = useCallback(
    (groupId: string) => {
      auiMessage
        .listMessage({
          groupId,
          type: CustomMessageTypes.Comment,
          sortType: 0,
          pageNum: 1,
          pageSize: 20,
        })
        .then(res => {
          let list: any[] = [];
          if (res.messageList) {
            list = res.messageList.map(item => {
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
                isSelf: senderId === userInfo.userId,
                isTeacher: senderId === classroomInfo.teacherId,
              };
            });
          }
          list = list.reverse();
          commentListCache.current = list;
          setMessageList(list);
        })
        .catch(err => {
          console.log('获取失败', err);
          logger.initMessageListError(err);
        });
    },
    [userInfo]
  );

  const initAUIMessage = async (groupId: string) => {
    const token = await services.fetchIMToken();
    auiMessage.setConfig({ token });
    await auiMessage.login({
      userId: userInfo.userId,
      userNick: userInfo.userName,
      userAvatar: userInfo.userAvatar || '',
    });
    await auiMessage.joinGroup(groupId);
    setJoinedGroupId(groupId);

    auiMessage.getMuteInfo(groupId).then(res => {
      setGroupMuted(res.groupMuted);
      setSelfMuted(res.selfMuted);
    });

    initMessageList(groupId);
  };

  const initClassroom = useCallback(() => {
    setIniting(true);
    services
      .fetchClassroomInfo()
      .then(res => {
        setClassroomInfo(res);
        return initAUIMessage(res.chatId);
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
        const content = '初始化课堂失败，请检查后重新进入！';
        UA.isPC
          ? message.error({
              content,
              duration: 0,
            })
          : Toast.show({
              content,
              icon: 'fail',
            });
      })
      .finally(() => {
        setIniting(false);
      });
  }, [services, setClassroomInfo]);

  const { run: throttleUpdateMessageList } = useThrottleFn(
    (list: CommentMessage[]) => {
      setMessageList(list);
    },
    {
      wait: 500,
    }
  );

  const showInfoMessage = (text: string) => {
    if (UA.isPC) {
      message.info(text);
    } else {
      Toast.show(text);
    }
  };

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
              isSelf: senderId === userInfo.userId,
              isTeacher: senderId === classroomInfo.teacherId,
            });
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
            showInfoMessage(data.micOpened ? '老师已取消静音' : '老师已静音');
          }
          break;
        default:
          break;
      }
    },
    [userInfo]
  );

  const listenEvents = () => {
    auiMessage.addListener(AUIMessageEvents.onJoinGroup, (data: any) => {
      console.log('有人加入房间', data);
    });
    auiMessage.addListener(AUIMessageEvents.onLeaveGroup, (data: any) => {
      console.log('有人离开房间', data);
    });
    auiMessage.addListener(
      AUIMessageEvents.onMessageReceived,
      handleReceivedMessage
    );
    auiMessage.addListener(AUIMessageEvents.onMuteGroup, () => {
      setGroupMuted(true);
      setCommentInput('');
      showInfoMessage('已开启全员禁言');
    });
    auiMessage.addListener(AUIMessageEvents.onUnmuteGroup, () => {
      setGroupMuted(false);
      showInfoMessage('已解除全员禁言');
    });
  };

  useEffect(() => {
    logger.setReport(report); // 更新日志上报的函数
  }, [report]);

  useEffect(() => {
    logger.enter(); // 上报进入课堂记录
    listenEvents();
    initClassroom();

    return () => {
      const { joinedGroupId, reset } = useClassroomStore.getState();
      auiMessage.removeAllEvent();
      if (joinedGroupId) {
        auiMessage.leaveGroup(joinedGroupId).finally(() => {
          auiMessage.logout();
        });
      } else {
        auiMessage.logout();
      }

      reset();
    };
  }, []);

  return (
    <ClassContext.Provider
      value={{
        auiMessage,
        services,
        userInfo,
        exit: onExit,
      }}
    >
      {UA.isPC ? <PCClassRoom initing={initing} /> : <MobileClassRoom />}
    </ClassContext.Provider>
  );
};

export default ClassRoom;
