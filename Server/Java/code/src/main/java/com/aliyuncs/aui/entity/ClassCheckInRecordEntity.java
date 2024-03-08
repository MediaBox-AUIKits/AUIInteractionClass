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
 * 签到记录Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("class_check_in_record")
public class ClassCheckInRecordEntity implements Serializable {
	private static final long serialVersionUID = 1L;

	@TableId(type = IdType.INPUT)
	private String id;
	/**
	 * 创建时间
	 */
	private Date createdAt;
	/**
	 * 修改时间
	 */
	private Date updatedAt;

	/**
	 * 签到者
	 */
	 private String userId;

	/**
	 * 签到id
	 */
	 private String checkInId;

}
