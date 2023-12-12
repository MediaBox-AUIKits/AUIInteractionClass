package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.AssistantPermitDto;
import com.aliyuncs.aui.dto.req.AssistantPermitDeleteRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitGetRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitSetRequest;

/**
 *  助教权限管理服务
 */
public interface AssistantPermitService {

    AssistantPermitDto setAssistantPermit(AssistantPermitSetRequest assistantPermitSetRequest);

    AssistantPermitDto getAssistantPermit(AssistantPermitGetRequest assistantPermitGetRequest);

    boolean deleteAssistantPermit(AssistantPermitDeleteRequest assistantPermitDeleteRequest);
}
