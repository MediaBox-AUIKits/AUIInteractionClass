package com.aliyuncs.aui.dto.res;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocsDeleteResponse {

    
    @NotBlank(message="课堂id")
    private String classId;

    
    @NotBlank(message="文档id")
    private String docId;
}
