import {
  CooperationSession,
  CooperationProps,
  CooperationIMData,
  ERROR,
  InteractionError,
} from '.';
import AUIMessage from '@/BaseKits/AUIMessage';
import { CustomMessageTypes, UserRoleEnum } from '@/types';
import { getEnumKey } from '@/utils/common';
import { formatTime } from '@/components/ClassRoom/utils/common';
import logger, { EMsgid } from '../Logger';

interface GetSessionParams {
  sessionId?: string;
  receiverId?: string;
  type?: CustomMessageTypes;
  flag?: any;
}

export default class CooperationManager {
  role?: UserRoleEnum;
  message: InstanceType<typeof AUIMessage>;
  defaultReceiverId?: string;
  protected expiredSessionIds: string[] = [];
  protected pendingSessionQueue: CooperationSession[] = [];

  constructor(props: CooperationProps) {
    this.message = props.message;
    this.defaultReceiverId = props.defaultReceiverId;
  }

  set receiverId(val: string) {
    this.defaultReceiverId = val;
  }

  protected setSessionIdExpired(sessionId: string): void {
    if (!!this.expiredSessionIds.find(item => item === sessionId)) return;

    console.log('[CooperationManager] setSessionIdExpired: ', sessionId);
    this.expiredSessionIds.push(sessionId);
  }

  protected isExpiredSessionId(sessionId: string): boolean {
    const isExpired = !!this.expiredSessionIds.find(item => item === sessionId);
    if (isExpired) {
      console.log('[COOPERATION_MANAGER] isExpiredSessionId: ', sessionId);
    }
    return isExpired;
  }

  protected getSessionId(type: string | number) {
    return `${+Date.now()}_${type}`;
  }

  protected getSession = (
    params: GetSessionParams
  ): CooperationSession | undefined => {
    const {
      sessionId: _sessionId,
      receiverId: _receiverId,
      type: _type,
      flag: _flag,
    } = params;
    return this.pendingSessionQueue.find(
      ({ sessionId, receiverId, type, flag }) => {
        const sessionIdMatch =
          _sessionId === undefined || _sessionId === sessionId;
        const receiverIdMatch =
          _receiverId === undefined || _receiverId === receiverId;
        const typeMatch = _type === undefined || _type === type;
        const flagMatch = _flag === undefined || _flag === flag;
        return sessionIdMatch && receiverIdMatch && typeMatch && flagMatch;
      }
    );
  };

  protected removeSession(targetSessionId: string) {
    const index = this.pendingSessionQueue.findIndex(
      ({ sessionId }) => sessionId === targetSessionId
    );
    this.pendingSessionQueue.splice(index, 1);
    this.setSessionIdExpired(targetSessionId);
  }

  async sendIM(
    type: CustomMessageTypes,
    receiverId: string,
    data?: CooperationIMData
  ) {
    console.log(
      `${formatTime(new Date())} [COOPERATION_MANAGER] sendIM`,
      `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
      '\ndata:',
      data
    );

    logger.reportInvoke(EMsgid.SEND_COOPERATION_IM);
    try {
      await this.message.sendMessageToGroupUser({
        type,
        skipAudit: true,
        skipMuteCheck: true,
        receiverId,
        data,
      });
      logger.reportInvokeResult(EMsgid.SEND_COOPERATION_IM_RESULT, true);
    } catch (error) {
      logger.reportInvokeResult(
        EMsgid.SEND_COOPERATION_IM_RESULT,
        false,
        '',
        error
      );
    }
  }

  // 检查角色是否合法
  protected checkRole() {}

  // 同步课件有更新
  syncDocsUpdated(receiverId = this.defaultReceiverId ?? '') {
    console.log('发送课件同步消息');
    const type = CustomMessageTypes.SyncDocsUpdated;
    this.sendIM(type, receiverId, {
      sessionId: this.getSessionId(type),
    });
  }
}

export const createCooperationError = (
  reason: ERROR,
  args?: any
): InteractionError => {
  return {
    reason,
    args,
  };
};
