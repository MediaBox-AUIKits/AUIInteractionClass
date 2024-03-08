package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.CheckInRequest;
import com.aliyuncs.aui.entity.ClassCheckInRecordEntity;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 *  签到记录服务
 */
public interface ClassCheckInRecordService extends IService<ClassCheckInRecordEntity> {


    InvokeResult checkIn(CheckInRequest checkInRequest);

    List<ClassCheckInRecordEntity> getCheckInRecords(String classId);

    ClassCheckInRecordEntity getCheckInRecordByUserId(String checkInId, String userId);
}

