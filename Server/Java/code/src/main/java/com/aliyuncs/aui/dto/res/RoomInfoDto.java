package com.aliyuncs.aui.dto.res;

import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.LinkInfo;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * 房间信息DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomInfoDto {

    private String id;
    /**
    * 白板
    * */
    @JsonProperty("boards")
    private String boardsInfo;

    /**
     * 创建时间
     */
    @JsonProperty("created_at")
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date createdAt;
    /**
     * 修改时间
     */
    @JsonProperty("updated_at")
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date updatedAt;
    /**
     * 直播间标题
     */
    private String title;
    /**
     * 直播间创建者
     */
    private String anchor;
    /**
     * 扩展信息
     */
    @JsonProperty("extends")
    private String extendsInfo;
    /**
     * 直播状态，0-准备中，1-已开始，2-已结束
     */
    private Long status;
    /**
     * 直播模式 0-公开课 1-大班 2-小班
     */
    private Long mode;

    /**
     * 融云id
     */
    @JsonProperty("rong_cloud_id")
    private String rongCloudId;

    /**
     * 阿里云id
     */
    @JsonProperty("aliyun_id")
    private String aliyunId;

    /**
     * 直播公告
     */
    private String notice;
    /**
     * 连麦Id
     */
    @JsonProperty("meeting_id")
    private String meetingId;
    /**
     * 直播封面
     */
    @JsonProperty("cover_url")
    private String coverUrl;
    /**
     * 老师Id
     */
    @JsonProperty("teacher_id")
    private String teacherId;
    /**
     * 老师Nick
     */
    @JsonProperty("teacher_nick")
    private String teacherNick;
    /**
     * 点播Id
     */
    @JsonProperty("vod_id")
    private String vodId;
    /**
     * 连麦成员信息（json序列化）
     */
    private String meetingInfo;
    /**
     * 直播开始时间
     */
    @JsonProperty("started_at")
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date startedAt;
    /**
     * 直播结束时间
     */
    @JsonProperty("stopped_at")
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date stoppedAt;

    @JsonProperty("vod_info")
    private VodInfo vodInfo;

    @JsonProperty("user_status")
    private UserStatus userStatus;

    @JsonProperty("link_info")
    private LinkInfo linkInfo;

    @JsonProperty("shadow_link_info")
    private LinkInfo linkShadowInfo;

    @JsonProperty("metrics")
    private Metrics metrics;

    @JsonProperty("assistantPermit")
    private ClassMemberDto assistantClassMemberDto;


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VodInfo {

        private Integer status;

        @JsonProperty("playlist")
        private List<PlayInfo> playInfos;
        
    }

    /**
    * 详见文档：https://help.aliyun.com/document_detail/436555.html
    */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayInfo {

        @JsonProperty("bit_depth")
        private Integer bitDepth;
        @JsonProperty("bit_rate")
        private String bitRate;
        @JsonProperty("creation_time")
        private String creationTime;
        private String definition;
        private String duration;
        private Long encrypt;
        @JsonProperty("encrypt_type")
        private String encryptType;
        private String format;
        private String fps;
        @JsonProperty("hdr_type")
        private String hDRType;
        private long height;
        private long width;
        @JsonProperty("play_url")
        private String playUrl;
        private Long size;
        private String status;
        @JsonProperty("stream_type")
        private String streamType;
        @JsonProperty("watermark_id")
        private String watermarkId;

    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatus {

        private Boolean mute;

        @JsonProperty("mute_source")
        private List<String> muteSource;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metrics {

        @JsonProperty("like_count")
        private Long likeCount;

        @JsonProperty("online_count")
        private Long onlineCount;

        private Long pv;

        private Long uv;

    }

}
