package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * AuthTokenRequestDto
 */
@Data
public class AuthTokenRequestDto {

    @ApiModelProperty(value = "用户Id")
    @NotBlank(message="userId不能为空")
    @JsonProperty("user_id")
    private String userId;

    @ApiModelProperty(value = "直播Id")
    @NotBlank(message="liveId不能为空")
    @JsonProperty("live_id")
    private String liveId;

    @JsonProperty("user_name")
    private String userName;

    @NotBlank(message="appServer不能为空")
    @JsonProperty("app_server")
    private String appServer;

    @NotBlank(message="token不能为空")
    private String token;
}
