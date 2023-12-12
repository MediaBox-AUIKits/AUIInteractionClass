import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Checkbox, Modal } from 'antd';
import Icon from '@ant-design/icons';
import { Permission } from '@/types';
import {
  AssistantPermissionList,
  DefaultAssistantPermissions,
} from '../../constants';
import './index.less';

interface IProps {
  visible: boolean;
  defaultPermissions: Permission[];
  afterClose: () => void;
  onConfirm: (permissions: Permission[]) => void;
}

const AssistantPermissions: React.FC<IProps> = props => {
  const { visible, defaultPermissions, afterClose, onConfirm } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] =
    useState(defaultPermissions);

  useEffect(() => {
    setSelectedPermissions(defaultPermissions);
  }, [defaultPermissions]);

  const changed = useMemo(
    () =>
      defaultPermissions.sort().join(',') !==
      selectedPermissions.sort().join(','),
    [defaultPermissions, selectedPermissions]
  );

  const notDefault = useMemo(
    () =>
      DefaultAssistantPermissions.sort().join(',') !==
      selectedPermissions.sort().join(','),
    [selectedPermissions]
  );

  useEffect(() => {
    setIsModalOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedPermissions(defaultPermissions);
    }
  }, [isModalOpen]);

  const handleOk = useCallback(() => {
    onConfirm(selectedPermissions);
    setIsModalOpen(false);
  }, [selectedPermissions]);

  const handleCancel = useCallback(async () => {
    if (changed) {
      await Modal.confirm({
        title: '是否保存当前权限设置？',
        okText: '是',
        cancelText: '否',
        onOk: handleOk,
        onCancel: () => setIsModalOpen(false),
      });
    } else {
      setIsModalOpen(false);
    }
  }, [defaultPermissions, selectedPermissions, changed]);

  const handlePermSelected = useCallback(
    (key: Permission) => () => {
      const index = selectedPermissions.indexOf(key);
      const to = !(index > -1);
      if (to) {
        setSelectedPermissions([...selectedPermissions, key]);
      } else {
        const newList = [...selectedPermissions];
        newList.splice(index, 1);
        setSelectedPermissions(newList);
      }
    },
    [selectedPermissions]
  );

  const handleReset = () => {
    setSelectedPermissions(DefaultAssistantPermissions);
  };

  return (
    <Modal
      title="助教权限"
      width={654}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      afterClose={afterClose}
      okText="确认"
      cancelText="取消"
    >
      <div className="assistant-permissions-setting__pc">
        <p className="assistant-permissions-setting__pc__guide">
          从以下选项中选择助教权限，
          <Button
            className="button"
            type="link"
            disabled={!notDefault}
            onClick={handleReset}
          >
            重置选项
          </Button>
        </p>
        <div className="assistant-permissions-setting__pc__body">
          {AssistantPermissionList.map(({ title, options }) => (
            <div key={title} className="group">
              <div className="group__title">{title}</div>
              <div className="group__body">
                {options.map(({ label, icon, key }) => (
                  <div
                    key={key}
                    className="group__body__item"
                    onClick={handlePermSelected(key)}
                  >
                    <div className="group__body__item__icon">
                      <Icon component={icon} />
                    </div>
                    <div className="group__body__item__label">{label}</div>
                    <div className="group__body__item__checkbox">
                      <Checkbox
                        checked={selectedPermissions.includes(key)}
                      ></Checkbox>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AssistantPermissions;
