package com.aliyuncs.aui.controller;

import com.alibaba.fastjson.JSON;
import com.aliyuncs.aui.common.utils.PageUtils;
import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.InvokeResult;
import com.aliyuncs.aui.dto.MeetingMemberInfo;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.*;
import com.aliyuncs.aui.service.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.*;

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


    @Resource
    private ALiYunService aLiyunService;

    @Resource
    private RongCloudServer rongCloudServer;

    @Resource
    private ClassMemberService classMemberService;

    /**
     * 获取Im的token
     */
    @RequestMapping("/token")
    public Result getImToken(@RequestBody ImTokenRequestDto imTokenRequestDto) {
        log.info("token");
        ValidatorUtils.validateEntity(imTokenRequestDto);

        List<String> imServer = imTokenRequestDto.getImServer();
        if (CollectionUtils.isEmpty(imServer)) {
            imServer = new ArrayList<>(1);
            // 默认为aliyun的im
            imServer.add("aliyun");
        }


        ImTokenResponseDto imTokenResDto = null;
        if (imServer.contains("aliyun")) {
            imTokenResDto = aLiyunService.getImToken(imTokenRequestDto);
            if (imTokenResDto == null) {
                return Result.error("aliyun token is null");
            }
        }

        String rongCloudToken = "";
        if (imServer.contains("rongCloud")) {
            rongCloudToken = rongCloudServer.getToken(imTokenRequestDto.getUserId(), imTokenRequestDto.getUserId(), "");
            if (StringUtils.isEmpty(rongCloudToken)) {
                return Result.error("rongCloud token is null");
            }
        }

        Map<String, String> map = new LinkedHashMap<>(3);
        map.put("aliyun_access_token", imTokenResDto != null ? imTokenResDto.getALiYunAccessToken():"");
        map.put("aliyun_refresh_token", imTokenResDto != null ? imTokenResDto.getALiYunRefreshToken():"");
        map.put("rong_cloud_token", StringUtils.isEmpty(rongCloudToken) ? "": rongCloudToken);
        return Result.ok(map);
    }

    @RequestMapping("/create")
    public Result createRoomInfo(@RequestBody RoomCreateRequestDto roomCreateRequestDto) {
        log.info("create");
        ValidatorUtils.validateEntity(roomCreateRequestDto);
        if (CollectionUtils.isEmpty(roomCreateRequestDto.getImServer())) {
            return Result.error("imServer null");
        }

        String aLiYunId = null;
        String rongCloudId = null;
        for (String imServer: roomCreateRequestDto.getImServer()) {
            if (imServer.equals("aliyun")) {
                aLiYunId =  aLiyunService.createMessageGroup(roomCreateRequestDto.getTeacherId());
                if (StringUtils.isEmpty(aLiYunId)) {
                    log.error("aliyun createMessageGroup error. teacher:{}", roomCreateRequestDto.getTeacherId());
                    String msg = String.format("aliyun createMessageGroup error. teacher: %s", roomCreateRequestDto.getTeacherId());
                    return Result.error(msg);
                }
            } else if (imServer.equals("rongCloud")) {
                rongCloudId =  rongCloudServer.createChatroom(roomCreateRequestDto.getTeacherId());
                if (StringUtils.isEmpty(rongCloudId)) {
                    log.error("rongCloud createMessageGroup error. teacher:{}", roomCreateRequestDto.getTeacherId());
                    String msg = String.format("rongCloud createMessageGroup error. teacher: %s", roomCreateRequestDto.getTeacherId());
                    return Result.error(msg);
                }
            } else {
                log.warn("imServer: IM group service is not configured");
            }
        }

        //  创建白板
        String boardRoomId = aLiYunId == null ? rongCloudId: aLiYunId;
        BoardAuthResponse boardAuthResponse = roomInfoService.getWhiteboardAuthInfo();
        BoardCreateResponse createResponse = boardRoomService.createBoardRoom(roomCreateRequestDto, boardAuthResponse, boardRoomId);
        log.info("创建白板:  " + JSON.toJSONString(createResponse));
        if (createResponse.getCode() != 200) {
            return Result.error(createResponse.getCode(), createResponse.getMessage());
        }

        RoomInfoDto roomInfo = roomInfoService.createRoomInfo(roomCreateRequestDto, createResponse, aLiYunId, rongCloudId);

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
        log.info("get");
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
        log.info("list");
        ValidatorUtils.validateEntity(roomListRequestDto);
        PageUtils page = roomInfoService.list(roomListRequestDto);
        if (page != null && CollectionUtils.isNotEmpty(page.getList())) {
            return returnResult(page.getList());
        }
        return Result.error();
    }

    @RequestMapping("/start")
    public Result start(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {
        log.info("start");
        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.start(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/stop")
    public Result stop(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {
        log.info("stop");
        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.stop(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/pause")
    public Result pause(@RequestBody RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {
        log.info("pause");
        ValidatorUtils.validateEntity(roomUpdateStatusRequestDto);
        RoomInfoDto roomInfo = roomInfoService.pause(roomUpdateStatusRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/delete")
    public Result delete(@RequestBody RoomDeleteRequestDto roomDeleteRequestDto) {
        log.info("delete");
        ValidatorUtils.validateEntity(roomDeleteRequestDto);
        RoomInfoDto roomInfo = roomInfoService.delete(roomDeleteRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/update")
    public Result update(@RequestBody RoomUpdateRequestDto roomUpdateRequestDto) {
        log.info("update");
        ValidatorUtils.validateEntity(roomUpdateRequestDto);
        RoomInfoDto roomInfo = roomInfoService.update(roomUpdateRequestDto);
        if (roomInfo != null) {
            return returnResult(roomInfo);
        }
        return Result.error();
    }

    @RequestMapping("/updateMeetingInfo")
    public Result updateMeetingInfo(@RequestBody MeetingActionRequestDto meetingActionRequestDto) {
        log.info("updateMeetingInfo");
        ValidatorUtils.validateEntity(meetingActionRequestDto);
        MeetingMemberInfo.Members members = roomInfoService.updateMeetingInfo(meetingActionRequestDto);
        if (members == null) {
            MeetingMemberInfo.Members empty = new MeetingMemberInfo.Members();
            empty.setMembers(Collections.emptyList());
            return returnResult(empty);
        }
        return  returnResult(members);

    }

    @RequestMapping("/getMeetingInfo")
    public Result getMeetingInfo(@RequestBody MeetingGetRequestDto meetingGetRequestDto, HttpServletResponse servletResponse) {
        log.info("getMeetingInfo");
        ValidatorUtils.validateEntity(meetingGetRequestDto);
        MeetingMemberInfo.Members members = roomInfoService.getMeetingInfo(meetingGetRequestDto);
        if (members == null) {
            MeetingMemberInfo.Members empty = new MeetingMemberInfo.Members();
            empty.setMembers(Collections.emptyList());
            return returnResult(empty);
        }
        return  returnResult(members);
    }

    /**
     * 流状态实时信息回调，可以及时更新db中的直播（或房间）状态
     */
    @RequestMapping("/handlePushStreamEventCallback")
    public Result handlePushStreamEventCallback(@RequestParam LivePushStreamEventRequestDto livePushStreamEventRequestDto,
                                                @RequestHeader HttpHeaders headers) {
        log.info("handlePushStreamEventCallback");
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
        log.info("getLiveJumpUrl");
        ValidatorUtils.validateEntity(jumpUrlRequestDto);

        String scheme = request.getScheme();
        String serverName = request.getServerName();

        String serverHost = String.format("%s://%s", scheme, serverName);

        return roomInfoService.getLiveJumpUrl(jumpUrlRequestDto, serverHost);
    }

    @RequestMapping("/verifyAuthToken")
    public AuthTokenResponse verifyAuthToken(@RequestBody AuthTokenRequestDto authTokenRequestDto) {
        log.info("verifyAuthToken");
        ValidatorUtils.validateEntity(authTokenRequestDto);
        return roomInfoService.verifyAuthToken(authTokenRequestDto);
    }

    @RequestMapping("/getRtcAuthToken")
    public RtcAuthTokenResponse getRtcAuthToken(@RequestBody RtcAuthTokenRequestDto rtcAuthTokenRequestDto) {
        log.info("getRtcAuthToken");
        ValidatorUtils.validateEntity(rtcAuthTokenRequestDto);
        return roomInfoService.getRtcAuthToken(rtcAuthTokenRequestDto);
    }

    @RequestMapping("/getWhiteboardAuthInfo")
    public Result getWhiteboardAuthInfo() {
        log.info("getWhiteboardAuthInfo");
        BoardAuthResponse boardAuthResponse = roomInfoService.getWhiteboardAuthInfo();

        if (boardAuthResponse != null) {
            return returnResult(boardAuthResponse);
        }
        return Result.error();
    }

    /**
     * 直播间: 单人静音 取消单人静音    禁言 取消禁言 是否禁言    点赞 统计信息
     */
    @RequestMapping("/muteUser")
    public Result muteUser(@RequestBody UserMuteRequestDto userMuteRequestDto) {
        log.info("muteUser");
        ValidatorUtils.validateEntity(userMuteRequestDto);
        Map<String, Object> map = new HashMap<>();
        if (userMuteRequestDto.getServerType().equals("rongCloud")) {
            boolean result = rongCloudServer.muteUser(userMuteRequestDto.getChatroomId(), userMuteRequestDto.getUserId(), userMuteRequestDto.getMinute());
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/cancelMuteUser")
    public Result cancelMuteUser(@RequestBody UserCancelMuteRequestDto userCancelMuteRequestDto) {
        log.info("cancelMuteUser");
        Map<String, Object> map = new HashMap<>();
        ValidatorUtils.validateEntity(userCancelMuteRequestDto);
        if (userCancelMuteRequestDto.getServerType().equals("rongCloud")) {
            boolean result = rongCloudServer.cancelMuteUser(userCancelMuteRequestDto.getChatroomId(), userCancelMuteRequestDto.getUserId());
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/muteChatroom")
    public Result muteChatroom(@RequestBody ChatroomMuteRequestDto chatroomMuteRequestDto) {
        log.info("muteChatroom");
        ValidatorUtils.validateEntity(chatroomMuteRequestDto);
        Map<String, Object> map = new HashMap<>();
        if (chatroomMuteRequestDto.getServerType().equals("rongCloud")) {
            boolean result = rongCloudServer.muteChatroom(chatroomMuteRequestDto.getChatroomId());
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/cancelMuteChatroom")
    public Result cancelMuteChatroom(@RequestBody ChatroomCancelMuteRequestDto chatroomCancelMuteRequestDto) {
        log.info("cancelMuteChatroom");
        ValidatorUtils.validateEntity(chatroomCancelMuteRequestDto);

        Map<String, Object> map = new HashMap<>();
        if (chatroomCancelMuteRequestDto.getServerType().equals("rongCloud")) {
            boolean result = rongCloudServer.cancelMuteChatroom(chatroomCancelMuteRequestDto.getChatroomId());
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/isMuteChatroom")
    public Result isMuteChatroom(@RequestBody ChatroomMuteRequestDto chatroomMuteRequestDto) {
        log.info("isMuteChatroom");
        ValidatorUtils.validateEntity(chatroomMuteRequestDto);
        Map<String, Object> map = new HashMap<>();
        if (chatroomMuteRequestDto.getServerType().equals("rongCloud")) {
            boolean result = rongCloudServer.isMuteChatroom(chatroomMuteRequestDto.getChatroomId());
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/sendLikeMessage")
    public Result sendLikeMessage(@RequestBody LikeMessageSendRequestDto likeMessageSendRequestDto) {
        log.info("sendLikeMessage");
        ValidatorUtils.validateEntity(likeMessageSendRequestDto);
        Map<String, Object> map = new HashMap<>();
        if (likeMessageSendRequestDto.getServerType().equals("rongCloud")) {
            boolean result = roomInfoService.sendLikeMessage(likeMessageSendRequestDto);
            map.put("result", result);
        }
        return Result.ok(map);
    }

    @RequestMapping("/getStatistics")
    public Result getStatistics(@RequestBody StatisticsGetRequestDto statisticsGetRequestDto) {
        log.info("getStatistics");
        ValidatorUtils.validateEntity(statisticsGetRequestDto);
        Map<String, Object> map = new HashMap<>();
        if (statisticsGetRequestDto.getServerType().equals("rongCloud")) {
            RoomInfoDto.Metrics metrics = roomInfoService.getStatistics(statisticsGetRequestDto);
            map.put("metrics", metrics);
        }
        return Result.ok(map);
    }

    private Result returnResult(Object object) {

        return Result.ok(object);
    }


    @RequestMapping("/joinClass")
    public Result joinClass(@RequestBody JoinClassRequestDto joinClassRequestDto) {

        ValidatorUtils.validateEntity(joinClassRequestDto);
        if (!joinClassRequestDto.valid()) {
            log.info("identity invalid. identity:{}", joinClassRequestDto.getIdentity());
            return Result.invalidParam();
        }

        InvokeResult result = classMemberService.joinClass(joinClassRequestDto);
        if (result.isSuccess()) {
            return Result.ok();
        }
        Result r = new Result();
        r.setSuccess(false);
        Map<String, Object> map = new HashMap<>();
        map.put("reason", result.getReason());
        r.setData(map);
        return r;
    }

    @RequestMapping("/leaveClass")
    public Result leaveClass(@RequestBody LeaveClassRequestDto leaveClassRequestDto) {

        ValidatorUtils.validateEntity(leaveClassRequestDto);
        InvokeResult result = classMemberService.leaveClass(leaveClassRequestDto);
        if (result.isSuccess()) {
            return Result.ok();
        }
        Result r = new Result();
        r.setSuccess(false);
        Map<String, Object> map = new HashMap<>();
        map.put("reason", result.getReason());
        r.setData(map);
        return r;
    }

    @RequestMapping("/kickClass")
    public Result kickClass(@RequestBody kickClassRequestDto kickClassRequestDto) {

        ValidatorUtils.validateEntity(kickClassRequestDto);
        InvokeResult result = classMemberService.kickClass(kickClassRequestDto);
        if (result.isSuccess()) {
            return Result.ok();
        }
        return Result.error();
    }

    @RequestMapping("/listMembers")
    public Result listMembers(@RequestBody ClassMemberListRequestDto classMemberListRequestDto) {

        ValidatorUtils.validateEntity(classMemberListRequestDto);
        if (!classMemberListRequestDto.valid()) {
            return Result.invalidParam();
        }

        ClassMemberListDto classMemberListDto = classMemberService.listMembers(classMemberListRequestDto);
        if (classMemberListDto != null) {
            return Result.ok(classMemberListDto);
        }
        return Result.error();
    }
}
