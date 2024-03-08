package com.aliyuncs.aui.dto.req;

import com.aliyuncs.aui.dto.enums.ClassMemberStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 获取课堂成员列表
 */
@Data
public class ClassMemberListRequestDto {

    @NotBlank(message="课堂Id不能为空")
    @JsonProperty("class_id")
    private String classId;

    @JsonProperty("identity")
    private Integer identity;

    @NotNull(message="status不能为空")
    @JsonProperty("status")
    private Integer status;

    @JsonProperty("page_num")
    private Integer pageNum = 1;

    @JsonProperty("page_size")
    private Integer pageSize = 20;


    public boolean valid() {

        if (ClassMemberStatus.of(status) == null) {
            return false;
        }

        return true;
    }


}
