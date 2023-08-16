package com.aliyuncs.aui.dto.res;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocResponse {

    @ApiModelProperty(value = "课堂id")
    private String classId;

    @ApiModelProperty(value = "文档id")
    private String docId;

    @ApiModelProperty(value = "serverType")
    private String serverType;

    @ApiModelProperty(value = "文档信息")
    private String docInfos;

    // 创建时间
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date updatedAt;

    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date createdAt;
}
