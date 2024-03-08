package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.aui.dao.ClassCheckInDao;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.CheckInRequest;
import com.aliyuncs.aui.dto.req.CheckInSetRequest;
import com.aliyuncs.aui.dto.res.ClassCheckInRecordResponse;
import com.aliyuncs.aui.dto.res.ClassCheckInResponse;
import com.aliyuncs.aui.entity.ClassCheckInEntity;
import com.aliyuncs.aui.entity.ClassCheckInRecordEntity;
import com.aliyuncs.aui.service.ClassCheckInRecordService;
import com.aliyuncs.aui.service.ClassCheckInService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * ClassCheckInServiceImpl
 *
 * @author chunlei.zcl
 */
@Service("classCheckInService")
@Slf4j
public class ClassCheckInServiceImpl extends ServiceImpl<ClassCheckInDao, ClassCheckInEntity> implements ClassCheckInService {

    @Resource
    private ClassCheckInRecordService classCheckInRecordService;
    @Override
    public ClassCheckInResponse setCheckIn(CheckInSetRequest checkInSetRequest) {

        ClassCheckInResponse runningCheckIn = getRunningCheckIn(checkInSetRequest.getClassId());
        if (runningCheckIn != null) {
            log.warn("runningCheckIn:{}, AlreadyCheckIn", JSONObject.toJSONString(runningCheckIn));
            throw new RuntimeException("AlreadyCheckIn");
        }

        ClassCheckInEntity classCheckInEntity = ClassCheckInEntity.builder()
                .id(UUID.randomUUID().toString().replaceAll("-", ""))
                .classId(checkInSetRequest.getClassId())
                .createdAt(new Date())
                .updatedAt(new Date())
                .title("")
                .creator(checkInSetRequest.getUserId())
                .startTime(new Date())
                .duration(checkInSetRequest.getDuration())
                .build();

        this.save(classCheckInEntity);

        return convert2ClassCheckInResponse(classCheckInEntity);
    }

    @Override
    public ClassCheckInResponse getRunningCheckIn(String classId) {

        ClassCheckInEntity runningCheckIn  = null;
        List<ClassCheckInEntity> classCheckInEntities = this.lambdaQuery().eq(ClassCheckInEntity::getClassId, classId).list();
        if (CollectionUtils.isNotEmpty(classCheckInEntities)) {
            for (ClassCheckInEntity classCheckInEntity : classCheckInEntities) {
                if (classCheckInEntity.isRunning(new Date())) {
                    runningCheckIn = classCheckInEntity;
                    break;
                }
            }
        }

        if (runningCheckIn != null) {
            return convert2ClassCheckInResponse(runningCheckIn);
        }
        return null;
    }

    @Override
    public InvokeResult checkIn(CheckInRequest checkInRequest) {

        ClassCheckInEntity classCheckInEntity = this.getById(checkInRequest.getCheckInId());
        if (classCheckInEntity == null) {
            return InvokeResult.builder().success(false).reason("NotFound").build();
        }
        return classCheckInRecordService.checkIn(checkInRequest);
    }

    @Override
    public List<ClassCheckInResponse> getAllCheckIns(String classId) {

        List<ClassCheckInResponse> responseList = new ArrayList<>();
        List<ClassCheckInEntity> classCheckInEntities = this.lambdaQuery().eq(ClassCheckInEntity::getClassId, classId)
                .orderByAsc(ClassCheckInEntity::getStartTime).list();
        if (CollectionUtils.isNotEmpty(classCheckInEntities)) {
            for (ClassCheckInEntity classCheckInEntity : classCheckInEntities) {
                responseList.add(convert2ClassCheckInResponse(classCheckInEntity));
            }
        }
        return responseList;
    }

    @Override
    public List<ClassCheckInRecordResponse> getCheckInRecords(String checkInId) {

        List<ClassCheckInRecordResponse> responseList = new ArrayList<>();
        ClassCheckInEntity classCheckInEntity = this.getById(checkInId);
        if (classCheckInEntity == null) {
            return responseList;
        }

        List<ClassCheckInRecordEntity> allCheckIns = classCheckInRecordService.getCheckInRecords(checkInId);
        if (CollectionUtils.isEmpty(allCheckIns)) {
            return responseList;
        }

        for (ClassCheckInRecordEntity classCheckInRecordEntity : allCheckIns) {
            responseList.add(convert2ClassCheckInRecordResponse(classCheckInRecordEntity, classCheckInEntity.getClassId()));
        }

        return responseList;
    }

    @Override
    public ClassCheckInRecordResponse getCheckInRecordByUserId(String checkInId, String userId) {

        ClassCheckInEntity classCheckInEntity = this.getById(checkInId);
        if (classCheckInEntity == null) {
            log.warn("classCheckInEntity is null. checkInId:{}", checkInId);
            return null;
        }

        ClassCheckInRecordEntity classCheckInRecordEntity = classCheckInRecordService.getCheckInRecordByUserId(checkInId, userId);
        if (classCheckInRecordEntity == null) {
            log.warn("classCheckInRecordEntity is null. checkInId:{}, userId:{}", checkInId, userId);
            return null;
        }
        return convert2ClassCheckInRecordResponse(classCheckInRecordEntity, classCheckInEntity.getClassId());
    }

    private ClassCheckInResponse convert2ClassCheckInResponse(ClassCheckInEntity classCheckInEntity) {

        return ClassCheckInResponse.builder()
                .id(classCheckInEntity.getId())
                .startTime(classCheckInEntity.getStartTime())
                .nowTime(new Date())
                .duration(classCheckInEntity.getDuration())
                .build();
    }

    private ClassCheckInRecordResponse convert2ClassCheckInRecordResponse(ClassCheckInRecordEntity classCheckInRecordEntity, String classId) {

        return ClassCheckInRecordResponse.builder()
                .userId(classCheckInRecordEntity.getUserId())
                .time(classCheckInRecordEntity.getCreatedAt())
                .checkInId(classCheckInRecordEntity.getCheckInId())
                .classId(classId)
                .build();
    }
}
