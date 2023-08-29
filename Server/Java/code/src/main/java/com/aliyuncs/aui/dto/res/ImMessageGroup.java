package com.aliyuncs.aui.dto.res;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImMessageGroup {

    private String aLiYunGroupId;

    private String rongCloudGroupId;
}
