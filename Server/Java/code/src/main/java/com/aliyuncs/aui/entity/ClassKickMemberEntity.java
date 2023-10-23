package com.aliyuncs.aui.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * 课堂踢出成员Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("class_kick_member")
public class ClassKickMemberEntity implements Serializable {
	private static final long serialVersionUID = 1L;

	@TableId(type = IdType.AUTO)
	private Long id;

	/**
	 * 课堂Id
	 */
	private String classId;
	/**
	 * 用户Id
	 */
	 private String userId;

	/**
	 * 过期时间
	 */
	@JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
	private Date expiredAt;

	/**
	 * 创建时间
	 */
	@JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
	private Date createdAt;
	/**
	 * 修改时间
	 */
	@JsonFormat(pattern="yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
	private Date updatedAt;
}
