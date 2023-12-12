package com.aliyuncs.aui.dto.req;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "助教权限设置")
public class AssistantPermitSetRequest {

    @ApiModelProperty(value = "课堂id")
    @NotBlank(message="课堂id")
    @JsonProperty("class_id")
    private String classId;

    @ApiModelProperty(value = "权限信息")
    @NotBlank(message="权限信息")
    private String permit;

}
