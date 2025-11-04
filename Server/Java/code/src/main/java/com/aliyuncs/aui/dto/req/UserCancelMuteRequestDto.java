package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 用户解禁
 */
@Data
public class UserCancelMuteRequestDto {

    
    @NotBlank(message="直播间id不能为空")
    @JsonProperty("chatroom_id")
    private String chatroomId;

    
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

    
    @NotBlank(message="serverType 不能为空")
    @JsonProperty("server_type")
    private String serverType;

}
