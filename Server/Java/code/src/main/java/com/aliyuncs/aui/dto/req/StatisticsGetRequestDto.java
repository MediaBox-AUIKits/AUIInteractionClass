package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 直播间统计信息
 */
@Data
public class StatisticsGetRequestDto {
    
    @NotBlank(message="直播间id不能为空")
    @JsonProperty("chatroom_id")
    private String chatroomId;

    
    @NotBlank(message="serverType 不能为空")
    @JsonProperty("server_type")
    private String serverType;

}
