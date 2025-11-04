package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 获取房间信息
 */
@Data
public class RoomGetRequestDto {
    
    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("id")
    private String id;

    
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
