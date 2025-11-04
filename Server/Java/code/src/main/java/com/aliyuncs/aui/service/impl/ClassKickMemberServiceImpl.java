package com.aliyuncs.aui.service.impl;

import com.aliyuncs.aui.dao.ClassKickMemberDao;
import com.aliyuncs.aui.dto.req.kickClassRequestDto;
import com.aliyuncs.aui.entity.ClassKickMemberEntity;
import com.aliyuncs.aui.service.ClassKickMemberService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.time.DateUtils;
import org.springframework.stereotype.Service;

import java.util.Date;


/**
 * 课堂踢出成员服务实现类
 *
 */
@Service("classKickMemberService")
@Slf4j
public class ClassKickMemberServiceImpl extends ServiceImpl<ClassKickMemberDao, ClassKickMemberEntity> implements ClassKickMemberService {


    @Override
    public boolean save(kickClassRequestDto kickClassRequestDto) {

        ClassKickMemberEntity classKickMemberEntity = get(kickClassRequestDto.getClassId(), kickClassRequestDto.getUserId());
        if (classKickMemberEntity != null) {
            log.info("userIs:{} is in class:{}", kickClassRequestDto.getUserId(), kickClassRequestDto.getClassId());
            return true;
        }
        ClassKickMemberEntity entity = ClassKickMemberEntity.builder()
                .classId(kickClassRequestDto.getClassId())
                .userId(kickClassRequestDto.getUserId())
                .expiredAt(DateUtils.addMonths(new Date(), 12))
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        return this.save(entity);
    }

    @Override
    public ClassKickMemberEntity get(String classId, String userId) {

        return this.lambdaQuery().eq(ClassKickMemberEntity::getClassId, classId)
                .eq(ClassKickMemberEntity::getUserId, userId)
                .one();
    }
}