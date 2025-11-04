package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 踢出课堂
 */
@Data
public class kickClassRequestDto {

    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("class_id")
    private String classId;

    @NotBlank(message="UserId不能为空")
    @Length(min = 2,max = 255)
    @JsonProperty("user_id")
    private String userId;

    
    @JsonProperty("im_server")
    private List<String> imServer;
}
