/**
 * 基于网易白板实现白板组件
 */
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import toast from '@/utils/toast';
import classNames from 'classnames';
import Mousetrap from 'mousetrap';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import { PCMainWrapContext } from '../PCMainWrap';
import whiteBoardFactory from '../../utils/whiteboard';
import logger, { EMsgid } from '../../utils/Logger';
import { StreamWidth, NeteaseSDKVersion } from '../../constants';
import { createRandomNumberUid } from '../../utils/common';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
  canControl?: boolean;
  canTurnPage?: boolean;
  canUpdateCourceware?: boolean;
  setAsBroadcaster?: boolean;
}

const NeteaseBoard: React.FC<IProps> = props => {
  const {
    wrapClassName,
    canControl = false,
    canTurnPage = false,
    canUpdateCourceware = false,
    setAsBroadcaster = false,
  } = props;
  const { rendererStyle } = useContext(PCMainWrapContext);
  const { services, userInfo, cooperationManager } = useContext(ClassContext);
  const wbIns = useMemo(() => {
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const [wbInited, setWbInited] = useState(false);
  const wbDocsCache = useRef<any[]>([]);
  const {
    classroomInfo: { boards },
    docsUpdateFlag,
  } = useClassroomStore(state => state);
  // 目前是否是白板使用中，即没有在屏幕分享和本地插播多媒体
  const boardActive = useClassroomStore(state => {
    return state.localMedia.sources.length === 0 && !state.display.enable;
  });

  const boardUserInfo = useMemo(() => {
    /**
     * 网易白板要求 uid 是纯数字，但在开源的互动课堂里，userId 是字符串，不能使用
     * 因 AppServer 层目前创建白板时使用的是当前 10 位的时间戳作为 uid，且每个人返回都是同一个 uid
     * 若所有用户都用同一个 uid 加入白板，则会造成先加入的用户被踢出白板房间
     * 而且 AppServer 不愿为每个用户生成独立的数字 uid，因此只好前端随机生成
     * 实际接入时请根据您的用户系统修改对应的逻辑。
     */
    const prefix = canControl ? 1 : 2;
    const uid = createRandomNumberUid(prefix);
    if (userInfo) {
      return {
        uid: typeof userInfo.userId === 'number' ? userInfo.userId : uid,
        nickName: userInfo.userName,
      };
    }
    return {
      uid,
      nickName: `${uid}`,
    };
  }, [canControl, userInfo]);

  const wbInfo = useMemo(() => {
    try {
      return JSON.parse(boards);
    } catch (error) {
      return null;
    }
  }, [boards]);

  // 全局监听键盘事件
  useEffect(() => {
    const handleNext = () => {
      wbIns?.nextPageOrAnim();
    };
    const handlePrev = () => {
      wbIns?.prevPageOrAnim();
    };

    if (canControl && boardActive) {
      Mousetrap.bind(['left', 'up', 'pageup'], handlePrev, 'keyup');
      Mousetrap.bind(['right', 'down', 'pagedown'], handleNext, 'keyup');
    }

    return () => {
      Mousetrap.unbind(['left', 'up', 'pageup'], 'keyup');
      Mousetrap.unbind(['right', 'down', 'pagedown'], 'keyup');
    };
  }, [canControl, boardActive]);

  const compareAndUpdateDocs = (remoteDocList: any[]) => {
    const remoteDocIds = remoteDocList.map(({ docId }) => docId);
    const prevDocIds = wbDocsCache.current.map(({ docId }) => docId);
    const allDocIds = Array.from(new Set([...prevDocIds, ...remoteDocIds]));
    // 被删除的文档Id
    const deletedDocIds: string[] = [];
    // 新增的的文档Id
    const newDocIds: string[] = [];

    allDocIds.forEach(docId => {
      const isDeleted = !remoteDocIds.includes(docId);
      const isNew = !prevDocIds.includes(docId);
      if (isDeleted) {
        wbIns?.toolCollection?.deleteDoc(docId);
        deletedDocIds.push(docId);
      }
      if (isNew) {
        const newDoc = remoteDocList.find(
          ({ docId: _docId }) => _docId === docId
        );
        if (newDoc) {
          wbIns?.toolCollection?.addDoc(newDoc);
          newDocIds.push(docId);
        }
      }
    });

    // update wbDocsCache
    let prevList = [...wbDocsCache.current];
    prevList = prevList.filter(({ docId }) => !deletedDocIds.includes(docId));

    const currentList = [...prevList];
    newDocIds.forEach(docId =>
      // 在数组前插入新增文档
      currentList.splice(0, 0, remoteDocList[remoteDocIds.indexOf(docId)])
    );
    wbDocsCache.current = currentList;

    // 如果非远端同步更新导致的queryDoc（第一次queryDoc），则设置白板文档列表
    if (docsUpdateFlag === 0) {
      wbIns?.toolCollection?.setDefaultDocList(currentList);
    }
  };

  const queryDoc = async () => {
    if (!services) {
      return;
    }

    try {
      const res: any[] = await services.queryDoc();
      // 服务端维护的文档列表
      const remoteDocList: any[] = [];
      res.forEach(item => {
        try {
          const info = JSON.parse(item.docInfos);
          info.showDelete = true;
          remoteDocList.push(info);
        } catch (error) {
          console.error(error);
        }
      });
      compareAndUpdateDocs(remoteDocList);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (docsUpdateFlag > 0) queryDoc();
  }, [docsUpdateFlag]);

  const handleDocAdd = async (newDocs: any[], allDocs: any[]) => {
    console.log('add allDocs->', allDocs);
    const arr: any[] = [];
    newDocs.forEach(item => {
      const target = wbDocsCache.current.find(el => el.docId === item.docId);
      if (target) {
        return;
      }
      item.sdkVersion = NeteaseSDKVersion;
      arr.push({
        docId: item.docId,
        serverType: 0, // 0 代表网易云信的白板
        data: JSON.stringify(item),
      });
    });
    if (arr.length) {
      try {
        await services?.addDocs(arr);
        cooperationManager?.syncDocsUpdated();
      } catch (err) {
        console.log('增加文档失败', err);
      }
    }
    wbDocsCache.current = allDocs;
  };

  const handleDocDelete = async (docList: any[], allDocs: any[]) => {
    console.log('delete allDocs->', allDocs);
    const arr = docList.map(item => item.docId);
    if (arr.length) {
      try {
        await services?.deleteDocs(arr.join(','));
        cooperationManager?.syncDocsUpdated();
      } catch (err) {
        console.log('删除文档失败！', err);
      }
    }
    wbDocsCache.current = allDocs;
  };

  const checkMediaStream = () => {
    const stream = wbIns?.getStream({
      width: StreamWidth,
      frameRate: 25,
    });
    const track = stream?.getVideoTracks()[0];
    if (track) {
      if ('contentHint' in track) {
        track.contentHint = 'detail'; // 提高清晰度
      }
      track.onended = () => {
        // 异常中断需要重新获取
        checkMediaStream();
      };
      const { setBoard } = useClassroomStore.getState();
      setBoard({ server: 'netease', mediaStream: stream });
    } else {
      toast.error('获取白板流失败，将无法上课推流！');
    }
  };

  useEffect(() => {
    if (!wbInfo || !wbInfo.appKey || !wbIns) {
      return;
    }

    const initInfo = { ...wbInfo, ...boardUserInfo };
    logger.reportInvoke(EMsgid.INIT_WHITE_BOARD, initInfo);
    wbIns
      .init({
        ...initInfo,
        getAuthInfo: services?.getWhiteboardAuthInfo,
        container: document.getElementById('whiteboard'),
      })
      .then(() => {
        const joinInfo = { channel: wbInfo.boardId };
        logger.reportInvoke(EMsgid.JOIN_WHITE_BOARD_ROOM, joinInfo);
        const container = document.getElementById('whiteboardWrap');
        if (!container) return; // 可能存在挂载后迅速被销毁，因此不抛出错误
        wbIns
          .joinRoom({
            // 服务端创建网易白板房间时，channelName 使用的是课堂id，boardId 也是课堂 id
            // 前端加入的 channel 对应的是创建接口的 channelName，若不是，那么加入的就不是同一个房间
            ...joinInfo,
            toolContainer: container as HTMLElement,
            ondisconnected: err => {
              console.error('白板断联!', err);
            },
            onconnected: () => {
              console.log('白板连接成功');
            },
          })
          .then(() => {
            // 成功加入房间后需要从获取白板的画面流
            checkMediaStream();
            logger.reportInvokeResult(
              EMsgid.JOIN_WHITE_BOARD_ROOM_RESULT,
              true,
              joinInfo
            );
            setWbInited(true);
          })
          .catch(err => {
            console.log('白板joinRoom失败', err);
            logger.reportInvokeResult(
              EMsgid.JOIN_WHITE_BOARD_ROOM_RESULT,
              false,
              joinInfo,
              err
            );
            throw err;
          });
      })
      .catch(err => {
        console.log('白板初始化失败', err);
        toast.error('白板初始化失败！');
        logger.reportInvokeResult(
          EMsgid.INIT_WHITE_BOARD_RESULT,
          false,
          initInfo,
          err
        );
      });
    return () => {
      whiteBoardFactory.destroyInstance('netease');
      setWbInited(false);
    };
  }, [wbInfo, boardUserInfo]);

  useEffect(() => {
    if (wbInited && wbIns) {
      wbIns.togglePageTurner(canTurnPage);
      wbIns.toggleUploadCenter(canUpdateCourceware);
    }
  }, [wbInited, wbIns, canUpdateCourceware, canTurnPage]);

  useEffect(() => {
    if (wbInited && wbIns) {
      // 无白板控制权，则移除所有工具栏
      wbIns.toggleToolCollection(canControl);
      if (!canControl) {
        // 设置为视角跟随者
        wbIns.drawPlugin?.setSelfAsFollower();
        return;
      }
      wbIns.setSelfAsBroadcaster(setAsBroadcaster);
      queryDoc();
    }
  }, [wbInited, wbIns, canControl, setAsBroadcaster]);

  useEffect(() => {
    if (wbInited && wbIns && canControl) {
      wbIns.toolCollection?.on('docAdd', handleDocAdd);
      wbIns.toolCollection?.on('docDelete', handleDocDelete);

      return () => {
        wbIns.toolCollection?.off('docAdd', handleDocAdd);
        wbIns.toolCollection?.off('docDelete', handleDocDelete);
      };
    }
  }, [wbInited, wbIns, canControl, handleDocDelete]);

  return (
    <div
      className={classNames(wrapClassName, styles['netease-board'])}
      id="whiteboardWrap"
    >
      <div
        id="whiteboard"
        style={
          rendererStyle || {
            width: '100%',
            height: '100%',
          }
        }
      ></div>
    </div>
  );
};

export default NeteaseBoard;
