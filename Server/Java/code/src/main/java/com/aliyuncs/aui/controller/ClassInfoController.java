package com.aliyuncs.aui.controller;

import com.alibaba.fastjson.JSON;
import com.aliyuncs.aui.common.utils.PageUtils;
import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.MeetingMemberInfo;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.*;
import com.aliyuncs.aui.service.BoardRoomService;
import com.aliyuncs.aui.service.ClassInfoService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 直播间管理的Controller
 */
@RestController
@RequestMapping("/api/v1/class")
@Slf4j
public class ClassInfoController {

    @Resource
    private HttpServletRequest request;

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

        ImTokenResponseDto imTokenResDto = roomInfoService.getImToken(imTokenRequestDto);
        if (imTokenResDto != null) {
            Map<String, String> map = new LinkedHashMap<>(2);
            map.put("access_token", imTokenResDto.getAccessToken());
            map.put("refresh_token", imTokenResDto.getAccessToken());
            return Result.ok(map);
        }

        return Result.error();
    }

    @RequestMapping("/create")
    public Result createRoomInfo(@RequestBody RoomCreateRequestDto roomCreateRequestDto) {

        ValidatorUtils.validateEntity(roomCreateRequestDto);

        BoardAuthResponse boardAuthResponse = roomInfoService.getWhiteboardAuthInfo();
        //  创建白板
        BoardCreateResponse createResponse = boardRoomService.createBoardRoom(roomCreateRequestDto, boardAuthResponse);
        log.info("创建白板:  " + JSON.toJSONString(createResponse));
        if (createResponse.getCode() != 200) {
            return Result.error(createResponse.getCode(), createResponse.getMessage());
        }

        RoomInfoDto roomInfo = roomInfoService.createRoomInfo(roomCreateRequestDto, createResponse);

        log.info("roomInfoDto: {}", roomInfo);
        if (roomInfo != null) {
            return returnResult(roomInfo);

        }
        return Result.error();
    }

    /**
     * 信息
     */
    @RequestMapping("/get")
    public Result get(@RequestBody RoomGetRequestDto roomGetRequestDto) {

        ValidatorUtils.validateEntity(roomGetRequestDto);

        RoomInfoDto roomInfo = roomInfoService.get(roomGetRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.notFound();
    }

    /**
     * 列表
     */
    @RequestMapping("/list")
    public Result list(@RequestBody RoomListRequestDto roomListRequestDto) {

        ValidatorUtils.validateEntity(roomListRequestDto);
        PageUtils page = roomInfoService.list(roomListRequestDto);
        if (page != null && CollectionUtils.isNotEmpty(page.getList())) {
            return Result.ok(page.getList());
        }
        return Result.error("List is empty");
    }

    @RequestMapping("/start")
    public Result start(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.start(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/stop")
    public Result stop(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.stop(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/pause")
    public Result pause(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.pause(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/delete")
    public Result delete(@RequestBody RoomDeleteRequestDto roomDeleteRequestDto) {
        ValidatorUtils.validateEntity(roomDeleteRequestDto);
        RoomInfoDto roomInfo = roomInfoService.delete(roomDeleteRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/update")
    public Result update(@RequestBody RoomUpdateRequestDto roomUpdateRequestDto) {

        ValidatorUtils.validateEntity(roomUpdateRequestDto);
        RoomInfoDto roomInfo = roomInfoService.update(roomUpdateRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/updateMeetingInfo")
    public Result updateMeetingInfo(@RequestBody MeetingActionRequestDto meetingActionRequestDto) {
        ValidatorUtils.validateEntity(meetingActionRequestDto);
        MeetingMemberInfo.Members members = roomInfoService.updateMeetingInfo(meetingActionRequestDto);
        if (members != null) {
            return returnResult(members);
        }
        return Result.error();
    }

    @RequestMapping("/getMeetingInfo")
    public Result getMeetingInfo(@RequestBody MeetingGetRequestDto meetingGetRequestDto, HttpServletResponse servletResponse) {

        ValidatorUtils.validateEntity(meetingGetRequestDto);
        MeetingMemberInfo.Members members = roomInfoService.getMeetingInfo(meetingGetRequestDto);
        log.info("members: {}", members);
        if (members != null) {
            return returnResult(members);
        }
        return  Result.error();

    }

    /**
     * 流状态实时信息回调，可以及时更新db中的直播（或房间）状态
     */
    @RequestMapping("/handlePushStreamEventCallback")
    public Result handlePushStreamEventCallback(@RequestParam LivePushStreamEventRequestDto livePushStreamEventRequestDto,
                                                @RequestHeader HttpHeaders headers) {

        ValidatorUtils.validateEntity(livePushStreamEventRequestDto);
        String liveSignature = headers.getFirst("ALI-LIVE-SIGNATURE");
        String liveTimestamp = headers.getFirst("ALI-LIVE-TIMESTAMP");

        if (StringUtils.isEmpty(liveSignature) || StringUtils.isEmpty(liveTimestamp)) {
            log.warn("liveSignature or liveTimestamp is null");
            return Result.invalidParam();
        }

        livePushStreamEventRequestDto.setLiveSignature(liveSignature);
        livePushStreamEventRequestDto.setLiveTimestamp(liveTimestamp);

        boolean result = roomInfoService.handlePushStreamEventCallback(livePushStreamEventRequestDto);
        return result ? Result.ok() : Result.error();
    }

    /**
     * 获取PC小助手跳转链接
     */
    @RequestMapping("/getLiveJumpUrl")
    public JumpUrlResponse getLiveJumpUrl(@RequestBody JumpUrlRequestDto jumpUrlRequestDto) {

        ValidatorUtils.validateEntity(jumpUrlRequestDto);

        String scheme = request.getScheme();
        String serverName = request.getServerName();

        String serverHost = String.format("%s://%s", scheme, serverName);

        return roomInfoService.getLiveJumpUrl(jumpUrlRequestDto, serverHost);
    }

    @RequestMapping("/verifyAuthToken")
    public AuthTokenResponse verifyAuthToken(@RequestBody AuthTokenRequestDto authTokenRequestDto) {

        ValidatorUtils.validateEntity(authTokenRequestDto);
        return roomInfoService.verifyAuthToken(authTokenRequestDto);
    }

    @RequestMapping("/getRtcAuthToken")
    public RtcAuthTokenResponse getRtcAuthToken(@RequestBody RtcAuthTokenRequestDto rtcAuthTokenRequestDto) {

        ValidatorUtils.validateEntity(rtcAuthTokenRequestDto);
        return roomInfoService.getRtcAuthToken(rtcAuthTokenRequestDto);
    }

    @RequestMapping("/getWhiteboardAuthInfo")
    public Result getWhiteboardAuthInfo() {

        BoardAuthResponse boardAuthResponse = roomInfoService.getWhiteboardAuthInfo();

        if (boardAuthResponse != null) {
            return returnResult(boardAuthResponse);
        }
        return Result.error();
    }

    private Result returnResult(Object object) {
        return Result.ok(object);
    }
}
