package com.aliyuncs.aui.service.impl;

import com.aliyuncs.aui.dao.AssistantPermitDao;
import com.aliyuncs.aui.dto.AssistantPermitDto;
import com.aliyuncs.aui.dto.req.AssistantPermitDeleteRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitGetRequest;
import com.aliyuncs.aui.dto.req.AssistantPermitSetRequest;
import com.aliyuncs.aui.entity.AssistantPermitEntity;
import com.aliyuncs.aui.entity.ClassInfoEntity;
import com.aliyuncs.aui.service.AssistantPermitService;
import com.aliyuncs.aui.service.ClassInfoService;
import com.aliyuncs.aui.service.ClassMemberService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;

@Service("AssistantPermitService")
@Slf4j
public class AssistantPermitServiceImpl extends ServiceImpl<AssistantPermitDao, AssistantPermitEntity> implements AssistantPermitService {

    @Resource
    private ClassInfoService roomInfoService;

    @Resource
    @Lazy
    private ClassMemberService classMemberService;

    @Override
    public AssistantPermitDto setAssistantPermit(AssistantPermitSetRequest assistantPermitSetRequest) {

        ClassInfoEntity classInfoEntity = roomInfoService.getClassInfoEntity(assistantPermitSetRequest.getClassId());
        if (classInfoEntity == null) {
            log.warn("classInfoEntity not found. classId:{}", assistantPermitSetRequest.getClassId());
            return null;
        }

        AssistantPermitEntity assistantPermitEntity = getAssistantPermitEntity(assistantPermitSetRequest.getClassId());
        if (assistantPermitEntity == null) {
            assistantPermitEntity = AssistantPermitEntity.builder()
                    .classId(assistantPermitSetRequest.getClassId())
                    .permit(assistantPermitSetRequest.getPermit())
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();
            this.save(assistantPermitEntity);
        } else {
            assistantPermitEntity.setPermit(assistantPermitSetRequest.getPermit());
            assistantPermitEntity.setUpdatedAt(new Date());
            this.lambdaUpdate()
                    .eq(AssistantPermitEntity::getClassId, assistantPermitSetRequest.getClassId())
                    .update(assistantPermitEntity);
        }
        return getAssistantPermit(AssistantPermitGetRequest.builder().classId(assistantPermitSetRequest.getClassId()).build());
    }

    @Override
    public AssistantPermitDto getAssistantPermit(AssistantPermitGetRequest assistantPermitGetRequest) {

        AssistantPermitEntity assistantPermitEntity = getAssistantPermitEntity(assistantPermitGetRequest.getClassId());
        if (assistantPermitEntity == null) {
            log.warn("assistantPermitEntity is null. classId:{}", assistantPermitGetRequest.getClassId());
            return null;
        }
        return AssistantPermitDto.builder()
                .classId(assistantPermitGetRequest.getClassId())
                .permit(assistantPermitEntity.getPermit())
                .createdAt(assistantPermitEntity.getCreatedAt())
                .updatedAt(assistantPermitEntity.getUpdatedAt())
                .build();
    }

    @Override
    public boolean deleteAssistantPermit(AssistantPermitDeleteRequest assistantPermitDeleteRequest) {

        QueryWrapper<AssistantPermitEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.lambda().eq(AssistantPermitEntity::getClassId, assistantPermitDeleteRequest.getClassId());
        this.remove(queryWrapper);

        classMemberService.deleteAssistantClass(assistantPermitDeleteRequest.getClassId());

        return true;
    }

    private AssistantPermitEntity getAssistantPermitEntity(String classId) {

        QueryWrapper<AssistantPermitEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.lambda().eq(AssistantPermitEntity::getClassId, classId);
        return this.getOne(queryWrapper);
    }

}
