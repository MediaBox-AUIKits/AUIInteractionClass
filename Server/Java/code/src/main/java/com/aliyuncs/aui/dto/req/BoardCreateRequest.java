package com.aliyuncs.aui.dto.req;


import com.alibaba.fastjson.annotation.JSONField;
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
public class BoardCreateRequest {

    
    @NotBlank(message="channelName不能为空")
    @JSONField(name = "channelName")
    private String channelName;

    
    @NotNull(message="mode不能为空")
    @Builder.Default
    @JSONField(name = "mode")
    private int mode = 2;

    
    @NotNull(message="uid不能为空")
    @JSONField(name = "uid")
    private int uid;

    
    @NotNull(message="persistent不能为空")
    @Builder.Default
    @JSONField(name = "persistent")
    private Boolean persistent = true;

    
    @JSONField(name = "channelDestroyTime")
    private int channelDestroyTime;

    
    @NotNull(message="platform不能为空")
    @JSONField(name = "platform")
    private int platform = 2;

}
