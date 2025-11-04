package com.aliyuncs.aui.dto.req;


import com.aliyuncs.aui.dto.DocsInfo;
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
public class DocsAddRequest {

    
    @NotBlank(message="课堂id")
    private String classId;

    
    @NotBlank(message="文档id")
    private List<DocsInfo> docInfo;
}
