import React, { useState } from 'react';
import { Button, Form, Input, Select, message } from 'antd';
import { useDebounceFn } from 'ahooks';
import { UserRoleEnum, ClassroomModeEnum, LoginProps } from '@/types';
import reporter from '@/utils/Reporter';
import { handleEnterClassroom } from '../utils';
import './styles.less';

const RoleOptions = [
  {
    value: UserRoleEnum.Teacther,
    label: '教师',
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
  const [allowSubmit, setAllowSubmit] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { run: updateAllowSubmit } = useDebounceFn(
    (changedFields: any[]) => {
      // 因为目前只有用户名称必需用户输入，其他的有默认值或非必需
      // 所以校验用户名有值，且无错误即可
      const target = changedFields.find(item => item.name.includes('userName'));
      if (!target) {
        return;
      }
      if (target.value && target.errors && !target.errors.length) {
        setAllowSubmit(true);
      } else {
        setAllowSubmit(false);
      }
    },
    {
      wait: 500,
    }
  );

  const enterClassroom = () => {
    setSubmitting(true);
    const values = form.getFieldsValue();
    // console.log(values);

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
        message.error(msg);
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
            role: UserRoleEnum.Teacther,
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
            // TODO: 后续若是支持 PC 版学生登录，教室ID 必填
          >
            <Input.TextArea
              rows={2}
              style={{ resize: 'none' }}
              placeholder="请输入教室ID，未输入将新创建教室"
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
