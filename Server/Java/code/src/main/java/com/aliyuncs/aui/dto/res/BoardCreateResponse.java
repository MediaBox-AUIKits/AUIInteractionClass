package com.aliyuncs.aui.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCreateResponse {

    
    private String boardId;

    
    private String boardTitle;

    
    private String cid;

    
    private int uid;

    
    @Builder.Default
    private int code = 200;

    
    private String message;

    
    private String appKey;

}
