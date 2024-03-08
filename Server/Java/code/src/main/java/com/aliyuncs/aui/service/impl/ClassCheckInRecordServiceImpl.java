package com.aliyuncs.aui.service.impl;

import com.aliyuncs.aui.dao.ClassCheckInRecordDao;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.CheckInRequest;
import com.aliyuncs.aui.entity.ClassCheckInRecordEntity;
import com.aliyuncs.aui.service.ClassCheckInRecordService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * ClassCheckInRecordServiceImpl
 *
 * @author chunlei.zcl
 */
@Service("classCheckInRecordService")
@Slf4j
public class ClassCheckInRecordServiceImpl extends ServiceImpl<ClassCheckInRecordDao, ClassCheckInRecordEntity> implements ClassCheckInRecordService {
    @Override
    public InvokeResult checkIn(CheckInRequest checkInRequest) {

        ClassCheckInRecordEntity entity = this.lambdaQuery().eq(ClassCheckInRecordEntity::getCheckInId, checkInRequest.getCheckInId())
                .eq(ClassCheckInRecordEntity::getUserId, checkInRequest.getUserId()).one();
        if (entity != null) {
            return InvokeResult.builder().success(false).reason("AlreadyCheckIn").build();
        }

        ClassCheckInRecordEntity classCheckInRecordEntity = ClassCheckInRecordEntity.builder()
                .createdAt(new Date())
                .updatedAt(new Date())
                .userId(checkInRequest.getUserId())
                .checkInId(checkInRequest.getCheckInId())
                .build();

        boolean result = this.save(classCheckInRecordEntity);
        return InvokeResult.builder().success(result).build();
    }

    @Override
    public List<ClassCheckInRecordEntity> getCheckInRecords(String checkInId) {

        return this.lambdaQuery().eq(ClassCheckInRecordEntity::getCheckInId, checkInId).orderByAsc(ClassCheckInRecordEntity::getCreatedAt).list();
    }

    @Override
    public ClassCheckInRecordEntity getCheckInRecordByUserId(String checkInId, String userId) {

        return this.lambdaQuery().eq(ClassCheckInRecordEntity::getCheckInId, checkInId).eq(ClassCheckInRecordEntity::getUserId, userId).one();
    }

}
