import React, {
  useState,
  useContext,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { Pagination, Spin } from 'antd';
import { useThrottleFn, useLatest } from 'ahooks';
import MemberItem from './MemberItem';
import MemberControls from './ItemControls/MemberControls';
import { ClassContext } from '../../ClassContext';
import useClassroomStore from '../../store';
import { MemberStatus } from '../../types';
import styles from './MemberList.less';

const MemberPageSize = 20;
const StatusTextMap: any = {
  '1': '',
  '2': '已离开',
  '3': '被移除',
};

interface IMemberListProps {
  visible: boolean;
}

const MemberList: React.FC<IMemberListProps> = props => {
  const { visible } = props;
  const visibleLatest = useLatest(visible);
  const { services } = useContext(ClassContext);
  const {
    classroomInfo: { id: classId },
    memberList,
    interactionInvitationUsers,
    connectedSpectators,
    memberListFlag,
    applyingList,
    setMemberList,
  } = useClassroomStore(state => state);
  const [pageNum, setPageNum] = useState(1);
  const pageNumLatest = useLatest(pageNum);
  const [memberTotal, setMemberTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  const fetchList = useCallback((needSetFetching = true) => {
    if (needSetFetching) {
      setFetching(true);
    }
    const { id } = useClassroomStore.getState().classroomInfo;
    if (!id) {
      return;
    }
    services
      ?.listMembers({
        class_id: id,
        page_num: pageNumLatest.current,
        page_size: MemberPageSize, // 一页几个
        identity: 0, // 所以角色
        status: 0, // 所有状态
      })
      .then(res => {
        setMemberTotal(res.total);
        setMemberList(res.members);
      })
      .catch(err => {
        console.error('listmembers', err);
      })
      .finally(() => {
        if (needSetFetching) {
          setFetching(false);
        }
      });
  }, []);

  const { run: throttleFetchList, cancel: cancelFetchList } = useThrottleFn(
    fetchList,
    {
      wait: 2000,
    }
  );

  useEffect(() => {
    if (visibleLatest.current) {
      throttleFetchList(false);
    }
  }, [memberListFlag]);

  useEffect(() => {
    if (visible && classId) {
      fetchList();
    }
  }, [classId, visible, pageNum]);

  useEffect(() => {
    return () => {
      cancelFetchList();
    };
  }, []);

  const combinationList = useMemo(
    () =>
      memberList.map(item => {
        const { userId, status } = item;
        const notOnline = status !== MemberStatus.online;
        const inviting = interactionInvitationUsers.includes(userId);
        const isApplying = !!applyingList.find(item => item.userId === userId);
        const isConnected = !!connectedSpectators.find(
          item => item.userId === userId
        );

        let subInfo = undefined;
        if (StatusTextMap[status]) {
          subInfo = StatusTextMap[status];
        } else if (isConnected) {
          subInfo = '已连麦';
        } else if (isApplying) {
          subInfo = '连麦申请中';
        } else if (inviting) {
          subInfo = (
            <span className={styles['member-list__inviting-info']}>
              邀请中...
            </span>
          );
        }

        return {
          notOnline,
          inviting,
          isApplying,
          isConnected,
          subInfo,
          userId,
          userInfo: item,
        };
      }),
    [interactionInvitationUsers, connectedSpectators, applyingList, memberList]
  );

  return (
    <Spin wrapperClassName={styles['member-list__wrap']} spinning={fetching}>
      <div className={styles['member-list']}>
        {combinationList.map(item => (
          <MemberItem
            key={item.userId}
            {...item}
            controls={<MemberControls {...item} />}
          />
        ))}
      </div>

      {memberTotal > MemberPageSize ? (
        <Pagination
          simple
          size="small"
          current={pageNum}
          pageSize={MemberPageSize}
          total={memberTotal}
          className={styles['member-list__pagination']}
          onChange={page => setPageNum(page)}
        />
      ) : null}
    </Spin>
  );
};

export default MemberList;
