import React, { useState } from 'react';
import { Toast, Input, Button } from 'antd-mobile';
import styles from './styles.less';
import { handleEnterClassroom } from '../utils';
import { LoginProps } from '@/types';
import reporter, { EMsgid } from '@/utils/Reporter';

const MobileLogin = (props: LoginProps) => {
  const { onLoginSuccess } = props;
  const [logging, setLogging] = useState<boolean>(false);

  const [roomId, setRoomId] = useState<string>('');
  const [roomIdFocus, setRoomIdFocus] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [nickFocus, setNickFocus] = useState<boolean>(false);

  const inputConfig = [
    {
      inputChangeFn: setRoomId,
      setFocusFn: setRoomIdFocus,
      label: '教室ID',
      id: 'amaui-web-classroom-roomId',
      state: [roomId, roomIdFocus],
    },
    {
      inputChangeFn: setNickname,
      setFocusFn: setNickFocus,
      label: '昵称',
      id: 'amaui-web-classroom-nickname',
      state: [nickname, nickFocus],
    },
  ];

  const inputTipClassNames = (state: any[]) => {
    const classNames: string[] = [styles['input-tip']];
    if (state[0] || state[1]) {
      classNames.push('focus');
    }
    return classNames.join(' ');
  };

  const loginClickHandler = () => {
    const userName = nickname.trim();
    if (logging) {
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(userName)) {
      Toast.show({
        content: '请输入正确的昵称',
        duration: 3000,
      });
      return;
    }
    setLogging(true);

    const params = { id: roomId, userName };
    reporter.reportInvoke(EMsgid.ENTER_CLASSROOM, params);
    handleEnterClassroom(params)
      .then(detail => {
        // 目前移动端仅支持学生，若输入的用户是该课堂的老师，提示错误
        if (detail.teacherId === userName) {
          throw new Error('您是该课堂的老师，请在电脑端登录进入');
        }
        if (detail.assistantId === userName) {
          throw new Error('您是该课堂的助教，请在电脑端登录进入');
        }
        reporter.updateCommonParams({
          classid: detail.id,
          classname: detail.title,
          biz: 0,
        });
        onLoginSuccess(roomId);
        reporter.reportInvokeResult(
          EMsgid.ENTER_CLASSROOM_RESULT,
          true,
          params
        );
      })
      .catch(err => {
        const msg = (err && err.message) || '进入课堂失败，请检查！';
        Toast.show({
          content: msg,
          duration: 3000,
        });
        console.log(err);
        reporter.reportInvokeResult(
          EMsgid.ENTER_CLASSROOM_RESULT,
          false,
          params,
          err
        );
      })
      .finally(() => {
        setLogging(false);
      });
  };

  return (
    <div className={styles['login-page']}>
      <div className={styles['login-form']}>
        <div className={styles['login-header']}>
          <img
            src="https://img.alicdn.com/imgextra/i2/O1CN01HD2Yzo1HHIlyaNtGx_!!6000000000732-2-tps-150-150.png"
            alt="logo"
            className={styles.logo}
          />
          <div className={styles['login-title']}>互动课堂</div>
        </div>

        <div className={styles['login-input-block']}>
          {inputConfig.map(item => (
            <div className={styles.input} key={item.id}>
              <Input
                clearable
                id={item.id}
                autoComplete="off"
                onChange={value => item.inputChangeFn(value)}
                onFocus={() => item.setFocusFn(true)}
                onBlur={() => item.setFocusFn(false)}
              />
              <div className={inputTipClassNames(item.state)}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className={styles['login-btn']}>
          <Button
            disabled={!nickname || !roomId}
            loading={logging}
            block
            color="primary"
            shape="rounded"
            size="large"
            onClick={loginClickHandler}
          >
            进入教室
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;
