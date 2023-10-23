package com.aliyuncs.aui.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 执行结果封装
 *
 * @author chunlei.zcl
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvokeResult {

    private boolean success;

    private String reason;

}
