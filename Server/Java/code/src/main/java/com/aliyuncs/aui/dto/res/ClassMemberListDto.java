package com.aliyuncs.aui.dto.res;

import com.aliyuncs.aui.dto.ClassMemberDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 获取课堂成员列表DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassMemberListDto {

    private Long total;

    private List<ClassMemberDto> members;

}
