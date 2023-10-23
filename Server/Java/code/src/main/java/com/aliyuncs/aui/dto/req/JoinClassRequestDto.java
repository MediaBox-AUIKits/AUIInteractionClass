package com.aliyuncs.aui.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotBlank;

/**
 * 加入课堂
 */
@Data
public class JoinClassRequestDto {

    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("class_id")
    private String classId;

    @NotBlank(message="userId不能为空")
    @Length(min = 2,max = 255)
    @JsonProperty("user_id")
    private String userId;

    @NotBlank(message="userName不能为空")
    @Length(min = 2,max = 255)
    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_avatar")
    private String userAvatar;

    //@NotNull(message="identity不能为空")
    //@JsonProperty("identity")
    //private Integer identity;
    //
    //public boolean valid() {
    //    if (Identity.of(identity) == null) {
    //        return false;
    //    }
    //    return true;
    //}

}
