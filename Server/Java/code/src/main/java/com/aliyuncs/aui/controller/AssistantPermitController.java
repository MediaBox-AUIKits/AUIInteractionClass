package com.aliyuncs.aui.controller;

import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.AssistantPermitDto;
import com.aliyuncs.aui.dto.req.AssistantPermitDeleteRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitGetRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitSetRequest;
import com.aliyuncs.aui.service.AssistantPermitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/v1/class")
@Slf4j
public class AssistantPermitController {

    @Resource
    private AssistantPermitService assistantPermitService;

    /* 添加助教权限*/
    @RequestMapping("/setAssistantPermit")
    public Result setAssistantPermit(@RequestBody AssistantPermitSetRequest assistantPermitSetRequest) {
        ValidatorUtils.validateEntity(assistantPermitSetRequest);
        AssistantPermitDto assistantPermitDto = assistantPermitService.setAssistantPermit(assistantPermitSetRequest);
        if (assistantPermitDto != null) {
            return Result.ok(assistantPermitDto);
        }
        return Result.error();
    }

    /* 删除助教权限*/
    @RequestMapping("/deleteAssistantPermit")
    public Result deleteAssistantPermit(@RequestBody AssistantPermitDeleteRequest assistantPermitDeleteRequest) {
        ValidatorUtils.validateEntity(assistantPermitDeleteRequest);
        boolean result = assistantPermitService.deleteAssistantPermit(assistantPermitDeleteRequest);
        return result ? Result.ok() : Result.error();
    }

    @RequestMapping("/getAssistantPermit")
    public Result getAssistantPermit(@RequestBody AssistantPermitGetRequest assistantPermitGetRequest) {
        ValidatorUtils.validateEntity(assistantPermitGetRequest);
        AssistantPermitDto assistantPermitDto = assistantPermitService.getAssistantPermit(assistantPermitGetRequest);
        if (assistantPermitDto != null) {
            return Result.ok(assistantPermitDto);
        }
        return Result.ok();
    }

}
