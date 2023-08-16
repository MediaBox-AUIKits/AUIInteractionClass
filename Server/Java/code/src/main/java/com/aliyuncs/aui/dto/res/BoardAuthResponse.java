package com.aliyuncs.aui.dto.res;

import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardAuthResponse {
    /*
    *         String Nonce = UUID.randomUUID().toString().replaceAll("-", "");
        String CurTime = String.valueOf((int)(System.currentTimeMillis() / 1000));
        String CheckSum = getCheckSum(APP_SECRET, Nonce, CurTime);
    * */
    @ApiModelProperty(value = "随机数")
    private String nonce;

    @ApiModelProperty(value = "时间戳")
    private int curTime;

    @ApiModelProperty(value = "服务器认证需要")
    private String checksum;

}
