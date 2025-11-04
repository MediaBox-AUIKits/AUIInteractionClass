package com.aliyuncs.aui.controller;

import com.alibaba.fastjson.JSON;
import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.req.ImTokenRequestDto;
import com.aliyuncs.aui.dto.req.RoomCreateRequestDto;
import com.aliyuncs.aui.dto.res.*;
import com.aliyuncs.aui.service.ALiYunService;
import com.aliyuncs.aui.service.BoardRoomService;
import com.aliyuncs.aui.service.ClassInfoService;
import com.aliyuncs.aui.service.RongCloudServer;
import com.google.common.collect.ImmutableMap;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.aliyuncs.aui.common.Constants.*;

/**
 * 直播间管理的Controller V2版本
 * 主要是接入新的IM, 并兼容老的IM
 *
 * @author chunlei.zcl
 */
@RestController
@RequestMapping("/api/v2/class")
@Slf4j
public class ClassInfoControllerV2 {

    @Resource
    private ALiYunService aLiyunService;

    @Resource
    private RongCloudServer rongCloudServer;

    @Resource
    private ClassInfoService roomInfoService;

    @Resource
    private BoardRoomService boardRoomService;

    /**
     * 获取Im的token
     */
    @RequestMapping("/token")
    public Result getImToken(@RequestBody ImTokenRequestDto imTokenRequestDto) {

        ValidatorUtils.validateEntity(imTokenRequestDto);

        if (CollectionUtils.isEmpty(imTokenRequestDto.getImServer())) {
            return Result.invalidParam();
        }

        for (String s : imTokenRequestDto.getImServer()) {
            if (!IM_OLD.equals(s) && !IM_NEW.equals(s) && !RONG_CLOUD.equals(s)) {
                return Result.invalidParam();
            }
        }

        NewImTokenResponseDto newImTokenResponseDto = null;
        Map<String, Object> result = new HashMap<>();
        if (imTokenRequestDto.getImServer().contains(IM_OLD)) {
            ImTokenResponseDto imTokenResDto = aLiyunService.getImToken(imTokenRequestDto);
            if (imTokenResDto != null) {
                result.put("aliyun_old_im", ImmutableMap.<String, String>builder().put("access_token", imTokenResDto.getALiYunAccessToken())
                        .put("refresh_token", imTokenResDto.getALiYunRefreshToken()).build());
            }
        }

        if (imTokenRequestDto.getImServer().contains(IM_NEW)) {
            newImTokenResponseDto = aLiyunService.getNewImToken(imTokenRequestDto);
            if (newImTokenResponseDto != null) {
                result.put("aliyun_new_im", newImTokenResponseDto);
            }
        }

        if (imTokenRequestDto.getImServer().contains(RONG_CLOUD)) {
            String rongCloudToken = rongCloudServer.getToken(imTokenRequestDto.getUserId(), imTokenRequestDto.getUserId(), "");
            if (StringUtils.isNotEmpty(rongCloudToken)) {
                result.put("rong_cloud", ImmutableMap.<String, String>builder().put("access_token", rongCloudToken).build());
            }
        }

        return Result.ok(result);
    }

    @RequestMapping("/create")
    public Result createRoomInfo(@RequestBody RoomCreateRequestDto roomCreateRequestDto) {

        ValidatorUtils.validateEntity(roomCreateRequestDto);
        if (CollectionUtils.isEmpty(roomCreateRequestDto.getImServer())) {
            return Result.error("imServer null");
        }

        String aLiYunId = null;
        String rongCloudId = null;


        if (roomCreateRequestDto.getImServer().contains(IM_OLD)) {
            aLiYunId = aLiyunService.createMessageGroup(roomCreateRequestDto.getTeacherId());
            if (StringUtils.isEmpty(aLiYunId)) {
                log.error("aliyun createMessageGroup error. teacher:{}", roomCreateRequestDto.getTeacherId());
                String msg = String.format("aliyun createMessageGroup error. teacher: %s", roomCreateRequestDto.getTeacherId());
                return Result.error(msg);
            }
        }

        if (roomCreateRequestDto.getImServer().contains(IM_NEW)) {
            if (StringUtils.isEmpty(aLiYunId)) {
                aLiYunId = UUID.randomUUID().toString().replaceAll("-", "");
            }
            aLiYunId = aLiyunService.createNewImMessageGroup(aLiYunId, roomCreateRequestDto.getTeacherId());
        }

        if (roomCreateRequestDto.getImServer().contains(RONG_CLOUD)) {
            rongCloudId = rongCloudServer.createChatroom(roomCreateRequestDto.getTeacherId());
            if (StringUtils.isEmpty(rongCloudId)) {
                log.error("rongCloud createMessageGroup error. teacher:{}", roomCreateRequestDto.getTeacherId());
                String msg = String.format("rongCloud createMessageGroup error. teacher: %s", roomCreateRequestDto.getTeacherId());
                return Result.error(msg);
            }
        } else {
            log.warn("imServer: IM group service is not configured");
        }


        //  创建白板
        String boardRoomId = aLiYunId == null ? rongCloudId : aLiYunId;
        BoardAuthResponse boardAuthResponse = roomInfoService.getWhiteboardAuthInfo();
        BoardCreateResponse createResponse = boardRoomService.createBoardRoom(roomCreateRequestDto, boardAuthResponse, boardRoomId);
        log.info("创建白板:  " + JSON.toJSONString(createResponse));
        if (createResponse.getCode() != 200) {
            return Result.error(createResponse.getCode(), createResponse.getMessage());
        }

        RoomInfoDto roomInfo = roomInfoService.createRoomInfo(roomCreateRequestDto, createResponse, aLiYunId, rongCloudId);

        log.info("roomInfoDto: {}", roomInfo);
        if (roomInfo != null) {
            return Result.ok(roomInfo);

        }
        return Result.error();
    }
}
