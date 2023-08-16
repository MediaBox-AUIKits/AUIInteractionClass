package com.aliyuncs.aui.dto.req;


import com.alibaba.fastjson.annotation.JSONField;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "创建白板请求参数")
public class BoardCreateRequest {

    @ApiModelProperty(value = "房间名称")
    @NotBlank(message="channelName不能为空")
    @JSONField(name = "channelName")
    private String channelName;

    @ApiModelProperty(value = "固定为 2")
    @NotNull(message="mode不能为空")
    @Builder.Default
    @JSONField(name = "mode")
    private int mode = 2;

    @ApiModelProperty(value = "房间创建者的用户 ID，是您的业务系统中的实际用户 ID。")
    @NotNull(message="uid不能为空")
    @JSONField(name = "uid")
    private int uid;

    @ApiModelProperty(value = "是否开启房间持久化")
    @NotNull(message="persistent不能为空")
    @Builder.Default
    @JSONField(name = "persistent")
    private Boolean persistent = true;

    @ApiModelProperty(value = "房间关闭的Unix时间戳，精确到秒，仅对白板房间有效。以创建房间的时间开始，到关闭房间的时间，最长为30个自然日")
    @JSONField(name = "channelDestroyTime")
    private int channelDestroyTime;

    @ApiModelProperty(value = "房间类型。 0：RTC 房间  2：白板房间")
    @NotNull(message="platform不能为空")
    @JSONField(name = "platform")
    private int platform = 2;

}
