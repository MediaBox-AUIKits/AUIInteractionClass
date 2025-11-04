package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * RtcAuthTokenRequestDto
 */
@Data
public class RtcAuthTokenRequestDto {

    
    @NotBlank(message="roomId不能为空")
    @JsonProperty("room_id")
    private String roomId;

    
    @NotBlank(message="userId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
