package com.aliyuncs.aui.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 成员信息DTO
 *
 * @author chunlei.zcl
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClassMemberDto {

    @JsonIgnore
    private Long id;

    @JsonProperty("class_id")
    private String classId;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_avatar")
    private String userAvatar;

    private Integer identity;

    private Integer status;

    @JsonProperty("join_time")
    @JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
    private Date joinTime;
}
