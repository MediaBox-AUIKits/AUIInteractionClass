package com.aliyuncs.aui.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
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
 * 课堂成员Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("class_member")
public class ClassMemberEntity implements Serializable {
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
	 * 用户名
	 */
	@TableField("user_name")
	private String userName;

	@TableField("user_avatar")
	private String userAvatar;

	/**
	 * 身份信息。1-学生，2-老师
	 */
	private Integer identity;
	/**
	 * 状态。1-正常，2-退出， 3-踢出
	 */
	private Integer status;

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
