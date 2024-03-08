package com.aliyuncs.aui.controller;

import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.ClassCheckInRecordResponse;
import com.aliyuncs.aui.dto.res.ClassCheckInResponse;
import com.aliyuncs.aui.service.ClassCheckInService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/class")
@Slf4j
public class ClassCheckInController {

    @Resource
    private ClassCheckInService classCheckInService;

    /**
     * 设置签到
     */
    @RequestMapping("/setCheckIn")
    public Result setCheckIn(@RequestBody CheckInSetRequest checkInSetRequest) {

        ValidatorUtils.validateEntity(checkInSetRequest);

        try {
            ClassCheckInResponse classCheckInRecordResponse = classCheckInService.setCheckIn(checkInSetRequest);
            if (classCheckInRecordResponse != null) {
                return returnResult(classCheckInRecordResponse);
            }
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
        return Result.notFound();
    }


    /**
     * 查询正在运行的签到
     */
    @RequestMapping("/getRunningCheckIn")
    public Result getRunningCheckIn(@RequestBody CheckInQueryRequest checkInQueryRequest) {

        ValidatorUtils.validateEntity(checkInQueryRequest);
        ClassCheckInResponse classCheckInRecordResponse = classCheckInService.getRunningCheckIn(checkInQueryRequest.getClassId());
        if (classCheckInRecordResponse != null) {
            return returnResult(classCheckInRecordResponse);
        }
        return Result.notFound("NotFound");
    }

    /**
     * 查询课堂所有设置的签到
     */
    @RequestMapping("/getAllCheckIns")
    public Result getAllCheckIns(@RequestBody CheckInQueryRequest checkInQueryRequest) {

        ValidatorUtils.validateEntity(checkInQueryRequest);

        List<ClassCheckInResponse> classCheckInRecordResponses = classCheckInService.getAllCheckIns(checkInQueryRequest.getClassId());
        if (CollectionUtils.isNotEmpty(classCheckInRecordResponses)) {
            return returnResult(classCheckInRecordResponses);
        }
        return Result.notFound("NotFound");
    }

    /**
     * 学生签到
     */
    @RequestMapping("/checkIn")
    public Result checkIn(@RequestBody CheckInRequest checkInRequest) {

        ValidatorUtils.validateEntity(checkInRequest);

        InvokeResult result = classCheckInService.checkIn(checkInRequest);
        if (result.isSuccess()) {
            return Result.ok();
        }
        Result r = new Result();
        r.setSuccess(false);
        Map<String, Object> map = new HashMap<>();
        map.put("reason", result.getReason());
        r.setData(map);
        return r;
    }

    /**
     * 查询某个签到的历史记录
     */
    @RequestMapping("/getCheckInRecords")
    public Result getCheckInRecords(@RequestBody CheckInRecordQueryRequest checkInRecordQueryRequest) {

        ValidatorUtils.validateEntity(checkInRecordQueryRequest);

        List<ClassCheckInRecordResponse> checkInRecords = classCheckInService.getCheckInRecords(checkInRecordQueryRequest.getCheckInId());
        if (CollectionUtils.isNotEmpty(checkInRecords)) {
            return Result.ok(checkInRecords);
        }
        return Result.notFound("NotFound");
    }

    @RequestMapping("/getCheckInRecordByUserId")
    public Result getCheckInRecordByUserId(@RequestBody CheckInRecordByUserIdQueryRequest checkInRecordByUserIdQueryRequest) {

        ValidatorUtils.validateEntity(checkInRecordByUserIdQueryRequest);

        ClassCheckInRecordResponse classCheckInRecordResponse = classCheckInService.getCheckInRecordByUserId(checkInRecordByUserIdQueryRequest.getCheckInId(),
                checkInRecordByUserIdQueryRequest.getUserId());
        if (classCheckInRecordResponse != null) {
            return Result.ok(classCheckInRecordResponse);
        }
        return Result.notFound("NotFound");
    }

    private Result returnResult(Object object) {

        return Result.ok(object);
    }

}
