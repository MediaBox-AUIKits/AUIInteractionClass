package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 创建直播间请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "创建直播间请求参数")
public class RoomCreateRequestDto {
    @ApiModelProperty(value = "直播标题")
    @NotBlank(message="title不能为空")
    private String title;

    @ApiModelProperty(value = "主播userId")
    @NotBlank(message="teacher_id不能为空")
    @JsonProperty("teacher_id")
    private String teacherId;

    @ApiModelProperty(value = "主播nick")
    @JsonProperty("teacher_nick")
    private String teacherNick;

    @ApiModelProperty(value = "模式，默认0 普通直播，1 连麦直播")
    @NotNull(message="mode不能为空")
    @Builder.Default
    private Long mode = 0L;

    @ApiModelProperty(value = "扩展字段, json格式")
    @JsonProperty("extends")
    private String extendsInfo;

    @ApiModelProperty(value = "im群列表")
    @JsonProperty("im_server")
    private List<String> imServer;
}
