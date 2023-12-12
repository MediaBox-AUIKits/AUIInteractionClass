package com.aliyuncs.aui.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * 助教权限Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("assistant_permit")
public class AssistantPermitEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String classId;

    private String permit;

    private Date createdAt;

    private Date updatedAt;

}
