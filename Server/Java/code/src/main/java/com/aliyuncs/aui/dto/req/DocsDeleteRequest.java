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
@ApiModel(value = "文档删除请求参数")
public class DocsDeleteRequest {

    @ApiModelProperty(value = "课堂id")
    @NotBlank(message="课堂id")
    private String classId;

    @ApiModelProperty(value = "文档id")
    @NotBlank(message="文档id")
    private String docIds;

}
