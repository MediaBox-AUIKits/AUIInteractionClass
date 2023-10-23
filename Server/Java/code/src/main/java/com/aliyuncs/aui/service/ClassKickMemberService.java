package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.req.kickClassRequestDto;
import com.aliyuncs.aui.entity.ClassKickMemberEntity;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 *  课堂踢出成员服务
 */
public interface ClassKickMemberService extends IService<ClassKickMemberEntity> {

    boolean save(kickClassRequestDto kickClassRequestDto);

    ClassKickMemberEntity get(String classId, String userId);
}

