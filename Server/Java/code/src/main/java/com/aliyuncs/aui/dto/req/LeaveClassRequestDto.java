package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 离开课堂
 */
@Data
public class LeaveClassRequestDto {

    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("class_id")
    private String classId;

    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
