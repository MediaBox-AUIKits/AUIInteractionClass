package com.aliyuncs.aui.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 连麦成员信息
 *
 */
@Data
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

    /**
     * 是否推音频轨
     */
    @JsonProperty("is_audio_publishing")
    private Boolean audioPublishing;

    /**
     * 是否推视频轨
     */
    @JsonProperty("is_video_publishing")
    private Boolean videoPublishing;

    /**
     * 是否推屏幕轨
     */
    @JsonProperty("is_screen_publishing")
    private Boolean screenPublishing;

    @Data
    public static class Members {
        private List<MeetingMemberInfo> members;
    }
}
