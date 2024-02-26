import CooperationManager, {
  createCooperationError,
} from './CooperationManager';
import { CustomMessageTypes, UserRoleEnum, Permission } from '@/types';
import { CooperationProps, CooperationIMData, ERROR } from '.';

export default class TeacherCooperationManager extends CooperationManager {
  private muteUserSessionIdMap: Map<string, string> = new Map();
  private muteGroupSessionId: string | undefined;
  constructor(props: CooperationProps) {
    super(props);
    this.role = UserRoleEnum.Teacher;
  }

  protected checkRole() {
    if (this.role !== UserRoleEnum.Teacher) {
      throw createCooperationError(ERROR.ROLE_ACTION_MISMATCH);
    }
  }

  syncAsstPermissions(
    permissions: Permission[],
    receiverId = this.defaultReceiverId ?? ''
  ) {
    // 未有助教，无需同步
    if (!receiverId) return;

    const type = CustomMessageTypes.SyncAssistantPermissions;
    const sessionId = this.getSessionId(type);
    this.sendIM(type, receiverId, {
      sessionId,
      permissions,
    });
  }

  receiveMuteUserReq(data: CooperationIMData) {
    this.checkRole();

    const { sessionId, userId } = data;
    if (
      this.muteUserSessionIdMap.get(userId) ||
      this.expiredSessionIds.includes(sessionId)
    ) {
      return;
    }

    this.muteUserSessionIdMap.set(userId, sessionId);
  }

  muteUserDone(
    success = true,
    userId: string,
    receiverId = this.defaultReceiverId ?? ''
  ) {
    this.checkRole();

    const type = CustomMessageTypes.ResponseMuteUser;
    const sessionId = this.muteUserSessionIdMap.get(userId);
    if (!sessionId) {
      throw createCooperationError(ERROR.STATE_ACTION_MISMATCH, {
        receiverId,
        type,
      });
    }

    this.sendIM(type, receiverId, {
      sessionId,
      success,
    });
    this.setSessionIdExpired(sessionId);
    this.muteUserSessionIdMap.delete(userId);
  }

  receiveMuteGroupReq(data: CooperationIMData) {
    this.checkRole();

    const { sessionId, userId } = data;
    if (
      this.muteGroupSessionId === sessionId ||
      this.expiredSessionIds.includes(sessionId)
    ) {
      return;
    }

    this.muteGroupSessionId = sessionId;
  }

  muteGroupDone(success = true, receiverId = this.defaultReceiverId ?? '') {
    this.checkRole();

    const type = CustomMessageTypes.ResponseMuteGroup;
    if (!this.muteGroupSessionId) {
      throw createCooperationError(ERROR.STATE_ACTION_MISMATCH, {
        receiverId,
        type,
      });
    }

    this.sendIM(type, receiverId, {
      sessionId: this.muteGroupSessionId,
      success,
    });
    this.setSessionIdExpired(this.muteGroupSessionId);
    this.muteGroupSessionId = undefined;
  }
}
