package com.aliyuncs.aui.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 拉流地址
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PullLiveInfo {

    @JsonProperty("rtmp_url")
    private String rtmpUrl;
    @JsonProperty("rts_url")
    private String rtsUrl;
    @JsonProperty("flv_url")
    private String flvUrl;
    @JsonProperty("hls_url")
    private String hlsUrl;
    @JsonProperty("rtmp_oriaac_url")
    private String rtmpOriaacUrl;
    @JsonProperty("rts_oriaac_url")
    private String rtsOriaacUrl;
    @JsonProperty("flv_oriaac_url")
    private String flvOriaacUrl;
    @JsonProperty("hls_oriaac_url")
    private String hlsOriaacUrl;

    @JsonProperty("rtmp_screen_url")
    private String rtmpScreenUrl;
    @JsonProperty("rts_screen_url")
    private String rtsScreenUrl;
    @JsonProperty("flv_screen_url")
    private String flvScreenUrl;
    @JsonProperty("hls_screen_url")
    private String hlsScreenUrl;
    @JsonProperty("rtmp_screen_oriaac_url")
    private String rtmpScreenOriaacUrl;
    @JsonProperty("rts_screen_oriaac_url")
    private String rtsScreenOriaacUrl;
    @JsonProperty("flv_screen_oriaac_url")
    private String flvScreenOriaacUrl;
    @JsonProperty("hls_screen_oriaac_url")
    private String hlsScreenOriaacUrl;

}