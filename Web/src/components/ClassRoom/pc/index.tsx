import React, { useEffect } from 'react';
import { Spin } from 'antd';
import WhiteBoard from './WhiteBoard';
import RoomHeader from './Header';
import RoomAside from './Aside';
import RoomBottom from './Bottom';
import './styles.less';

interface IProps {
  initing: boolean;
}

const PCClassRoom: React.FC<IProps> = props => {
  const { initing } = props;

  // 尝试使用 AudioContext 解决页面 hidden 后降频问题
  useEffect(() => {
    let context: AudioContext;
    let source: AudioBufferSourceNode;
    if (AudioContext) {
      context = new AudioContext();
      source = context.createBufferSource();
      source.connect(context.destination);
      source.start();
    }

    return () => {
      if (source) {
        source.disconnect();
        source.stop();
      }
    };
  }, []);

  return (
    <Spin spinning={initing} wrapperClassName="amaui-classroom">
      <RoomHeader />
      <div className="amaui-classroom__body">
        <WhiteBoard
          serverType="netease"
          wrapClassName="amaui-classroom__main"
        />
        <RoomAside className="amaui-classroom__aside" />
      </div>
      <RoomBottom />
    </Spin>
  );
};

export default PCClassRoom;
