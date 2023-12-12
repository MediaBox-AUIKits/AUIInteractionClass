import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Input, Select, Switch } from 'antd';
import { LoadingOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import {
  UserRoleEnum,
  ClassroomModeEnum,
  LoginProps,
  Permission,
} from '@/types';
import reporter, { EMsgid } from '@/utils/Reporter';
import toast from '@/utils/toast';
import AssistantPermissionsModal from '../components/AssistantPermissions';
import {
  RoleOptions,
  ModeOptions,
  DefaultAssistantPermissions,
} from '../constants';
import { handleEnterClassroom } from '../utils';
import './styles.less';

const DefaultRole = UserRoleEnum.Teacher;

const PCLogin = (props: LoginProps) => {
  const { onLoginSuccess, services } = props;

  const [form] = Form.useForm();
  const { role = DefaultRole } = form.getFieldsValue();
  const [idRequired, setIdRequired] = useState<boolean>(false);
  const [allowSubmit, setAllowSubmit] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 有获取/更新助教权限接口才认为助教权限可配置，可根据业务调整
  const asstPermConfigurable = useMemo(
    () =>
      !!services?.fetchAssistantPermissions &&
      !!services?.setAssistantPermissions,
    [services]
  );
  const [asstEnabled, setAsstEnabled] = useState(false);
  const [updateAsstPermDisabled, setUpdateAsstPermDisabled] = useState(true);
  const [asstPermModalVisible, setAsstPermModalVisible] = useState(false);
  const [asstPerm, setAsstPerm] = useState<Permission[] | undefined>(); // 页面内存中的修改的助教配置
  const [prevAsstPerm, setPrevAsstPerm] = useState<Permission[] | undefined>(); // 之前的助教配置（已有教室且开启过助教功能）
  const [prevAsstPermFetching, setPrevAsstPermFetching] = useState(false);
  const showAsstPermConfig = useMemo(
    () => asstPermConfigurable && role === UserRoleEnum.Teacher,
    [role, asstPermConfigurable]
  );

  useEffect(() => {
    if (prevAsstPerm && !asstPerm) {
      setAsstPerm(prevAsstPerm);
    }
  }, [asstPerm, prevAsstPerm]);

  useEffect(() => {
    setUpdateAsstPermDisabled(!asstEnabled);
  }, [asstEnabled]);

  useEffect(() => {
    if (!idRequired) {
      form.validateFields(['id']); // 非必填时重置教室ID校验
    }
  }, [idRequired]);

  const updateAllowSubmit = (changedFields: any[]) => {
    let idItemRequired = idRequired;
    const roleTarget = changedFields.find(item => item.name.includes('role'));
    if (roleTarget) {
      idItemRequired =
        roleTarget.value === UserRoleEnum.Student ||
        roleTarget.value === UserRoleEnum.Assistant;
      setIdRequired(idItemRequired);
    }

    // 目前若为教师角色只有用户名称为必填项
    // 若为学生角色则教室号也是必填项
    // 所以校验用户名、教室号有值，且无错误即可
    let bool = changedFields.some(item => {
      if (item.name.includes('userName') || item.name.includes('id')) {
        if (item.errors && item.errors.length) {
          return true;
        }
      }
      return false;
    });
    if (bool) {
      setAllowSubmit(false);
    } else {
      const values = form.getFieldsValue(['userName', 'id']);
      // 若教室号 id 为必填项，则需要 id 为有值
      if (!values.userName || (idItemRequired && !values.id)) {
        setAllowSubmit(false);
      } else {
        setAllowSubmit(true);
      }
    }
  };

  const fetchAsstPerm = useCallback(
    async (classId: string, userName: string) => {
      setPrevAsstPermFetching(true);
      const permissions = await services!.fetchAssistantPermissions!(
        classId,
        userName
      );
      if (permissions) {
        setPrevAsstPerm(permissions);
        setAsstEnabled(true);
      } else {
        setPrevAsstPerm(undefined);
        setAsstEnabled(false);
      }
      setPrevAsstPermFetching(false);
    },
    [services]
  );

  const { run: handleFieldsChanged } = useDebounceFn(
    (changedFields: any[]) => {
      updateAllowSubmit(changedFields);
    },
    {
      wait: 500,
    }
  );

  const updatePrevAsstPerm = useCallback(
    (classId: string, userName: string) => {
      // 填写了教室号和用户名，立即查询当前教室的助教权限配置
      if (userName && classId && showAsstPermConfig) {
        fetchAsstPerm(classId, userName);
      }
    },
    [form, showAsstPermConfig, fetchAsstPerm]
  );

  const { run: handleValuesChanged } = useDebounceFn(
    (changedValues: any, allValues: any) => {
      // 教室号或用户名改变，应当重新查询助教配置
      if (changedValues.id || changedValues.userName) {
        updatePrevAsstPerm(allValues.id, allValues.userName);
      }
    },
    {
      wait: 500,
    }
  );

  const saveAsstPerm = useCallback(
    async (classId: string) => {
      if (!showAsstPermConfig) return;
      const isRemove = !!prevAsstPerm && !asstEnabled;
      try {
        if (isRemove) {
          await services?.deleteAssistantPermissions?.(classId);
        } else if (asstEnabled) {
          const curAsstPerm = asstPerm ?? DefaultAssistantPermissions;
          const changed =
            curAsstPerm.sort().join(',') !== prevAsstPerm?.sort().join(',');
          if (changed) {
            await services?.setAssistantPermissions?.(classId, curAsstPerm);
          }
        }
      } catch (err: any) {
        const msg = err?.message || '更新助教权限失败，请重试！';
        throw msg;
      }
    },
    [services, asstPerm, asstEnabled, prevAsstPerm, showAsstPermConfig]
  );

  const enterClassroom = useCallback(() => {
    setSubmitting(true);
    const values = form.getFieldsValue();

    reporter.reportInvoke(EMsgid.ENTER_CLASSROOM, values);
    handleEnterClassroom(values)
      .then(async detail => {
        if (!values.id) {
          reporter.updateCommonParams({
            classid: detail.id,
            classname: detail.title,
            biz: values.role,
          });
        }
        await saveAsstPerm(detail.id);
        // 更新助教权限
        onLoginSuccess(detail.id, values.role);
        reporter.reportInvokeResult(
          EMsgid.ENTER_CLASSROOM_RESULT,
          true,
          values
        );
      })
      .catch(err => {
        console.log(err);
        const msg = (err && err.message) || '进入课堂失败，请检查！';
        toast.error(msg);
        reporter.reportInvokeResult(
          EMsgid.ENTER_CLASSROOM_RESULT,
          false,
          values,
          err
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [saveAsstPerm]);

  const openAsstPermModal = () => {
    setAsstPermModalVisible(true);
  };

  return (
    <div className="amaui-classroom__pc-login">
      <div className="amaui-classroom__pc-login__img">
        <img
          src="https://img.alicdn.com/imgextra/i4/O1CN01RL0QhJ1KoE5yJsnn8_!!6000000001210-2-tps-600-648.png"
          alt="bg"
        />
      </div>
      <div className="amaui-classroom__pc-login__form">
        <div className="amaui-classroom__pc-login__title">
          <img
            src="https://img.alicdn.com/imgextra/i2/O1CN01co3WJm1ZNP8P3w8oI_!!6000000003182-2-tps-40-40.png"
            alt="logo"
            className="amaui-classroom__pc-login__logo"
          />
          <span>互动课堂</span>
        </div>
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          initialValues={{
            role: DefaultRole,
            mode: ClassroomModeEnum.Open,
          }}
          onFieldsChange={handleFieldsChanged}
          onValuesChange={handleValuesChanged}
          onFinish={enterClassroom}
        >
          <Form.Item name="role" label="课堂角色">
            <Select placeholder="请选择课堂角色">
              {RoleOptions.map(item => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="mode" label="课堂类型">
            <Select placeholder="请选择课堂类型">
              {ModeOptions.map(item => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="id"
            label="教室号"
            rules={[{ required: idRequired, message: '请输入教室ID' }]}
          >
            <Input.TextArea
              rows={2}
              style={{ resize: 'none' }}
              placeholder={`请输入教室ID${
                idRequired ? '' : '，未输入将新创建教室'
              }`}
            />
          </Form.Item>
          <Form.Item
            name="userName"
            label="用户名称"
            rules={[
              { required: true, message: '请输入4-12位字母、数字用户名称' },
              {
                validator: (rule, value) => {
                  if (!value || /^[a-zA-Z0-9]{4,12}$/.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('请输入4-12位字母、数字用户名称')
                  );
                },
              },
            ]}
          >
            <Input placeholder="请输入4-12位字母、数字用户名称" />
          </Form.Item>

          {showAsstPermConfig ? (
            <Form.Item
              label="助教设置 (填写教室号/用户名后再配置助教权限)"
              tooltip={{
                title: '若不填写教室号/用户名，则无法拉取之前的配置进行参考',
                icon: <QuestionCircleFilled />,
              }}
            >
              <div className="amaui-classroom__pc-login__form__item__content">
                {prevAsstPermFetching ? (
                  <div className="amaui-classroom__pc-login__form__item__content__loading">
                    <LoadingOutlined />
                  </div>
                ) : (
                  <>
                    <div>
                      <Switch
                        size="small"
                        className="mr4"
                        checked={asstEnabled}
                        onChange={setAsstEnabled}
                      />
                      启用助教
                    </div>
                    <Button
                      type="link"
                      size="small"
                      disabled={updateAsstPermDisabled}
                      onClick={openAsstPermModal}
                    >
                      助教权限
                    </Button>
                  </>
                )}
              </div>
            </Form.Item>
          ) : null}
        </Form>

        <Button
          type="primary"
          block
          disabled={!allowSubmit || prevAsstPermFetching}
          loading={submitting}
          onClick={() => form.submit()}
        >
          进入教室
        </Button>

        <div className="amaui-classroom__pc-login__tip">
          仅用于产品功能演示 <span>严禁商用</span> 版本 V{ASSETS_VERSION}
        </div>
      </div>
      <AssistantPermissionsModal
        visible={asstPermModalVisible}
        defaultPermissions={asstPerm ?? DefaultAssistantPermissions}
        afterClose={() => setAsstPermModalVisible(false)}
        onConfirm={setAsstPerm}
      />
    </div>
  );
};

export default PCLogin;
