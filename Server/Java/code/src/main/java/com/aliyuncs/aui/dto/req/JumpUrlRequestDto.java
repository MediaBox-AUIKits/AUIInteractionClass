package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * JumpUrlRequest
 */
@Data
public class JumpUrlRequestDto {

    
    @NotBlank(message="userId不能为空")
    @JsonProperty("user_id")
    private String userId;

    
    @NotBlank(message="liveId不能为空")
    @JsonProperty("live_id")
    private String liveId;

    @JsonProperty("user_name")
    private String userName;
}
