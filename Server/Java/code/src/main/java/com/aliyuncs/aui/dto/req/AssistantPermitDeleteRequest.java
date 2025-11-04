package com.aliyuncs.aui.dto.req;


import com.fasterxml.jackson.annotation.JsonProperty;
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
public class AssistantPermitDeleteRequest {

    
    @NotBlank(message="课堂id")
    @JsonProperty("class_id")
    private String classId;

    
    @JsonProperty("im_server")
    private List<String> imServer;

}
