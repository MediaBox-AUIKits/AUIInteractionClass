package com.aliyuncs.aui.dto.res;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ClassCheckInRecordResponse
 *
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassCheckInRecordResponse {

    @JsonProperty("user_id")
    private String userId;

    @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss",timezone = "GMT+8")
    private Date time;

    @JsonProperty("check_in_id")
    private String checkInId;

    @JsonProperty("class_id")
    private String classId;

}
