package com.aliyuncs.aui.dto.res;

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
    
    private String nonce;

    
    private int curTime;

    
    private String checksum;

}
