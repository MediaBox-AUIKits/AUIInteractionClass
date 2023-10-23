import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { useDebounceFn } from 'ahooks';
import { UserRoleEnum, ClassroomModeEnum, LoginProps } from '@/types';
import reporter from '@/utils/Reporter';
import toast from '@/utils/toast';
import { handleEnterClassroom } from '../utils';
import './styles.less';

const RoleOptions = [
  {
    value: UserRoleEnum.Teacher,
    label: '教师',
  },
  {
    value: UserRoleEnum.Student,
    label: '学生',
  },
];

const ModeOptions = [
  {
    value: ClassroomModeEnum.Open,
    label: '公开课',
  },
  {
    value: ClassroomModeEnum.Big,
    label: '大班课',
  },
];

const PCLogin = (props: LoginProps) => {
  const { onLoginSuccess } = props;

  const [form] = Form.useForm();
  const [idRequired, setIdRequired] = useState<boolean>(false);
  const [allowSubmit, setAllowSubmit] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!idRequired) {
      form.validateFields(['id']); // 非必填时重置教室ID校验
    }
  }, [idRequired]);

  const { run: updateAllowSubmit } = useDebounceFn(
    (changedFields: any[]) => {
      let idItemRequired = idRequired;
      const roleTarget = changedFields.find(item => item.name.includes('role'));
      if (roleTarget) {
        idItemRequired = roleTarget.value === UserRoleEnum.Student;
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
    },
    {
      wait: 500,
    }
  );

  const enterClassroom = () => {
    setSubmitting(true);
    const values = form.getFieldsValue();

    handleEnterClassroom(values)
      .then(detail => {
        if (!values.id) {
          reporter.updateCommonParams({
            classid: detail.id,
            classname: detail.title,
            biz: values.role,
          });
          reporter.createClassroom(); // 上报创建课堂成功日志
        }
        onLoginSuccess(detail.id, values.role);
      })
      .catch(err => {
        console.log(err);
        const msg = (err && err.message) || '进入课堂失败，请检查！';
        toast.error(msg);
        reporter.createOrEnterClassroomError({
          ...values,
          message: msg,
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
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
            role: UserRoleEnum.Teacher,
            mode: ClassroomModeEnum.Open,
          }}
          onFieldsChange={updateAllowSubmit}
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
        </Form>

        <Button
          type="primary"
          block
          disabled={!allowSubmit}
          loading={submitting}
          onClick={() => form.submit()}
        >
          进入教室
        </Button>

        <div className="amaui-classroom__pc-login__tip">
          仅用于产品功能演示 <span>严禁商用</span> 版本 V{ASSETS_VERSION}
        </div>
      </div>
    </div>
  );
};

export default PCLogin;
