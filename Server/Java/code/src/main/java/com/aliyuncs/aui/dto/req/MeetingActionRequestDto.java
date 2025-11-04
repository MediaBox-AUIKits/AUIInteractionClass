package com.aliyuncs.aui.dto.req;

import com.aliyuncs.aui.dto.MeetingMemberInfo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 修改连麦信息
 */
@Data
public class MeetingActionRequestDto {
    
    @NotBlank(message="直播间Id不能为空")
    private String id;

    
    @JsonProperty("members")
    private List<MeetingMemberInfo> members;

    
    @JsonProperty("all_mute")
    private Boolean allMute;

    
    @JsonProperty("interaction_allowed")
    private Boolean interactionAllowed;

}
