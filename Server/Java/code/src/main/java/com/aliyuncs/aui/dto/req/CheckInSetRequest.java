package com.aliyuncs.aui.dto.req;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInSetRequest {

    @NotEmpty(message="课堂id")
    @JsonProperty("class_id")
    private String classId;

    @JsonProperty("user_id")
    @NotEmpty(message="userId")
    private String userId;

    @NotNull(message="duration")
    private Integer duration;
}
