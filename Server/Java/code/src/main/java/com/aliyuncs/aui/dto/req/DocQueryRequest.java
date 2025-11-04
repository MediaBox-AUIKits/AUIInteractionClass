package com.aliyuncs.aui.dto.req;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocQueryRequest {

    
    @NotBlank(message="课堂id")
    private String classId;

}
