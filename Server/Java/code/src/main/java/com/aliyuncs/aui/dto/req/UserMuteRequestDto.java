package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 用户禁言
 */
@Data
@ApiModel(value = "用户禁言")
public class UserMuteRequestDto {
    @ApiModelProperty(value = "ChatroomId")
    @NotBlank(message="直播间id不能为空")
    @JsonProperty("chatroom_id")
    private String chatroomId;

    @ApiModelProperty(value = "UserId")
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

    @ApiModelProperty(value = "Minute")
    @NotNull(message="Minute不能为空")
    @JsonProperty("minute")
    private Integer minute;

    @ApiModelProperty(value = "serverType")
    @NotBlank(message="serverType 不能为空")
    @JsonProperty("server_type")
    private String serverType;

}
