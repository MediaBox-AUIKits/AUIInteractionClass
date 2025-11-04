package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.aui.common.utils.JwtUtils;
import com.aliyuncs.aui.common.utils.PageUtils;
import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.dao.RoomInfoDao;
import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.LinkInfo;
import com.aliyuncs.aui.dto.MeetingMemberInfo;
import com.aliyuncs.aui.dto.enums.ClassRoomStatus;
import com.aliyuncs.aui.dto.enums.PushStreamStatus;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.*;
import com.aliyuncs.aui.entity.ClassInfoEntity;
import com.aliyuncs.aui.service.*;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

import javax.annotation.Resource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;


/**
 * 房间服务实现类
 */
@Service("roomInfosService")
@Slf4j
public class ClassInfoServiceImpl extends ServiceImpl<RoomInfoDao, ClassInfoEntity> implements ClassInfoService {

    /**
     * token过期时间
     */
    private static final long EXPIRE_TIME = 3600;

    /**
     * token秘钥
     */
    private static final String TOKEN_SECRET = "323assa2323.dqe223b434";

    private static final char[] HEX_DIGITS = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

    @Value("${room.boards.app_secret}")
    private String APP_SECRET;

    @Value("${biz.live_mic.app_id}")
    private String liveMicAppId;

    private static final ThreadPoolExecutor THREAD_POOL = new ThreadPoolExecutor(0, Integer.MAX_VALUE,
            60L, TimeUnit.SECONDS,
            new SynchronousQueue<>());

    @Resource
    private ALiYunService videoCloudService;

    @Resource
    private BoardRoomService boardRoomService;

    @Resource
    @Lazy
    private ClassMemberService classMemberService;

    @Override
    public ImTokenResponseDto getImToken(ImTokenRequestDto imTokenRequestDto) {

        return videoCloudService.getImToken(imTokenRequestDto);
    }

    @SneakyThrows
    @Override
    public RoomInfoDto createRoomInfo(RoomCreateRequestDto roomCreateRequestDto, BoardCreateResponse createResponses, String aLiYunId, String rongCloudId) {
        RoomInfoDto roomInfoDto = new RoomInfoDto();
        long start = System.currentTimeMillis();
        Date now = new Date();
        String id = aLiYunId == null ? rongCloudId : aLiYunId;
        ClassInfoEntity roomInfoEntity = ClassInfoEntity.builder()
                .id(id)
                .createdAt(now)
                .updatedAt(now)
                .title(roomCreateRequestDto.getTitle())
                .teacherNick(roomCreateRequestDto.getTeacherNick())
                .teacherId(roomCreateRequestDto.getTeacherId())
                .extendsInfo(roomCreateRequestDto.getExtendsInfo())
                .aliyunId(aLiYunId)
                .rongCloudId(rongCloudId)
                .mode(roomCreateRequestDto.getMode())
                .status((long) ClassRoomStatus.ClassRoomStatusPrepare.getVal())
                .boardsInfo(JSON.toJSONString(createResponses))
                .build();

        roomInfoEntity.setMeetingId(UUID.randomUUID().toString().replaceAll("_", ""));

        // insert db
        boolean saved = this.save(roomInfoEntity);
        if (!saved) {
            log.error("save db error. roomInfoEntity:{}", JSONObject.toJSONString(roomInfoEntity));
            return null;
        }


        BeanUtils.copyProperties(roomInfoEntity, roomInfoDto);
        LinkInfo rtcInfo = videoCloudService.getRtcInfo(roomInfoEntity.getMeetingId(), roomCreateRequestDto.getTeacherId(), roomCreateRequestDto.getTeacherId());
        roomInfoDto.setLinkInfo(rtcInfo);

        log.info("createRoomInfo. roomCreateRequestDto:{}, roomInfoDto:{}, consume:{}", JSONObject.toJSONString(roomCreateRequestDto),
                JSONObject.toJSONString(roomInfoDto), (System.currentTimeMillis() - start));

        return roomInfoDto;
    }

    @Override
    public RoomInfoDto get(RoomGetRequestDto roomGetRequestDto) {
        ClassInfoEntity roomInfoEntity = this.getById(roomGetRequestDto.getId());
        if (roomInfoEntity == null) {
            log.warn("get roomInfoEntity is null. roomGetRequestDto:{}", JSONObject.toJSONString(roomGetRequestDto));
            return null;
        }

        RoomInfoDto roomInfoDto = new RoomInfoDto();
        BeanUtils.copyProperties(roomInfoEntity, roomInfoDto);

        LinkInfo rtcInfo = videoCloudService.getRtcInfo(roomInfoEntity.getMeetingId(), roomGetRequestDto.getUserId(), roomInfoEntity.getTeacherId());
        roomInfoDto.setLinkInfo(rtcInfo);

        LinkInfo rtcShadowInfo = videoCloudService.getRtcInfo(roomInfoEntity.getMeetingId(), String.format("%s_%s", roomGetRequestDto.getUserId(), "shadow"),
                String.format("%s_%s", roomInfoEntity.getTeacherId(), "shadow"));
        roomInfoDto.setLinkShadowInfo(rtcShadowInfo);

        String mediaId = videoCloudService.searchMediaByTitle(getTitle(roomInfoEntity));
        if (StringUtils.isNotEmpty(mediaId)) {
            RoomInfoDto.VodInfo vodInfo = videoCloudService.getPlayInfo(mediaId);
            if (vodInfo != null) {
                roomInfoDto.setVodInfo(vodInfo);
            }
        }

        RoomInfoDto.Metrics metrics = videoCloudService.getGroupDetails(roomInfoEntity.getId());
        if (metrics != null) {
            roomInfoDto.setMetrics(metrics);
        }

        RoomInfoDto.UserStatus userStatus = videoCloudService.getUserInfo(roomInfoEntity.getId(), roomInfoEntity.getTeacherId());
        if (userStatus != null) {
            roomInfoDto.setUserStatus(userStatus);
        }

        ClassMemberDto assistantClassMemberDto = classMemberService.getAssistantClassMemberDto(roomInfoEntity.getId());
        if (assistantClassMemberDto != null) {
            roomInfoDto.setAssistantClassMemberDto(assistantClassMemberDto);
        }

        return roomInfoDto;
    }


    @Override
    public PageUtils list(RoomListRequestDto roomListRequestDto) {

        Page<ClassInfoEntity> page = new Page<>(roomListRequestDto.getPageNum(), roomListRequestDto.getPageSize());
        QueryWrapper<ClassInfoEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.lambda().orderByDesc(ClassInfoEntity::getCreatedAt);

        Page<ClassInfoEntity> roomInfoEntityPage = this.page(page, queryWrapper);
        if (roomInfoEntityPage == null || CollectionUtils.isEmpty(roomInfoEntityPage.getRecords())) {
            log.warn("list. roomInfoEntityPage or roomInfoEntityPage.getRecords is empty");
            return null;
        }

        List<Future<RoomInfoDto>> futureList = new ArrayList<>(roomInfoEntityPage.getRecords().size());
        CountDownLatch countDownLatch = new CountDownLatch(roomInfoEntityPage.getRecords().size());

        for (ClassInfoEntity record : roomInfoEntityPage.getRecords()) {
            RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
            roomGetRequestDto.setId(record.getId());
            roomGetRequestDto.setUserId(record.getTeacherId());
            Future<RoomInfoDto> future = THREAD_POOL.submit(() -> getRoomInfo(roomGetRequestDto, countDownLatch));
            futureList.add(future);
        }

        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            log.error(String.format("list InterruptedException. roomListRequestDto: %s", JSONObject.toJSONString(roomListRequestDto)), e);
            return null;
        }

        List<RoomInfoDto> roomInfoDtos = new ArrayList<>(futureList.size());
        for (Future<RoomInfoDto> roomInfoDtoFuture : futureList) {
            try {
                roomInfoDtos.add(roomInfoDtoFuture.get());
            } catch (Exception e) {
                log.error(String.format("roomInfoDtoFuture.get() Exception. roomListRequestDto: %s", JSONObject.toJSONString(roomListRequestDto)), e);
            }
        }

        return new PageUtils(roomInfoDtos, (int) roomInfoEntityPage.getTotal(), (int) roomInfoEntityPage.getSize(), (int) roomInfoEntityPage.getCurrent());
    }

    @Override
    public RoomInfoDto stop(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        boolean valid = verifyPermission(roomUpdateStatusRequestDto.getId(), roomUpdateStatusRequestDto.getUserId());
        if (!valid) {
            return null;
        }

        boolean result = updateStatus(roomUpdateStatusRequestDto.getId(), ClassRoomStatus.ClassRoomStatusOff);
        if (result) {
            RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
            roomGetRequestDto.setId(roomUpdateStatusRequestDto.getId());
            roomGetRequestDto.setUserId(roomUpdateStatusRequestDto.getUserId());
            return get(roomGetRequestDto);
        }
        return null;
    }

    @Override
    public RoomInfoDto pause(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        boolean valid = verifyPermission(roomUpdateStatusRequestDto.getId(), roomUpdateStatusRequestDto.getUserId());
        if (!valid) {
            return null;
        }

        boolean result = updateStatus(roomUpdateStatusRequestDto.getId(), ClassRoomStatus.ClassRoomStatusPrepare);
        if (result) {
            RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
            roomGetRequestDto.setId(roomUpdateStatusRequestDto.getId());
            roomGetRequestDto.setUserId(roomUpdateStatusRequestDto.getUserId());
            return get(roomGetRequestDto);
        }
        return null;
    }

    @Override
    public RoomInfoDto start(RoomUpdateStatusRequestDto roomUpdateStatusRequestDto) {

        boolean valid = verifyPermission(roomUpdateStatusRequestDto.getId(), roomUpdateStatusRequestDto.getUserId());
        if (!valid) {
            return null;
        }
        boolean result = updateStatus(roomUpdateStatusRequestDto.getId(), ClassRoomStatus.ClassRoomStatusOn);
        if (result) {
            RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
            roomGetRequestDto.setId(roomUpdateStatusRequestDto.getId());
            roomGetRequestDto.setUserId(roomUpdateStatusRequestDto.getUserId());
            return get(roomGetRequestDto);
        }
        return null;
    }

    @Override
    public RoomInfoDto delete(RoomDeleteRequestDto roomDeleteRequestDto) {

        boolean valid = verifyPermission(roomDeleteRequestDto.getId(), roomDeleteRequestDto.getUserId());
        if (!valid) {
            return null;
        }

        RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
        roomGetRequestDto.setId(roomDeleteRequestDto.getId());
        roomGetRequestDto.setUserId(roomDeleteRequestDto.getUserId());
        RoomInfoDto roomInfoDto = get(roomGetRequestDto);
        if (roomInfoDto == null) {
            return null;
        }
        JSONObject jsonBoard = JSON.parseObject(roomInfoDto.getBoardsInfo() == null ? "" : roomInfoDto.getBoardsInfo());

        String cid = jsonBoard.get("cid").toString();
        BoardCreateResponse result = boardRoomService.deleteBoardRoom(cid);
        if (result.getCode() == 200) {
            log.info("deleteBoardRoom 删除成功!!");
        }
        if (this.removeById(roomDeleteRequestDto.getId())) {
            return roomInfoDto;
        }

        return null;
    }

    @Override
    public RoomInfoDto update(RoomUpdateRequestDto roomUpdateRequestDto) {

        ClassInfoEntity roomInfoEntity = new ClassInfoEntity();
        roomInfoEntity.setId(roomUpdateRequestDto.getId());
        if (StringUtils.isNotEmpty(roomUpdateRequestDto.getTitle())) {
            roomInfoEntity.setTitle(roomUpdateRequestDto.getTitle());
        }
        if (StringUtils.isNotEmpty(roomUpdateRequestDto.getNotice())) {
            roomInfoEntity.setNotice(roomUpdateRequestDto.getNotice());
        }
        if (StringUtils.isNotEmpty(roomUpdateRequestDto.getExtendsInfo())) {
            roomInfoEntity.setExtendsInfo(roomUpdateRequestDto.getExtendsInfo());
        }
        roomInfoEntity.setUpdatedAt(new Date());
        if (this.updateById(roomInfoEntity)) {
            ClassInfoEntity re = this.getById(roomUpdateRequestDto.getId());
            if (re != null) {
                RoomGetRequestDto roomGetRequestDto = new RoomGetRequestDto();
                roomGetRequestDto.setId(re.getId());
                roomGetRequestDto.setUserId(re.getTeacherId());
                return get(roomGetRequestDto);
            }
        }
        return null;
    }

    @Override
    public MeetingMemberInfo.Members updateMeetingInfo(MeetingActionRequestDto meetingActionRequestDto) {

        ClassInfoEntity roomInfoEntity = this.getById(meetingActionRequestDto.getId());
        if (roomInfoEntity == null) {
            log.warn("RoomInfoEntity Not Found. roomId:{}", meetingActionRequestDto.getId());
            return null;
        }

        ClassInfoEntity re = new ClassInfoEntity();
        re.setId(meetingActionRequestDto.getId());

        MeetingGetRequestDto meetingGetRequestDto = new MeetingGetRequestDto();
        meetingGetRequestDto.setId(meetingActionRequestDto.getId());

        MeetingMemberInfo.Members meetingInfo = getMeetingInfo(meetingGetRequestDto);
        if (meetingInfo == null) {
            meetingInfo = new MeetingMemberInfo.Members();
        }
        if (meetingActionRequestDto.getMembers() != null) {
            meetingInfo.setMembers(meetingActionRequestDto.getMembers());
        }
        if (meetingActionRequestDto.getAllMute() != null) {
            meetingInfo.setAllMute(meetingActionRequestDto.getAllMute());
        }
        if (meetingActionRequestDto.getInteractionAllowed() != null) {
            meetingInfo.setInteractionAllowed(meetingActionRequestDto.getInteractionAllowed());
        }
        re.setMeetingInfo(JSONObject.toJSONString(meetingInfo));
        re.setUpdatedAt(new Date());

        if (this.updateById(re)) {
            return meetingInfo;
        }
        return null;
    }

    @Override
    public MeetingMemberInfo.Members getMeetingInfo(MeetingGetRequestDto meetingGetRequestDto) {

        ClassInfoEntity roomInfoEntity = this.getById(meetingGetRequestDto.getId());
        if (roomInfoEntity == null) {
            log.warn("RoomInfoEntity Not Found. roomId:{}", meetingGetRequestDto.getId());
            return null;
        }

        return JSONObject.parseObject(roomInfoEntity.getMeetingInfo(), MeetingMemberInfo.Members.class);
    }

    @Override
    public boolean handlePushStreamEventCallback(LivePushStreamEventRequestDto livePushStreamEventRequestDto) {

        boolean valid = videoCloudService.validLiveCallbackSign(livePushStreamEventRequestDto.getLiveSignature(), livePushStreamEventRequestDto.getLiveTimestamp());
        if (!valid) {
            log.warn("InvalidLiveCallbackSign");
            return false;
        }
        ClassInfoEntity roomInfoEntity = null;

        // StreamId是通过推流URL中的多个字段拼接生成，具体拼接规则为：
        // 如果是视频连麦，其StreamId为：${连麦应用ID}_${房间ID}_${主播ID}_camera。
        // 如果是纯语音连麦，其StreamId为：${连麦应用ID}_${房间ID}_${主播ID}_audio。
        // 见文档：https://help.aliyun.com/document_detail/450515.html
        if (livePushStreamEventRequestDto.getId().endsWith("_camera") || livePushStreamEventRequestDto.getId().endsWith("_audio")) {
            //表明是连麦id
            String[] s = livePushStreamEventRequestDto.getId().split("_");
            if (s.length >= 3) {
                String meetingId = s[1];
                roomInfoEntity = this.lambdaQuery().ge(ClassInfoEntity::getMeetingId, meetingId).one();
            }
        } else {
            roomInfoEntity = this.getById(livePushStreamEventRequestDto.getId());
        }

        if (roomInfoEntity == null) {
            log.warn("handlePushStreamEventCallback roomInfoEntity is null");
            return true;
        }

        if (PushStreamStatus.PUBLIC.getStatus().equals(livePushStreamEventRequestDto.getAction())) {
            if (roomInfoEntity.getStatus() == ClassRoomStatus.ClassRoomStatusOff.getVal() || roomInfoEntity.getStatus() == ClassRoomStatus.ClassRoomStatusPrepare.getVal()) {
                updateStatus(roomInfoEntity.getId(), ClassRoomStatus.ClassRoomStatusOn);
            }
        } else if (PushStreamStatus.PUBLIC_DONE.getStatus().equals(livePushStreamEventRequestDto.getAction())) {
            if (roomInfoEntity.getStatus() == ClassRoomStatus.ClassRoomStatusOn.getVal()) {
                updateStatus(roomInfoEntity.getId(), ClassRoomStatus.ClassRoomStatusPrepare);
            }
        }

        return true;
    }

    @Override
    public JumpUrlResponse getLiveJumpUrl(JumpUrlRequestDto jumpUrlRequestDto, String serverHost) {

        try {
            // 设置过期时间
            long exp = System.currentTimeMillis() / 1000L + EXPIRE_TIME;
            // 设置头部信息
            Map<String, Object> header = new HashMap<>(2);
            // 返回token字符串
            String token = JWT.create()
                    .withHeader(header)
                    .withClaim("user_id", jumpUrlRequestDto.getUserId())
                    .withClaim("live_id", jumpUrlRequestDto.getLiveId())
                    .withClaim("user_name", jumpUrlRequestDto.getUserName())
                    .withClaim("app_server", serverHost)
                    .withClaim("exp", exp)
                    .sign(Algorithm.HMAC256(TOKEN_SECRET));

            String liveJumpUrl = String.format("auipusher://page/live-room?app_server=%s&token=%s&user_id=%s&user_name=%s&live_id=%s",
                    UriUtils.encodePath(serverHost, StandardCharsets.UTF_8),
                    token,
                    UriUtils.encodePath(jumpUrlRequestDto.getUserId(), StandardCharsets.UTF_8),
                    UriUtils.encodePath(jumpUrlRequestDto.getUserName(), StandardCharsets.UTF_8),
                    UriUtils.encodePath(jumpUrlRequestDto.getLiveId(), StandardCharsets.UTF_8));
            return JumpUrlResponse.builder().liveJumpUrl(liveJumpUrl).build();
        } catch (Exception e) {
            log.error("getLiveJumpUrl exception: %s", e);
        }
        return null;
    }

    @Override
    public AuthTokenResponse verifyAuthToken(AuthTokenRequestDto authTokenRequestDto) {

        try {
            Algorithm algorithm = Algorithm.HMAC256(TOKEN_SECRET);
            DecodedJWT decode = JWT.require(algorithm).build().verify(authTokenRequestDto.getToken());

            Map<String, Claim> claims = decode.getClaims();
            String userId = claims.get("user_id").asString();
            if (!authTokenRequestDto.getUserId().equals(userId)) {
                log.warn("verifyAuthToken. userId not matched");
                return null;
            }
            String liveId = claims.get("live_id").asString();
            if (!authTokenRequestDto.getLiveId().equals(liveId)) {
                log.warn("verifyAuthToken. liveId not matched");
                return null;
            }

            String userName = null;
            if (claims.containsKey("user_name")) {
                userName = claims.get("user_name").asString();
            }
            if (StringUtils.isNotEmpty(authTokenRequestDto.getUserName()) && !authTokenRequestDto.getUserName().equals(userName)) {
                log.warn("verifyAuthToken. userName not matched");
                return null;
            }

            String appServer = claims.get("app_server").asString();
            if (!authTokenRequestDto.getAppServer().equals(appServer)) {
                log.warn("verifyAuthToken. appServer not matched");
                return null;
            }

            // 生成登录token
            String token = JwtUtils.generateToken(userName);
            return AuthTokenResponse.builder().loginToken(token).build();
        } catch (JWTVerificationException e) {
            log.error("verifyAuthToken: %s", e);
        }
        return null;
    }

    @Override
    public RtcAuthTokenResponse getRtcAuthToken(RtcAuthTokenRequestDto rtcAuthTokenRequestDto) {

        // 24小时有效
        long timestamp = DateUtils.addDays(new Date(), 1).getTime() / 1000;
        String token = videoCloudService.getRtcAuth(rtcAuthTokenRequestDto.getRoomId(), rtcAuthTokenRequestDto.getUserId(), timestamp);
        return RtcAuthTokenResponse.builder().authToken(token).timestamp(timestamp).build();
    }

    @Override
    public boolean sendLikeMessage(LikeMessageSendRequestDto likeMessageSendRequestDto) {

        // 调用融云接口发送消息

        // 统计

        return true;
    }

    @Override
    public RoomInfoDto.Metrics getStatistics(StatisticsGetRequestDto statisticsGetRequestDto) {

        return videoCloudService.getGroupDetails(statisticsGetRequestDto.getChatroomId());
    }

    @Override
    public BoardAuthResponse getWhiteboardAuthInfo() {
        String Nonce = UUID.randomUUID().toString().replaceAll("-", "");
        int CurTime = Math.round((float) System.currentTimeMillis() / 1000);
        String CheckSum = getCheckSum(APP_SECRET, Nonce, CurTime);
        return BoardAuthResponse.builder()
                .nonce(Nonce)
                .curTime(CurTime)
                .checksum(CheckSum)
                .build();
    }

    public static String getCheckSum(String appSecret, String nonce, int curTime) {
        return encode(appSecret + nonce + curTime);
    }

    private static String encode(String value) {
        if (value == null) {
            return null;
        }
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("sha1");
            messageDigest.update(value.getBytes());
            return getFormattedText(messageDigest.digest());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String getFormattedText(byte[] bytes) {
        int lens = bytes.length;
        StringBuilder buf = new StringBuilder(lens * 2);
        for (byte aByte : bytes) {
            buf.append(HEX_DIGITS[(aByte >> 4) & 0x0f]);
            buf.append(HEX_DIGITS[aByte & 0x0f]);
        }
        return buf.toString();
    }

    private boolean verifyPermission(String roomId, String reqUid) {

        ClassInfoEntity roomInfoEntity = this.getById(roomId);
        if (roomInfoEntity == null) {
            log.warn("RoomInfoEntity Not Found. roomId:{}", roomId);
            return true;
        }

        if (!roomInfoEntity.getTeacherId().equals(reqUid)) {
            log.warn("Insufficient permission. roomId:{}, anthor:{}, reqUid:{}", roomId,
                    roomInfoEntity.getTeacherId(), reqUid);
            return false;
        }
        return true;
    }

    private boolean updateStatus(String id, ClassRoomStatus liveStatus) {

        ClassInfoEntity roomInfoEntity = new ClassInfoEntity();
        roomInfoEntity.setId(id);
        roomInfoEntity.setStatus((long) liveStatus.getVal());

        switch (liveStatus) {
            case ClassRoomStatusPrepare:
                break;
            case ClassRoomStatusOn:
                roomInfoEntity.setStartedAt(new Date());
                break;
            case ClassRoomStatusOff:
                roomInfoEntity.setStoppedAt(new Date());
        }
        roomInfoEntity.setUpdatedAt(new Date());
        return this.updateById(roomInfoEntity);
    }

    private RoomInfoDto getRoomInfo(RoomGetRequestDto roomGetRequestDto, CountDownLatch countDownLatch) {

        try {
            return get(roomGetRequestDto);
        } catch (Exception e) {
            log.error(String.format("getRoomInfo. roomGetRequestDto: %s", JSONObject.toJSONString(roomGetRequestDto)), e);
        } finally {
            countDownLatch.countDown();
        }
        return null;
    }

    private String getTitle(ClassInfoEntity roomInfoEntity) {

        return String.format("%s_%s_%s_camera", liveMicAppId, roomInfoEntity.getMeetingId(), roomInfoEntity.getTeacherId());
    }

    private boolean isOwner(String anchor, String userId) {

        return StringUtils.isNotEmpty(anchor) && anchor.equals(userId);
    }

    @Override
    public Result returnResult(Object object) {
        String jsonStr = JSONObject.toJSONString(object);
        Map<String, Object> map = JSON.parseObject(jsonStr, Map.class);
        return Result.ok(map);
    }

    public boolean isExistById(String id) {
        ClassInfoEntity roomInfoEntity = this.getById(id);
        return roomInfoEntity != null;
    }

    @Override
    public ClassInfoEntity getClassInfoEntity(String classId) {

        ClassInfoEntity roomInfoEntity = this.getById(classId);
        if (roomInfoEntity == null) {
            log.warn("get roomInfoEntity is null. classId:{}", classId);
            return null;
        }
        return roomInfoEntity;
    }
}