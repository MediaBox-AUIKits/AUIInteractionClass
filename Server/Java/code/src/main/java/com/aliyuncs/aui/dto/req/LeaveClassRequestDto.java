package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * 离开课堂
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveClassRequestDto {

    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("class_id")
    private String classId;

    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
