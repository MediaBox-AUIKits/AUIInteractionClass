package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 获取房间信息
 */
@Data
@ApiModel(value = "获取房间信息")
public class RoomGetRequestDto {
    @ApiModelProperty(value = "课堂Id")
    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("id")
    private String id;

    @ApiModelProperty(value = "UserId")
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
