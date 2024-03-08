package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.CheckInRequest;
import com.aliyuncs.aui.dto.req.CheckInSetRequest;
import com.aliyuncs.aui.dto.res.ClassCheckInRecordResponse;
import com.aliyuncs.aui.dto.res.ClassCheckInResponse;
import com.aliyuncs.aui.entity.ClassCheckInEntity;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 *  签到服务
 */
public interface ClassCheckInService extends IService<ClassCheckInEntity> {

    ClassCheckInResponse setCheckIn(CheckInSetRequest checkInSetRequest);

    ClassCheckInResponse getRunningCheckIn(String classId);

    InvokeResult checkIn(CheckInRequest checkInRequest);

    List<ClassCheckInResponse> getAllCheckIns(String classId);

    List<ClassCheckInRecordResponse> getCheckInRecords(String checkInId);

    ClassCheckInRecordResponse getCheckInRecordByUserId(String checkInId, String userId);
}

