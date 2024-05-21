package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.CommonRequest;
import com.aliyuncs.CommonResponse;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.aui.dto.ClassMemberDto;
import com.aliyuncs.aui.dto.LinkInfo;
import com.aliyuncs.aui.dto.PullLiveInfo;
import com.aliyuncs.aui.dto.PushLiveInfo;
import com.aliyuncs.aui.dto.enums.MediaStatus;
import com.aliyuncs.aui.dto.req.ImTokenRequestDto;
import com.aliyuncs.aui.dto.res.ImTokenResponseDto;
import com.aliyuncs.aui.dto.res.NewImTokenResponseDto;
import com.aliyuncs.aui.dto.res.RoomInfoDto;
import com.aliyuncs.aui.service.ALiYunService;
import com.aliyuncs.aui.service.RongCloudServer;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.exceptions.ServerException;
import com.aliyuncs.http.FormatType;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.live.model.v20161101.*;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.vod.model.v20170321.GetPlayInfoRequest;
import com.aliyuncs.vod.model.v20170321.GetPlayInfoResponse;
import com.aliyuncs.vod.model.v20170321.SearchMediaRequest;
import com.aliyuncs.vod.model.v20170321.SearchMediaResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.time.DateUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * 视频云服务实现类
 *
 * @author chunlei.zcl
 */
@Service
@Slf4j
public class ALiYunServiceImpl implements ALiYunService {

    private static final String LIVE_DOMAIN = "live.aliyun.com";

    private static final String LIVE_OPEN_API_DOMAIN = "live.aliyuncs.com";

    @Value("${biz.openapi.access.key}")
    private String accessKeyId;
    @Value("${biz.openapi.access.secret}")
    private String accessKeySecret;
    @Value("${biz.live_im.app_id}")
    private String imAppId;
    @Value("${biz.live_stream.push_url}")
    private String liveStreamPushUrl;
    @Value("${biz.live_stream.pull_url}")
    private String liveStreamPullUrl;
    @Value("${biz.live_stream.push_auth_key}")
    private String liveStreamPushAuthKey;
    @Value("${biz.live_stream.pull_auth_key}")
    private String liveStreamPullAuthKey;
    @Value("${biz.live_stream.app_name}")
    private String liveStreamAppName;
    @Value("${biz.live_stream.auth_expires}")
    private Long liveStreamAuthExpires;
    @Value("${biz.live_mic.app_id}")
    private String liveMicAppId;
    @Value("${biz.live_mic.app_key}")
    private String liveMicAppKey;
    @Value("${biz.live_callback.auth_key}")
    private String liveCallbackAuthKey;

    @Value("${biz.new_im.appId}")
    private String appId;

    @Value("${biz.new_im.appKey}")
    private String appKey;

    @Value("${biz.new_im.appSign}")
    private String appSign;

    private IAcsClient client;

    @Resource
    private RongCloudServer rongCloudServer;

    @PostConstruct
    public void init() {

        DefaultProfile profile = DefaultProfile.getProfile("cn-shanghai", accessKeyId, accessKeySecret);
        client = new DefaultAcsClient(profile);
    }

    @Override
    public ImTokenResponseDto getImToken(ImTokenRequestDto imTokenRequestDto) {

        long start = System.currentTimeMillis();
        GetMessageTokenRequest request = new GetMessageTokenRequest();
        request.setAppId(imAppId);
        request.setDeviceId(imTokenRequestDto.getDeviceId());
        request.setDeviceType(imTokenRequestDto.getDeviceType());
        request.setUserId(imTokenRequestDto.getUserId());
        log.info("getImToken, request:{}", JSONObject.toJSONString(imTokenRequestDto));

        try {
            GetMessageTokenResponse response = client.getAcsResponse(request);
            log.info("getImToken, response:{}, consume:{}", JSONObject.toJSONString(response), (System.currentTimeMillis() - start));

            return ImTokenResponseDto.builder()
                    .aLiYunAccessToken(response.getResult().getAccessToken())
                    .aLiYunRefreshToken(response.getResult().getRefreshToken())
                    .build();
        } catch (ServerException e) {
            log.error("getImToken ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("getImToken ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("getImToken Exception. error:{}", e.getMessage());
        }
        return null;
    }

    @Override
    public NewImTokenResponseDto getNewImToken(ImTokenRequestDto imTokenRequestDto) {

        String role = imTokenRequestDto.getRole();
        if (role == null) {
            role = "";
        }
        String nonce = UUID.randomUUID().toString();
        long timestamp = DateUtils.addDays(new Date(), 2).getTime() / 1000;
        String signContent = String.format("%s%s%s%s%s%s", appId, appKey, imTokenRequestDto.getUserId(), nonce, timestamp, role);
        String appToken = org.apache.commons.codec.digest.DigestUtils.sha256Hex(signContent);

        NewImTokenResponseDto newImTokenResponseDto = NewImTokenResponseDto.builder()
                .appId(appId)
                .appSign(appSign)
                .appToken(appToken)
                .auth(NewImTokenResponseDto.Auth.builder()
                        .userId(imTokenRequestDto.getUserId())
                        .nonce(nonce)
                        .timestamp(timestamp)
                        .role(role)
                        .build())
                .build();

        log.info("getNewImToken. userId:{}, newImTokenResponseDto:{}", imTokenRequestDto.getUserId(), JSONObject.toJSONString(newImTokenResponseDto));
        return newImTokenResponseDto;
    }


    @Override
    public String createMessageGroup(String teacherId) {
        long start = System.currentTimeMillis();
        CreateMessageGroupRequest request = new CreateMessageGroupRequest();
        request.setAppId(imAppId);
        request.setCreatorId(teacherId);
        log.info("aLiYun, request:{}", JSONObject.toJSONString(request));
        try {
            CreateMessageGroupResponse createMessageGroupResponse = client.getAcsResponse(request);
            log.info("aLiYun, response:{}, consume:{}", JSONObject.toJSONString(createMessageGroupResponse), (System.currentTimeMillis() - start));
            log.info("aLiYunMessageGroup  success");

            return createMessageGroupResponse.getResult().getGroupId();
        } catch (ServerException e) {
            log.error("createMessageGroup ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("createMessageGroup ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("createMessageGroup Exception. error:{}", e.getMessage());
        }
        return null;
    }

    public String createNewImMessageGroup(String groupId, String creatorId) {

        long start = System.currentTimeMillis();
        CreateLiveMessageGroupRequest request = new CreateLiveMessageGroupRequest();
        request.setAppId(appId);
        request.setGroupId(groupId);
        request.setCreatorId(creatorId);

        log.info("createNewImMessageGroup, request:{}", JSONObject.toJSONString(request));

        try {
            CreateLiveMessageGroupResponse acsResponse = client.getAcsResponse(request);
            log.info("createNewImMessageGroup, response:{}, consume:{}", JSONObject.toJSONString(acsResponse), (System.currentTimeMillis() - start));
            return acsResponse.getGroupId();
        } catch (ServerException e) {
            log.error("createNewImMessageGroup ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("createNewImMessageGroup ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("createNewImMessageGroup Exception. error:{}", e.getMessage());
        }
        return null;
    }

    public boolean sendMessageToGroup(String groupId, Integer type, ClassMemberDto classMemberDto) {

        SendMessageToGroupRequest request = new SendMessageToGroupRequest();
        request.setAppId(imAppId);
        request.setGroupId(groupId);
        request.setType(type);
        request.setData(JSONObject.toJSONString(classMemberDto));
        request.setOperatorUserId("System");
        request.setSkipAudit(true);
        try {
            SendMessageToGroupResponse response = client.getAcsResponse(request);
            log.info("data:{}, SendMessageToGroupResponse:{}", JSONObject.toJSONString(classMemberDto), JSONObject.toJSONString(response));
            return true;
        } catch (ServerException e) {
            log.error("sendMessageToGroup ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("sendMessageToGroup ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("sendMessageToGroup Exception. error:{}", e.getMessage());
        }
        return false;
    }

    public boolean sendMessageToNewGroup(String groupId, Integer type, ClassMemberDto classMemberDto) {

        SendLiveMessageGroupRequest request = new SendLiveMessageGroupRequest();
        request.setAppId(appId);
        request.setGroupId(groupId);
        request.setSenderId(classMemberDto.getUserId());
        request.setBody(JSONObject.toJSONString(classMemberDto));
        request.setMsgType((long)type);
        try {
            SendLiveMessageGroupResponse acsResponse = client.getAcsResponse(request);
            log.info("data:{}, sendMessageToNewGroup:{}", JSONObject.toJSONString(classMemberDto), JSONObject.toJSONString(acsResponse));
            return true;
        } catch (ServerException e) {
            log.error("sendMessageToNewGroup ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("sendMessageToNewGroup ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("sendMessageToNewGroup Exception. error:{}", e.getMessage());
        }
        return false;
    }

    @Override
    public PushLiveInfo getPushLiveInfo(String streamName) {

        String pushAuthKey = getAAuth(streamName, liveStreamPushAuthKey);
        String url = String.format("%s/%s/%s?auth_key=%s", liveStreamPushUrl, liveStreamAppName, streamName, pushAuthKey);
        PushLiveInfo pushLiveInfo = PushLiveInfo.builder()
                .rtmpUrl(String.format("%s://%s", "rtmp", url))
                .rtsUrl(String.format("%s://%s", "artc", url))
                .srtUrl(String.format("%s://%s", "srt", url))
                .build();

        log.info("getPushLiveInfo. streamName:{}, pushLiveInfo:{}", streamName, JSONObject.toJSONString(pushLiveInfo));
        return pushLiveInfo;
    }

    @Override
    public PullLiveInfo getPullLiveInfo(String streamName, String screenStreamName) {

        return getPullLiveInfo(liveStreamAppName, streamName);
    }

    @Override
    public LinkInfo getRtcInfo(String channelId, String userId, String teacherId) {

        // 24小时有效
        long timestamp = DateUtils.addDays(new Date(), 1).getTime() / 1000;
        String token = getRtcAuth(channelId, userId, timestamp);

        String rtcPushUrl = String.format("artc://%s/push/%s?sdkAppId=%s&userId=%s&timestamp=%d&token=%s",
                LIVE_DOMAIN, channelId, liveMicAppId, userId, timestamp, token);

        String rtcPullUrl = String.format("artc://%s/play/%s?sdkAppId=%s&userId=%s&timestamp=%d&token=%s",
                LIVE_DOMAIN, channelId, liveMicAppId, userId, timestamp, token);

        // camera 流
        String streamName = String.format("%s_%s_%s_camera", liveMicAppId, channelId, teacherId);
        // shareScreen 流
        String screenStreamName = String.format("%s_%s_%s_shareScreen", liveMicAppId, channelId, teacherId);

        PullLiveInfo rtcLinkCDNUrl = getPullLiveInfo("live", streamName, screenStreamName);

        LinkInfo linkInfo = LinkInfo.builder().rtcPushUrl(rtcPushUrl).rtcPullUrl(rtcPullUrl).cdnPullInfo(rtcLinkCDNUrl).build();

        log.info("getRtcInfo. channelId:{}, userId:{}, linkInfo:{}", channelId, userId, JSONObject.toJSONString(linkInfo));

        return linkInfo;
    }

    @Override
    public String searchMediaByTitle(String title) {

        long start = System.currentTimeMillis();
        SearchMediaRequest request = new SearchMediaRequest();
        request.setMatch(String.format("Title='%s'", title));
        request.setAcceptFormat(FormatType.JSON);

        try {
            SearchMediaResponse acsResponse = client.getAcsResponse(request);
            log.info("searchMediaByTitle, title:{}, response:{}, consume:{}", title, JSONObject.toJSONString(acsResponse), (System.currentTimeMillis() - start));
            if (CollectionUtils.isNotEmpty(acsResponse.getMediaList())) {
                return acsResponse.getMediaList().get(0).getMediaId();
            }
        } catch (ServerException e) {
            log.error("searchMediaByTitle ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("searchMediaByTitle ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("searchMediaByTitle Exception. error:{}", e.getMessage());
        }

        return null;
    }

    @Override
    public RoomInfoDto.VodInfo getPlayInfo(String mediaId) {

        long start = System.currentTimeMillis();
        GetPlayInfoRequest request = new GetPlayInfoRequest();
        request.setVideoId(mediaId);
        try {
            GetPlayInfoResponse acsResponse = client.getAcsResponse(request);
            List<RoomInfoDto.PlayInfo> playInfos = new ArrayList<>();
            for (GetPlayInfoResponse.PlayInfo playInfo : acsResponse.getPlayInfoList()) {
                RoomInfoDto.PlayInfo playInfoTmp = new RoomInfoDto.PlayInfo();
                BeanUtils.copyProperties(playInfo, playInfoTmp);
                playInfoTmp.setPlayUrl(playInfo.getPlayURL());
                playInfoTmp.setBitRate(playInfo.getBitrate());
                playInfos.add(playInfoTmp);
            }
            log.info("getPlayInfo, mediaId:{}, response:{}, consume:{}", mediaId, JSONObject.toJSONString(acsResponse), (System.currentTimeMillis() - start));
            return RoomInfoDto.VodInfo.builder()
                    .playInfos(playInfos)
                    .status(MediaStatus.VodStatusOK.getVal())
                    .build();
        } catch (ServerException e) {
            log.error("getPlayInfo ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("getPlayInfo ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("getPlayInfo Exception. error:{}", e.getMessage());
        }

        return null;
    }

    @Override
    public RoomInfoDto.Metrics getGroupDetails(String groupId) {

        long start = System.currentTimeMillis();

        CommonRequest request = new CommonRequest();
        request.setSysMethod(MethodType.POST);

        request.setSysVersion("2016-11-01");
        request.setSysAction("GetGroupStatistics");
        request.setSysDomain(LIVE_OPEN_API_DOMAIN);
        request.putQueryParameter("AppId", imAppId);
        request.putQueryParameter("GroupId", groupId);

        try {
            CommonResponse response = client.getCommonResponse(request);
            log.info("getGroupDetails, response:{}, consume:{}", response.getData(), (System.currentTimeMillis() - start));
            JSONObject jsonObject = JSONObject.parseObject(response.getData());
            if (jsonObject.containsKey("Result")) {
                return JSONObject.parseObject(jsonObject.getJSONObject("Result").toJSONString(), RoomInfoDto.Metrics.class);
            }
        } catch (ServerException e) {
            log.error("getGroupDetails ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("getGroupDetails ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("getGroupDetails Exception. error:{}", e.getMessage());
        }
        return null;
    }

    @Override
    public RoomInfoDto.UserStatus getUserInfo(String groupId, String teacherId) {

        long start = System.currentTimeMillis();

        ListMessageGroupUserByIdRequest request = new ListMessageGroupUserByIdRequest();
        request.setAppId(imAppId);
        request.setGroupId(groupId);
        request.setUserIdList(Collections.singletonList(teacherId));

        try {
            ListMessageGroupUserByIdResponse acsResponse = client.getAcsResponse(request);
            log.info("getUserInfo, response:{}, consume:{}", JSONObject.toJSONString(acsResponse), (System.currentTimeMillis() - start));
            if (CollectionUtils.isEmpty(acsResponse.getResult().getUserList())) {
                log.info("getUserInfo is empty. groupId:{}, teacherId:{}", groupId, teacherId);
                return null;
            }
            ListMessageGroupUserByIdResponse.Result.UserListItem userListItem = acsResponse.getResult().getUserList().get(0);
            RoomInfoDto.UserStatus userStatus = new RoomInfoDto.UserStatus();
            userStatus.setMute(userListItem.getIsMute());
            userStatus.setMuteSource(userListItem.getMuteBy());

            return userStatus;
        } catch (ServerException e) {
            log.error("getUserInfo ServerException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (ClientException e) {
            log.error("getUserInfo ClientException. ErrCode:{}, ErrMsg:{}, RequestId:{}", e.getErrCode(), e.getErrMsg(), e.getRequestId());
        } catch (Exception e) {
            log.error("getUserInfo Exception. error:{}", e.getMessage());
        }
        return null;
    }

    @Override
    public boolean validLiveCallbackSign(String liveSignature, String liveTimestamp) {

        String signContent = String.format("%s|%s|%s", liveStreamPushUrl, liveTimestamp, liveCallbackAuthKey);
        String sum = DigestUtils.md5DigestAsHex(signContent.getBytes());
        if (!sum.equals(liveSignature)) {
            log.warn("validLiveCallbackSign sign invalid.signContent:{}", signContent);
            return false;
        }
        return true;
    }

    private PullLiveInfo getPullLiveInfo(String appName, String streamName, String screenStreamName) {

        String streamUrl = String.format("%s/%s/%s", liveStreamPullUrl, appName, streamName);
        String streamUrlOfOriaac = String.format("%s/%s/%s_oriaac", liveStreamPullUrl, appName, streamName);

        String pullAuthKey = getAAuth(streamName, liveStreamPullAuthKey);
        String pullAuthKeyOfOriaac = getAAuth(String.format("%s_oriaac", streamName), liveStreamPullAuthKey);
        String pullAuthKeyWithFlv = getAAuth(String.format("%s%s", streamName, ".flv"), liveStreamPullAuthKey);
        String pullAuthKeyWithFlvOfOriaac = getAAuth(String.format("%s_oriaac%s", streamName, ".flv"), liveStreamPullAuthKey);
        String pullAuthKeyWithM3u8 = getAAuth(String.format("%s%s", streamName, ".m3u8"), liveStreamPullAuthKey);
        String pullAuthKeyWithM3u8OfOriaac = getAAuth(String.format("%s_oriaac%s", streamName, ".m3u8"), liveStreamPullAuthKey);

        String screenStreamUrl = String.format("%s/%s/%s", liveStreamPullUrl, appName, screenStreamName);
        String screenStreamUrlOfOriaac = String.format("%s/%s/%s_oriaac", liveStreamPullUrl, appName, screenStreamName);

        String pullScreenAuthKey = getAAuth(screenStreamName, liveStreamPullAuthKey);
        String pullScreenAuthKeyOfOriaac = getAAuth(String.format("%s_oriaac", screenStreamName), liveStreamPullAuthKey);
        String pullScreenAuthKeyWithFlv = getAAuth(String.format("%s%s", screenStreamName, ".flv"), liveStreamPullAuthKey);
        String pullScreenAuthKeyWithFlvOfOriaac = getAAuth(String.format("%s_oriaac%s", screenStreamName, ".flv"), liveStreamPullAuthKey);
        String pullScreenAuthKeyWithM3u8 = getAAuth(String.format("%s%s", screenStreamName, ".m3u8"), liveStreamPullAuthKey);
        String pullScreenAuthKeyWithM3u8OfOriaac = getAAuth(String.format("%s_oriaac%s", screenStreamName, ".m3u8"), liveStreamPullAuthKey);


        PullLiveInfo pullLiveInfo = PullLiveInfo.builder()
                .rtmpUrl(String.format("%s://%s?auth_key=%s", "rtmp", streamUrl, pullAuthKey))
                .rtmpOriaacUrl(String.format("%s://%s?auth_key=%s", "rtmp", streamUrlOfOriaac, pullAuthKeyOfOriaac))
                .rtsUrl(String.format("%s://%s?auth_key=%s", "artc", streamUrl, pullAuthKey))
                .rtsOriaacUrl(String.format("%s://%s?auth_key=%s", "artc", streamUrlOfOriaac, pullAuthKeyOfOriaac))
                .flvUrl(String.format("https://%s.flv?auth_key=%s", streamUrl, pullAuthKeyWithFlv))
                .flvOriaacUrl(String.format("https://%s.flv?auth_key=%s", streamUrlOfOriaac, pullAuthKeyWithFlvOfOriaac))
                .hlsUrl(String.format("https://%s.m3u8?auth_key=%s", streamUrl, pullAuthKeyWithM3u8))
                .hlsOriaacUrl(String.format("https://%s.m3u8?auth_key=%s", streamUrlOfOriaac, pullAuthKeyWithM3u8OfOriaac))

                .rtmpScreenUrl(String.format("%s://%s?auth_key=%s", "rtmp", screenStreamUrl, pullScreenAuthKey))
                .rtmpScreenOriaacUrl(String.format("%s://%s?auth_key=%s", "rtmp", screenStreamUrlOfOriaac, pullScreenAuthKeyOfOriaac))
                .rtsScreenUrl(String.format("%s://%s?auth_key=%s", "artc", screenStreamUrl, pullScreenAuthKey))
                .rtsScreenOriaacUrl(String.format("%s://%s?auth_key=%s", "artc", screenStreamUrlOfOriaac, pullScreenAuthKeyOfOriaac))
                .flvScreenUrl(String.format("https://%s.flv?auth_key=%s", screenStreamUrl, pullScreenAuthKeyWithFlv))
                .flvScreenOriaacUrl(String.format("https://%s.flv?auth_key=%s", screenStreamUrlOfOriaac, pullScreenAuthKeyWithFlvOfOriaac))
                .hlsScreenUrl(String.format("https://%s.m3u8?auth_key=%s", screenStreamUrl, pullScreenAuthKeyWithM3u8))
                .hlsScreenOriaacUrl(String.format("https://%s.m3u8?auth_key=%s", screenStreamUrlOfOriaac, pullScreenAuthKeyWithM3u8OfOriaac))
                .build();

        log.info("getPullLiveInfo. streamName:{}, screenStreamName:{}, pullLiveInfo:{}", streamName, screenStreamName, JSONObject.toJSONString(pullLiveInfo));
        return pullLiveInfo;
    }


    public String getRtcAuth(String channelId, String userId, long timestamp) {

        String rtcAuthStr = String.format("%s%s%s%s%d", liveMicAppId, liveMicAppKey, channelId, userId, timestamp);
        String rtcAuth = getSHA256(rtcAuthStr);
        log.info("getRtcAuth. rtcAuthStr:{}, rtcAuth:{}", rtcAuthStr, rtcAuth);
        return rtcAuth;
    }


    private static String getSHA256(String str) {
        MessageDigest messageDigest;
        String encodestr = "";
        try {
            messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(str.getBytes(StandardCharsets.UTF_8));
            encodestr = byte2Hex(messageDigest.digest());
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return encodestr;
    }

    private static String byte2Hex(byte[] bytes) {
        StringBuilder stringBuffer = new StringBuilder();
        for (byte aByte : bytes) {
            String temp = Integer.toHexString(aByte & 0xFF);
            if (temp.length() == 1) {
                stringBuffer.append("0");
            }
            stringBuffer.append(temp);
        }
        return stringBuffer.toString();
    }

    /**
     * 获取鉴权。文档见：https://help.aliyun.com/document_detail/199349.html
     */
    private String getAAuth(String streamName, String authKey) {

        String rand = "0";
        String uid = "0";
        String path = String.format("/%s/%s", liveStreamAppName, streamName);
        long exp = System.currentTimeMillis() / 1000 + liveStreamAuthExpires;

        String signStr = String.format("%s-%d-%s-%s-%s", path, exp, rand, uid, authKey);

        String hashValue = DigestUtils.md5DigestAsHex(signStr.getBytes());

        String ak = String.format("%d-%s-%s-%s", exp, rand, uid, hashValue);

        log.info("getAAuth. signStr:{}, hashValue:{}, ak:{}", signStr, hashValue, ak);
        return ak;
    }
}
