package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.req.ClassMemberListRequestDto;
import com.aliyuncs.aui.dto.req.JoinClassRequestDto;
import com.aliyuncs.aui.dto.req.LeaveClassRequestDto;
import com.aliyuncs.aui.dto.req.kickClassRequestDto;
import com.aliyuncs.aui.dto.res.ClassMemberListDto;
import com.aliyuncs.aui.entity.ClassMemberEntity;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 *  课堂成员服务
 */
public interface ClassMemberService extends IService<ClassMemberEntity> {

    InvokeResult joinClass(JoinClassRequestDto joinClassRequestDto);

    InvokeResult leaveClass(LeaveClassRequestDto leaveClassRequestDto);

    InvokeResult kickClass(kickClassRequestDto kickClassRequestDto);

    ClassMemberListDto listMembers(ClassMemberListRequestDto classMemberListRequestDto);
}

