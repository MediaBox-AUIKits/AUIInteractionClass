package com.aliyuncs.aui.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocsInfo {

    
    @NotBlank(message="文档id")
    private String docId;

    
    @NotBlank(message="serverType")
    private String serverType;

    
    @NotBlank(message="data")
    @JsonProperty("data")
    private String docInfos;
}
