package com.aliyuncs.aui.dto.res;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ClassCheckInResponse
 *
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassCheckInResponse {

    @JsonProperty("id")
    private String id;

    @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss",timezone = "GMT+8")
    @JsonProperty("start_time")
    private Date startTime;

    @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss",timezone = "GMT+8")
    @JsonProperty("now_time")
    private Date nowTime;

    @JsonProperty("duration")
    private Integer duration;


}
