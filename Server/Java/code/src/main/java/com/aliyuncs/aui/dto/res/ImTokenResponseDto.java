package com.aliyuncs.aui.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ImTokenResponseDto
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImTokenResponseDto {

    private String aLiYunAccessToken;

    private String aLiYunRefreshToken;
}
