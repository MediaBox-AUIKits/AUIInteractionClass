package com.aliyuncs.aui.dto.res;

import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCreateResponse {

    @ApiModelProperty(value = "白板id")
    private String boardId;

    @ApiModelProperty(value = "白板标题")
    private String boardTitle;

    @ApiModelProperty(value = "cid")
    private String cid;

    @ApiModelProperty(value = "uid")
    private int uid;

    @ApiModelProperty(value = "状态码")
    @Builder.Default
    private int code = 200;

    @ApiModelProperty(value = "当返回结果的状态码不为200时，包含的错误信息")
    private String message;

    @ApiModelProperty(value = "当返回结果的状态码不为200时，包含的错误信息")
    private String appKey;

}
