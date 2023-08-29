import React, { Fragment, useState, useMemo } from 'react';
import classNames from 'classnames';
import { useThrottleFn } from 'ahooks';
import { Modal, Upload, Button, Popover } from 'antd';
import useClassroomStore from '../../../store';
import {
  MediaSvg,
  MediaDisableSvg,
  PlaySvg,
  InfoSvg,
  MediaFileSvg,
} from '../../../components/icons';
import EmptyBlock from '../../../components/EmptyBlock';
import commonStyles from '../index.less';
import styles from './index.less';

interface RcFile extends File {
  uid: string;
}

const MultiMedia: React.FC = () => {
  const { setLocalMeidaSources } = useClassroomStore.getState();
  const { enable: displayEnable } = useClassroomStore(state => state.display);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [tipOpen, setTipOpen] = useState(false);
  // 判断是否可以使用本地媒体流
  const allowUsing = useMemo(() => {
    const video: any = document.createElement('video');
    return !!video.captureStream;
  }, []);

  const openMediaModal = () => {
    if (displayEnable) {
      return;
    }
    setModalOpened(true);
  };

  const closeMediaModal = () => {
    setModalOpened(false);
  };

  const { run: updateFileList } = useThrottleFn(
    list => {
      const arr = fileList.slice().concat(list);
      setFileList(arr);
    },
    { wait: 100, leading: false }
  );

  const deleteFile = (uid: string) => {
    const list = fileList.slice().filter(file => file.uid !== uid);
    setFileList(list);
  };

  const playSingle = (file: RcFile) => {
    closeMediaModal();
    const source = URL.createObjectURL(file);
    setLocalMeidaSources([{ source, name: file.name }]);
  };

  const playAll = () => {
    closeMediaModal();
    const list = fileList.map(file => {
      return {
        name: file.name,
        source: URL.createObjectURL(file),
      };
    });
    setLocalMeidaSources(list);
  };

  const uploaderProps = useMemo(
    () => ({
      name: 'media',
      multiple: true,
      showUploadList: false,
      accept: 'video/mp4',
      beforeUpload: (info: RcFile, fileList: RcFile[]) => {
        updateFileList(fileList);
        return false;
      },
    }),
    []
  );

  const renderEmty = () => (
    <div className={styles['local-meida-modal__content']}>
      <EmptyBlock
        center
        text={allowUsing ? '暂无内容' : '当前环境无法使用该功能'}
      />
    </div>
  );

  const renderFileList = () => {
    return (
      <div className={styles['local-meida-modal__content']}>
        <ul className={styles['local-meida-modal__list']}>
          {fileList.map((file: any) => (
            <li key={file.uid} className={styles['local-meida-modal__file']}>
              <MediaFileSvg
                className={styles['local-meida-modal__file__icon']}
              />
              <span className={styles['local-meida-modal__file__name']}>
                {file.name}
              </span>
              <span className={styles['local-meida-modal__file__actions']}>
                <Button type="primary" onClick={() => playSingle(file)}>
                  播放
                </Button>
                <Button onClick={() => deleteFile(file.uid)}>删除</Button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Fragment>
      <Modal
        open={modalOpened}
        title="媒体库"
        className={styles['local-meida-modal']}
        width={720}
        centered
        keyboard={false}
        maskClosable={false}
        footer={null}
        onCancel={closeMediaModal}
      >
        {fileList && fileList.length ? renderFileList() : renderEmty()}

        <footer className={styles['local-meida-modal__footer']}>
          <Popover
            content={
              <ul className={styles['local-meida-modal__footer__popover']}>
                <li>1、当前支持的视频格式: mp4</li>
              </ul>
            }
            placement="topLeft"
          >
            <span className={styles['local-meida-modal__footer__tip']}>
              <InfoSvg /> 文件说明
            </span>
          </Popover>
          <span className={styles['local-meida-modal__footer__actions']}>
            <Upload {...uploaderProps}>
              <Button type="primary" disabled={!allowUsing}>
                打开
              </Button>
            </Upload>

            {fileList.length ? (
              <Button
                className={styles['local-meida-modal__footer__playall']}
                icon={<PlaySvg />}
                onClick={playAll}
              >
                播放全部
              </Button>
            ) : null}
          </span>
        </footer>
      </Modal>

      <Popover
        content="结束屏幕共享后可使用"
        open={tipOpen}
        onOpenChange={bool => {
          setTipOpen(displayEnable ? bool : false);
        }}
      >
        <div className={commonStyles['button-wrapper']}>
          <div
            className={classNames(commonStyles.button, {
              [commonStyles.disabled]: displayEnable,
            })}
            onClick={openMediaModal}
          >
            {displayEnable ? <MediaDisableSvg /> : <MediaSvg />}
            <div className={commonStyles['button-text']}>多媒体</div>
          </div>
        </div>
      </Popover>
    </Fragment>
  );
};

export default MultiMedia;
