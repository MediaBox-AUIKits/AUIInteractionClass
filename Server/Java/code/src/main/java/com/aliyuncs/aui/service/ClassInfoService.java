package com.aliyuncs.aui.service;

import com.aliyuncs.aui.common.utils.PageUtils;
import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.dto.MeetingMemberInfo;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.*;
import com.aliyuncs.aui.entity.ClassInfoEntity;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 *  房间服务
 */
public interface ClassInfoService extends IService<ClassInfoEntity> {

    /**
    * 获取IM的token
    */
    ImTokenResponseDto getImToken(ImTokenRequestDto imTokenRequestDto);

    /**
     * 创建房间
     */
    RoomInfoDto createRoomInfo(RoomCreateRequestDto roomCreateRequestDto, BoardCreateResponse createResponse);

    /**
     * 获取房间详情
     */
    RoomInfoDto get(RoomGetRequestDto roomGetRequestDto);

    /**
     * 批量获取房间详情
     */
    PageUtils list(RoomListRequestDto roomListRequestDto);

    /**
     * 关闭房间（直播间）
     */
    RoomInfoDto stop(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto);

    /**
     * 暂停房间（直播间）
     */
    RoomInfoDto pause(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto);

    /**
     * 开始房间（直播间）
     */
    RoomInfoDto start(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto);

    /**
     * 删除房间（直播间）
     */
    RoomInfoDto delete(RoomDeleteRequestDto roomDeleteRequestDto);

    /**
     * 修改房间（直播间）
     */
    RoomInfoDto update(RoomUpdateRequestDto roomUpdateRequestDto);

    /**
     * 修改连麦信息
     */
    MeetingMemberInfo.Members updateMeetingInfo(MeetingActionRequestDto meetingActionRequestDto);

    /**
     * 获取连麦信息
     */
    MeetingMemberInfo.Members getMeetingInfo(MeetingGetRequestDto meetingGetRequestDto);

    /**
     * 检验直播推流状态回调的签名。见文档：https://help.aliyun.com/document_detail/199365.html?spm=5176.13499635.help.dexternal.35d92699jvVrc7#section-mxt-vfh-b6s
     */
    boolean handlePushStreamEventCallback(LivePushStreamEventRequestDto livePushStreamEventRequestDto);

    /**
     * 获取PC小助手的跳转链接
     */
    JumpUrlResponse getLiveJumpUrl(JumpUrlRequestDto jumpUrlRequestDto, String serverHost);

    /**
     * 验证跳转链接
     */
    AuthTokenResponse verifyAuthToken(AuthTokenRequestDto authTokenRequestDto);

    RtcAuthTokenResponse getRtcAuthToken(RtcAuthTokenRequestDto rtcAuthTokenRequestDto);

    BoardAuthResponse getWhiteboardAuthInfo();

    Result returnResult(Object object);
}

