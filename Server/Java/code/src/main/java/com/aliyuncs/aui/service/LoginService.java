package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.req.LoginRequestDto;

/**
 * 管理服务。说明：业务侧可自行实现
 *
 */
public interface LoginService  {

    boolean login(LoginRequestDto loginRequestDto);
}

