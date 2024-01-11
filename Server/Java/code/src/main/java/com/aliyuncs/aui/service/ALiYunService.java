package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.LinkInfo;
import com.aliyuncs.aui.dto.PullLiveInfo;
import com.aliyuncs.aui.dto.PushLiveInfo;
import com.aliyuncs.aui.dto.req.ImTokenRequestDto;
import com.aliyuncs.aui.dto.res.ImTokenResponseDto;
import com.aliyuncs.aui.dto.res.NewImTokenResponseDto;
import com.aliyuncs.aui.dto.res.RoomInfoDto;

/**
 * 视频云服务
 */
public interface ALiYunService {

    /**
    * 获取Im的Token。见文档：https://help.aliyun.com/document_detail/465127.html
    */
    ImTokenResponseDto getImToken(ImTokenRequestDto imTokenRequestDto);

    /**
     * 获取新IM的token
     * @author chunlei.zcl
     */
    NewImTokenResponseDto getNewImToken(ImTokenRequestDto imTokenRequestDto);

    /**
    * 创建消息组。见文档：https://help.aliyun.com/document_detail/465128.html
    */
    String createMessageGroup(String teacherId);


    /**
    * 获取推流地址。见文档：https://help.aliyun.com/document_detail/199339.html
    */
    PushLiveInfo getPushLiveInfo(String streamName);


    /**
     * 获取拉流地址。见文档：https://help.aliyun.com/document_detail/199339.html
     */
    PullLiveInfo getPullLiveInfo(String streamName, String screenStreamName);


    /**
     * 获取RTC地址。见文档：https://help.aliyun.com/document_detail/450515.html
     */
    LinkInfo getRtcInfo(String channelId, String userId, String teacherId);

    /**
     * 从点播搜索录制的视频Id。见文档：https://help.aliyun.com/document_detail/436559.htm
     */
    String searchMediaByTitle(String title);


    /**
     * 通过音视频ID直接获取视频的播放地址。见文档：https://help.aliyun.com/document_detail/436555.html
     */
    RoomInfoDto.VodInfo getPlayInfo(String mediaId);

    /**
    *
    */
    RoomInfoDto.Metrics getGroupDetails(String groupId);

    /**
     * 用ListMessageGroupUserById通过用户ID列表查询用户信息。见文档；https://help.aliyun.com/document_detail/465143.html
     */
    RoomInfoDto.UserStatus getUserInfo(String groupId, String anchor) ;

    /**
     * 校验直播推流状态回调事件签名。见文档；https://help.aliyun.com/document_detail/199365.html?spm=5176.13499635.help.dexternal.35d92699jvVrc7#section-mxt-vfh-b6s
     */
    boolean validLiveCallbackSign(String liveSignature, String liveTimestamp);

    /**
     * 获取rtc token信息。见文档https://help.aliyun.com/document_detail/450516.htm、
     */
    String getRtcAuth(String channelId, String userId, long timestamp);

    /**
    *
    * 调用SendMessageToGroup向消息组全员发送消息。见：https://help.aliyun.com/zh/live/developer-reference/api-send-a-message-to-all-members-of-the-message-group
    */
    boolean sendMessageToGroup(String groupId, Integer type, ClassMemberDto classMemberDto);

    String createNewImMessageGroup(String groupId, String creatorId);
}
