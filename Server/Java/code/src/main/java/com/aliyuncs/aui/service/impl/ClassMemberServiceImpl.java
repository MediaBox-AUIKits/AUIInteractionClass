package com.aliyuncs.aui.service.impl;

import com.aliyuncs.aui.common.Constants;
import com.aliyuncs.aui.dao.ClassMemberDao;
import com.aliyuncs.aui.dto.AssistantPermitDto;
import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.enums.ClassMemberStatus;
import com.aliyuncs.aui.dto.enums.Identity;
import com.aliyuncs.aui.dto.enums.MessageType;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.ClassMemberListDto;
import com.aliyuncs.aui.entity.ClassInfoEntity;
import com.aliyuncs.aui.entity.ClassKickMemberEntity;
import com.aliyuncs.aui.entity.ClassMemberEntity;
import com.aliyuncs.aui.service.*;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;


/**
 * 课堂成员服务实现类
 */
@Service("classMemberService")
@Slf4j
public class ClassMemberServiceImpl extends ServiceImpl<ClassMemberDao, ClassMemberEntity> implements ClassMemberService {

    @Resource
    private ClassInfoService classInfoService;
    @Resource
    private ClassKickMemberService classKickMemberService;
    @Resource
    private ALiYunService videoCloudService;
    @Resource
    private AssistantPermitService assistantPermitService;

    @Override
    public InvokeResult joinClass(JoinClassRequestDto joinClassRequestDto) {

        ClassInfoEntity classInfoEntity = classInfoService.getClassInfoEntity(joinClassRequestDto.getClassId());

        if (classInfoEntity == null) {
            log.warn("classId:{} is not found.", joinClassRequestDto.getClassId());
            return InvokeResult.builder().success(false).reason("ClassNotFound").build();
        }

        ClassKickMemberEntity classKickMemberEntity = classKickMemberService.get(joinClassRequestDto.getClassId(), joinClassRequestDto.getUserId());
        if (classKickMemberEntity != null) {
            log.warn("userId:{} is in kick list.", joinClassRequestDto.getUserId());
            return InvokeResult.builder().success(false).reason("InBlackList").build();
        }

        Long pk = null;
        ClassMemberDto entity = getClassMemberDto(joinClassRequestDto.getClassId(), joinClassRequestDto.getUserId());
        if (entity != null) {
            if (entity.getStatus() == ClassMemberStatus.Normal.getVal()) {
                log.info("userId:{} is in class:{}", joinClassRequestDto.getUserId(), joinClassRequestDto.getClassId());
                return InvokeResult.builder().success(true).build();
            }

            pk = entity.getId();
        }

        ClassMemberEntity classMemberEntity = ClassMemberEntity.builder()
                .id(pk)
                .classId(joinClassRequestDto.getClassId())
                .userId(joinClassRequestDto.getUserId())
                .userName(joinClassRequestDto.getUserName())
                .userAvatar(joinClassRequestDto.getUserAvatar())
                .identity(getIdentity(classInfoEntity.getTeacherId(), joinClassRequestDto.getUserId(), joinClassRequestDto.getIdentity()))
                .status(ClassMemberStatus.Normal.getVal())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        if (classMemberEntity.getIdentity() == Identity.Assistant.getVal()) {

            AssistantPermitDto assistantPermit = assistantPermitService.getAssistantPermit(AssistantPermitGetRequest.builder().classId(joinClassRequestDto.getClassId()).build());
            if (assistantPermit == null) {
                log.warn("classId:{} is not assistant permit.", joinClassRequestDto.getClassId());
                return InvokeResult.builder().success(false).reason("ClassNotAssistantPermit").build();
            }

            // 一个课堂只允许一个在线的助教
            ClassMemberDto classMemberDto = getAssistantClassMemberDto(joinClassRequestDto.getClassId());
            if (classMemberDto != null && !classMemberDto.getUserId().equals(joinClassRequestDto.getUserId())) {
                log.warn("The classId:{} had a assistant.", joinClassRequestDto.getClassId());
                return InvokeResult.builder().success(false).reason("ClassHasAssistant").build();
            }
        }

        boolean result = this.saveOrUpdate(classMemberEntity);

        if (result) {
            ClassMemberDto classMemberDto = getClassMemberDto(joinClassRequestDto.getClassId(), joinClassRequestDto.getUserId());
            videoCloudService.sendMessageToGroup(classInfoEntity.getAliyunId(), MessageType.Join.getVal(), classMemberDto);
        }
        return InvokeResult.builder().success(result).build();
    }

    private Integer getIdentity(String teacherId, String userId, Integer identity) {

        if (StringUtils.isNotEmpty(teacherId) && StringUtils.isNotEmpty(userId)) {
            if (teacherId.equals(userId)) {
                return Identity.Teacher.getVal();
            }

            if (identity != null && identity == Identity.Assistant.getVal()) {
                return Identity.Assistant.getVal();
            }
        }
        return Identity.Student.getVal();
    }

    @Override
    public InvokeResult leaveClass(LeaveClassRequestDto leaveClassRequestDto) {

        String groupId = getGroupId(leaveClassRequestDto.getClassId());
        if (StringUtils.isEmpty(groupId)) {
            log.warn("classId:{} is not found.", leaveClassRequestDto.getClassId());
            return InvokeResult.builder().success(false).reason("ClassNotFound").build();
        }

        ClassMemberDto entity = getClassMemberDto(leaveClassRequestDto.getClassId(), leaveClassRequestDto.getUserId());
        if (entity == null || entity.getStatus() != ClassMemberStatus.Normal.getVal()) {
            log.info("userId:{} is not in class:{}", leaveClassRequestDto.getUserId(), leaveClassRequestDto.getClassId());
            return InvokeResult.builder().success(false).reason("NotInClass").build();
        }

        ClassMemberEntity classMemberEntity = ClassMemberEntity.builder()
                .status(ClassMemberStatus.Exit.getVal())
                .updatedAt(new Date())
                .build();
        boolean result = this.lambdaUpdate()
                .eq(ClassMemberEntity::getClassId, leaveClassRequestDto.getClassId())
                .eq(ClassMemberEntity::getUserId, leaveClassRequestDto.getUserId())
                .update(classMemberEntity);

        if (result) {
            ClassMemberDto classMemberDto = getClassMemberDto(leaveClassRequestDto.getClassId(), leaveClassRequestDto.getUserId());
            videoCloudService.sendMessageToGroup(groupId, MessageType.Exit.getVal(), classMemberDto);
        }

        return InvokeResult.builder().success(true).build();
    }

    @Override
    public InvokeResult deleteAssistantClass(AssistantPermitDeleteRequest assistantPermitDeleteRequest) {

        String groupId = getGroupId(assistantPermitDeleteRequest.getClassId());
        if (StringUtils.isEmpty(groupId)) {
            log.warn("classId:{} is not found.", assistantPermitDeleteRequest.getClassId());
            return InvokeResult.builder().success(false).reason("ClassNotFound").build();
        }

        ClassMemberDto assistantClassMemberDto = getAssistantClassMemberDto(assistantPermitDeleteRequest.getClassId());
        if (assistantClassMemberDto != null) {
            if (assistantClassMemberDto.getStatus() == ClassMemberStatus.Normal.getVal()) {
                log.info("deleteAssistantClass imServer:{}, classId: {}", assistantPermitDeleteRequest.getImServer(), assistantClassMemberDto.getClassId());

                if (CollectionUtils.isEmpty(assistantPermitDeleteRequest.getImServer()) || assistantPermitDeleteRequest.getImServer().contains(Constants.IM_OLD)) {
                    boolean b = videoCloudService.sendMessageToGroup(groupId, MessageType.Exit.getVal(), assistantClassMemberDto);
                    log.info("leave assistant. classId:{}, userId:{}, sendMsg result:{}", assistantClassMemberDto.getClassId(), assistantClassMemberDto.getUserId(), b);
                }
                if (CollectionUtils.isNotEmpty(assistantPermitDeleteRequest.getImServer()) && assistantPermitDeleteRequest.getImServer().contains(Constants.IM_NEW)) {
                    boolean b = videoCloudService.sendMessageToNewGroup(groupId, MessageType.Exit.getVal(), assistantClassMemberDto);
                    log.info("leave assistant. classId:{}, userId:{}, sendMsg result:{}", assistantClassMemberDto.getClassId(), assistantClassMemberDto.getUserId(), b);
                }
            } else {
                log.info("leave assistant. classId:{}, userId:{}, status:{}, so not sendMsg", assistantClassMemberDto.getClassId(), assistantClassMemberDto.getUserId(),
                        assistantClassMemberDto.getStatus());
            }
            this.removeById(assistantClassMemberDto.getId());
        }
        return InvokeResult.builder().success(true).build();
    }

    @Override
    public InvokeResult kickClass(kickClassRequestDto kickClassRequestDto) {

        String groupId = getGroupId(kickClassRequestDto.getClassId());
        if (StringUtils.isEmpty(groupId)) {
            log.warn("classId:{} is not found.", kickClassRequestDto.getClassId());
            return InvokeResult.builder().success(false).reason("ClassNotFound").build();
        }

        boolean result = classKickMemberService.save(kickClassRequestDto);
        if (!result) {
            return InvokeResult.builder().success(false).reason("DBException").build();
        }

        LeaveClassRequestDto leaveClassRequestDto = new LeaveClassRequestDto();
        leaveClassRequestDto.setClassId(kickClassRequestDto.getClassId());
        leaveClassRequestDto.setUserId(kickClassRequestDto.getUserId());

        ClassMemberEntity classMemberEntity = ClassMemberEntity.builder()
                .status(ClassMemberStatus.Kick.getVal())
                .updatedAt(new Date())
                .build();
        boolean kickResult = this.lambdaUpdate()
                .eq(ClassMemberEntity::getClassId, leaveClassRequestDto.getClassId())
                .eq(ClassMemberEntity::getUserId, leaveClassRequestDto.getUserId())
                .update(classMemberEntity);

        log.info("kickResult:{}, imServer:{}, classId: {}", kickResult, kickClassRequestDto.getImServer(), kickClassRequestDto.getClassId());
        if (kickResult) {
            if (CollectionUtils.isEmpty(kickClassRequestDto.getImServer()) || kickClassRequestDto.getImServer().contains(Constants.IM_OLD)) {
                ClassMemberDto classMemberDto = getClassMemberDto(kickClassRequestDto.getClassId(), kickClassRequestDto.getUserId());
                videoCloudService.sendMessageToGroup(groupId, MessageType.Kick.getVal(), classMemberDto);
            }

            if (CollectionUtils.isNotEmpty(kickClassRequestDto.getImServer()) && kickClassRequestDto.getImServer().contains(Constants.IM_NEW)) {
                ClassMemberDto classMemberDto = getClassMemberDto(kickClassRequestDto.getClassId(), kickClassRequestDto.getUserId());
                videoCloudService.sendMessageToNewGroup(groupId, MessageType.Kick.getVal(), classMemberDto);
            }

        }
        return InvokeResult.builder().success(true).build();
    }

    @Override
    public ClassMemberListDto listMembers(ClassMemberListRequestDto classMemberListRequestDto) {

        String groupId = getGroupId(classMemberListRequestDto.getClassId());
        if (StringUtils.isEmpty(groupId)) {
            log.warn("classId:{} is not found.", classMemberListRequestDto.getClassId());
            return null;
        }

        QueryWrapper<ClassMemberEntity> queryWrapper = new QueryWrapper<>();
        LambdaQueryWrapper<ClassMemberEntity> wrapper = queryWrapper.lambda().
                eq(ClassMemberEntity::getClassId, classMemberListRequestDto.getClassId())
                .orderByDesc(ClassMemberEntity::getIdentity)
                .orderByAsc(ClassMemberEntity::getStatus)
                .orderByDesc(ClassMemberEntity::getCreatedAt);

        Page<ClassMemberEntity> page = new Page<>(classMemberListRequestDto.getPageNum(), classMemberListRequestDto.getPageSize());

        Page<ClassMemberEntity> classMemberEntityPage = this.page(page, wrapper);
        if (classMemberEntityPage.getTotal() == 0) {
            return ClassMemberListDto.builder().total(0L).members(Collections.EMPTY_LIST).build();
        }

        List<ClassMemberDto> data = new ArrayList<>();
        for (ClassMemberEntity record : classMemberEntityPage.getRecords()) {
            ClassMemberDto classMemberDto = ClassMemberDto.builder()
                    .userId(record.getUserId())
                    .userName(record.getUserName())
                    .userAvatar(record.getUserAvatar())
                    .identity(record.getIdentity())
                    .status(record.getStatus())
                    .joinTime(record.getCreatedAt())
                    .build();
            data.add(classMemberDto);
        }
        return ClassMemberListDto.builder().total(classMemberEntityPage.getTotal())
                .members(data).build();
    }

    @Override
    public ClassMemberDto getAssistantClassMemberDto(String classId) {

        ClassMemberEntity classMemberEntity = this.lambdaQuery()
                .eq(ClassMemberEntity::getClassId, classId)
                .eq(ClassMemberEntity::getIdentity, Identity.Assistant.getVal())
                .one();
        if (classMemberEntity == null) {
            log.error("classId:{}, identity:{} classMemberEntity is null", classId, Identity.Assistant);
            return null;
        }
        return ClassMemberDto.builder()
                .id(classMemberEntity.getId())
                .classId(classId)
                .userId(classMemberEntity.getUserId())
                .userName(classMemberEntity.getUserName())
                .userAvatar(classMemberEntity.getUserAvatar())
                .identity(classMemberEntity.getIdentity())
                .status(classMemberEntity.getStatus())
                .joinTime(classMemberEntity.getCreatedAt())
                .build();
    }

    private ClassMemberDto getClassMemberDto(String classId, String userId) {

        ClassMemberEntity classMemberEntity = this.lambdaQuery().eq(ClassMemberEntity::getClassId, classId)
                .eq(ClassMemberEntity::getUserId, userId).one();
        if (classMemberEntity == null) {
            log.error("classId:{}, userId:{} classMemberEntity is null", classId, userId);
            return null;
        }
        return ClassMemberDto.builder()
                .id(classMemberEntity.getId())
                .classId(classId)
                .userId(userId)
                .userName(classMemberEntity.getUserName())
                .userAvatar(classMemberEntity.getUserAvatar())
                .identity(classMemberEntity.getIdentity())
                .status(classMemberEntity.getStatus())
                .joinTime(classMemberEntity.getCreatedAt())
                .build();
    }

    private String getGroupId(String classId) {

        ClassInfoEntity classInfoEntity = classInfoService.getClassInfoEntity(classId);
        if (classInfoEntity != null) {
            return classInfoEntity.getAliyunId();
        }
        return null;
    }

}