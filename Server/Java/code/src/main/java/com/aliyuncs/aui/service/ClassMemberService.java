package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.ClassMemberListDto;
import com.aliyuncs.aui.entity.ClassMemberEntity;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 *  课堂成员服务
 */
public interface ClassMemberService extends IService<ClassMemberEntity> {

    InvokeResult joinClass(JoinClassRequestDto joinClassRequestDto);

    InvokeResult leaveClass(LeaveClassRequestDto leaveClassRequestDto);

    InvokeResult deleteAssistantClass(AssistantPermitDeleteRequest assistantPermitDeleteRequest);

    InvokeResult kickClass(kickClassRequestDto kickClassRequestDto);

    ClassMemberListDto listMembers(ClassMemberListRequestDto classMemberListRequestDto);

    ClassMemberDto getAssistantClassMemberDto(String classId);
}

