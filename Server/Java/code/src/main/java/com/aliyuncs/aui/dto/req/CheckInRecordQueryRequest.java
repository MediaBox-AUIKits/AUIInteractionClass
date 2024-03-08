package com.aliyuncs.aui.dto.req;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRecordQueryRequest {

    @NotEmpty(message="签到id")
    @JsonProperty("check_in_id")
    private String checkInId;
}
