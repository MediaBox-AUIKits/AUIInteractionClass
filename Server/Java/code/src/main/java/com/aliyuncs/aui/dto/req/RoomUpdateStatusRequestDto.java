package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 修改房间状态信息
 */
@Data
@ApiModel(value = "修改房间状态信息")
public class RoomUpdateStatusRequestDto {
    @ApiModelProperty(value = "直播间Id")
    @NotBlank(message="直播间Id不能为空")
    private String id;

    @ApiModelProperty(value = "UserId")
    @NotBlank(message="UserId不能为空")
    @JsonProperty("user_id")
    private String userId;

}
