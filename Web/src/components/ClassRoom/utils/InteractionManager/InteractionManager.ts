import {
  InteractionSession,
  InteractionManagerProps,
  InteractionIMData,
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
  remoteUserId?: string;
  type?: CustomMessageTypes;
}

export default class InteractionManager {
  role?: UserRoleEnum;
  message: InstanceType<typeof AUIMessage>;
  protected expiredSessionIds: string[] = [];
  protected pendingSessionQueue: InteractionSession[] = [];

  constructor(props: InteractionManagerProps) {
    this.message = props.message;
  }

  protected isExpiredSessionId(sessionId: string): boolean {
    const isExpired = !!this.expiredSessionIds.find(item => item === sessionId);
    if (isExpired) {
      console.log('[INTERACTION_MANAGER] isExpiredSessionId: ', sessionId);
    }
    return isExpired;
  }

  protected getSessionId(type: string | number) {
    return `${+Date.now()}_${type}`;
  }

  protected getSession = (
    params: GetSessionParams
  ): InteractionSession | undefined => {
    const {
      sessionId: _sessionId,
      remoteUserId: _remoteUserId,
      type: _type,
    } = params;
    return this.pendingSessionQueue.find(
      ({ sessionId, remoteUserId, type }) => {
        const sessionIdMatch =
          _sessionId === undefined || _sessionId === sessionId;
        const remoteUserIdMatch =
          _remoteUserId === undefined || _remoteUserId === remoteUserId;
        const typeMatch = _type === undefined || _type === type;
        return sessionIdMatch && remoteUserIdMatch && typeMatch;
      }
    );
  };

  protected removeSession(targetSessionId: string) {
    const index = this.pendingSessionQueue.findIndex(
      ({ sessionId }) => sessionId === targetSessionId
    );
    this.pendingSessionQueue.splice(index, 1);
    console.log(this.pendingSessionQueue);
  }

  async sendIM(type: CustomMessageTypes, data: InteractionIMData) {
    console.log(
      `${formatTime(new Date())} [INTERACTION_MANAGER] sendIM`,
      `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
      '\ndata:',
      data
    );

    logger.reportInvoke(EMsgid.SEND_INTERACTION_IM);
    try {
      await this.message.sendMessageToGroup({
        type,
        skipAudit: true,
        skipMuteCheck: true,
        data,
      });
      logger.reportInvokeResult(EMsgid.SEND_INTERACTION_IM_RESULT, true);
    } catch (error) {
      logger.reportInvokeResult(
        EMsgid.SEND_INTERACTION_IM_RESULT,
        false,
        '',
        error
      );
    }
  }

  // 检查角色是否合法
  protected checkRole() {}
}

export const createInteractionError = (
  reason: ERROR,
  args?: any
): InteractionError => {
  return {
    reason,
    args,
  };
};
