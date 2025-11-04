package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 用户禁言
 */
@Data
public class UserMuteRequestDto {
    
    @NotBlank(message="直播间id不能为空")
    @JsonProperty("chatroom_id")
    private String chatroomId;

    
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

    
    @NotNull(message="Minute不能为空")
    @JsonProperty("minute")
    private Integer minute;

    
    @NotBlank(message="serverType 不能为空")
    @JsonProperty("server_type")
    private String serverType;

}
