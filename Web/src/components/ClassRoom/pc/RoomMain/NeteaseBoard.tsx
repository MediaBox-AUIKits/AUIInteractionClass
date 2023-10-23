/**
 * 基于网易白板实现白板组件
 */
import React, {
  useEffect,
  useMemo,
  useRef,
  useContext,
  CSSProperties,
} from 'react';
import toast from '@/utils/toast';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import whiteBoardFactory from '../../utils/whiteboard';
import logger from '../../utils/Logger';
import { StreamWidth, NeteaseSDKVersion } from '../../constances';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
  rendererStyle?: CSSProperties;
}

const NeteaseBoard: React.FC<IProps> = props => {
  const { wrapClassName, rendererStyle } = props;
  const { services } = useContext(ClassContext);
  const wbIns = useMemo(() => {
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const wbDocsCache = useRef<any[]>([]);
  const { boards } = useClassroomStore(state => state.classroomInfo);

  const wbInfo = useMemo(() => {
    try {
      return JSON.parse(boards);
    } catch (error) {
      return null;
    }
  }, [boards]);

  const queryDoc = () => {
    if (!services) {
      return;
    }

    services.queryDoc().then((list: any[]) => {
      const arr: any[] = [];
      list.forEach(item => {
        try {
          const info = JSON.parse(item.docInfos);
          info.showDelete = true;
          arr.push(info);
        } catch (error) {
          //
        }
      });
      wbDocsCache.current = arr;
      wbIns?.setDefaultDocList(arr);
    });
  };

  const handleDocAdd = (newDocs: any[], allDocs: any[]) => {
    // console.log('add allDocs->', allDocs);
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
      services?.addDocs(arr).catch(err => {
        console.log('增加文档失败', err);
      });
    }
    wbDocsCache.current = allDocs;
  };

  const handleDocDelete = (docList: any[], allDocs: any[]) => {
    // console.log('delete allDocs->', allDocs);
    const arr = docList.map(item => item.docId);
    if (arr.length) {
      services?.deleteDocs(arr.join(',')).catch(err => {
        console.log('删除文档失败！', err);
      });
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
    logger.initWhiteBoard();
    wbIns
      .init({
        ...wbInfo,
        nickname: 'teacher', // 目前只有老师，后续有别的用户时，需要传入对应的用户名
        getAuthInfo: services?.getWhiteboardAuthInfo,
        container: document.getElementById('whiteboard'),
      })
      .then(() => {
        wbIns
          .joinRoom({
            // 服务端创建网易白板房间时，channelName 使用的是课堂id，boardId 也是课堂 id
            // 前端加入的 channel 对应的是创建接口的 channelName，若不是，那么加入的就不是同一个房间
            channel: wbInfo.boardId,
            toolContainer: document.getElementById(
              'whiteboardWrap'
            ) as HTMLElement,
            ondisconnected: err => {
              console.error('白板断联!', err);
            },
            onconnected: () => {
              console.log('白板连接成功');
            },
          })
          .then(() => {
            queryDoc();
            // wbIns.on(
            //   'event:appState:change',
            //   (stateName: string, value1: any, value2?: any) => {
            //     console.log(stateName, value1, value2);
            //   }
            // );
            wbIns.toolCollection?.on('docAdd', handleDocAdd);
            wbIns.toolCollection?.on('docDelete', handleDocDelete);

            // 成功加入房间后需要从获取白板的画面流
            checkMediaStream();
          })
          .catch(err => {
            console.log('白板joinRoom失败', err);
            toast.error('白板初始化失败！');
            logger.joinWhiteBoardRoomError(err);
          });
      })
      .catch(err => {
        console.log('白板初始化失败', err);
        toast.error('白板初始化失败！');
        logger.initWhiteBoardError(err);
      });
    return () => {
      whiteBoardFactory.destroyInstance('netease');
    };
  }, [wbInfo]);

  return (
    <div
      className={classNames(wrapClassName, styles['netease-board'])}
      id="whiteboardWrap"
    >
      <div id="whiteboard" style={rendererStyle}></div>
    </div>
  );
};

export default NeteaseBoard;
