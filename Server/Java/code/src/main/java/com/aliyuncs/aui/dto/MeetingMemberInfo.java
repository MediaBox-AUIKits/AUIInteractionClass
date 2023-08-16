package com.aliyuncs.aui.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 连麦成员信息
 *
 */
public class MeetingMemberInfo {

    /**
    * 用户Id
    */
    @JsonProperty("user_id")
    private String userId;

    /**
     * 用户Nick
     */
    @JsonProperty("user_nick")
    private String userNick;

    /**
     * 用户头像
     */
    @JsonProperty("user_avatar")
    private String userAvatar;

    /**
     * 摄像头状态
     */
    @JsonProperty("camera_opened")
    private Boolean cameraOpened;

    /**
     * 麦克风状态
     */
    @JsonProperty("mic_opened")
    private Boolean micOpened;

    /**
     * 连麦拉流地址
     */
    @JsonProperty("rtc_pull_url")
    private String rtcPullUrl;


    @Data
    public static class Members {
        private List<MeetingMemberInfo> members;
    }
}
