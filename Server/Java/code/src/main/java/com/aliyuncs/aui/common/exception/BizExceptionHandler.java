package com.aliyuncs.aui.common.exception;

import com.aliyuncs.aui.common.utils.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 异常处理器
 */
@RestControllerAdvice
@Slf4j
public class BizExceptionHandler {

	/**
	 * 处理异常
	 */
	@ExceptionHandler(Exception.class)
	public Result handleException(Exception e){
		log.error(e.getMessage(), e);
		return Result.error();
	}

	/**
	 * 处理业务异常
	 */
	@ExceptionHandler(BizException.class)
	public Result handleRRException(BizException e){

		Map<String, Object> map = new LinkedHashMap<>(2);
		map.put("code", e.getCode());
		map.put("msg", e.getMessage());

		return Result.error(map);
	}
}
