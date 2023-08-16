package com.aliyuncs.aui.dto.req;


import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "文档查询请求参数")
public class DocQueryRequest {

    @ApiModelProperty(value = "课堂id")
    @NotBlank(message="课堂id")
    private String classId;

}
