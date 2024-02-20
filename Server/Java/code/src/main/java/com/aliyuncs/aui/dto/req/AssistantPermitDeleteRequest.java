package com.aliyuncs.aui.dto.req;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "助教权限删除")
public class AssistantPermitDeleteRequest {

    @ApiModelProperty(value = "课堂id")
    @NotBlank(message="课堂id")
    @JsonProperty("class_id")
    private String classId;

    @ApiModelProperty(value = "im群列表")
    @JsonProperty("im_server")
    private List<String> imServer;

}
