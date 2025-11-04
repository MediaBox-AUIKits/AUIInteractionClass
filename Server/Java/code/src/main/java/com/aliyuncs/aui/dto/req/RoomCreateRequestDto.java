package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class RoomCreateRequestDto {
    
    @NotBlank(message="title不能为空")
    private String title;

    
    @NotBlank(message="teacher_id不能为空")
    @JsonProperty("teacher_id")
    private String teacherId;

    
    @JsonProperty("teacher_nick")
    private String teacherNick;

    
    @NotNull(message="mode不能为空")
    @Builder.Default
    private Long mode = 0L;

    
    @JsonProperty("extends")
    private String extendsInfo;

    
    @JsonProperty("im_server")
    private List<String> imServer;
}
