package com.aliyuncs.aui.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.time.DateUtils;

import java.io.Serializable;
import java.util.Date;

/**
 * 签到Entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("class_check_in")
public class ClassCheckInEntity implements Serializable {
	private static final long serialVersionUID = 1L;

	@TableId(type = IdType.INPUT)
	private String id;

	/**
	 * 对应的课堂
	 */
	private String classId;

	/**
	 * 创建时间
	 */
	private Date createdAt;
	/**
	 * 修改时间
	 */
	private Date updatedAt;
	/**
	 * 签到标题
	 */
	private String title;
	/**
	 * 签到创建者
	 */
	 private String creator;

	/**
	 * 签到开始时间
	 */
	private Date startTime;

	/**
	 * 签到时长， 单位：秒
	 */
	private Integer duration;

	/**
	*  签到是否正在运行，即同一个课常在同一时刻只允许有一个正在运行的签到信息
	* @author chunlei.zcl
	*/
	public boolean isRunning(Date date) {

		Date endTime = DateUtils.addSeconds(this.getStartTime(), this.duration);

		return (this.getStartTime().getTime() <= date.getTime()) && (date.getTime() <= endTime.getTime());

	}
}
