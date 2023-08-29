package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 直播间统计信息
 */
@Data
@ApiModel(value = "直播间统计信息")
public class StatisticsGetRequestDto {
    @ApiModelProperty(value = "ChatroomId")
    @NotBlank(message="直播间id不能为空")
    @JsonProperty("chatroom_id")
    private String chatroomId;

    @ApiModelProperty(value = "serverType")
    @NotBlank(message="serverType 不能为空")
    @JsonProperty("server_type")
    private String serverType;

}
