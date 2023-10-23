package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson2.util.DateUtils;
import com.aliyuncs.aui.service.RongCloudServer;
import io.rong.RongCloud;
import io.rong.models.chatroom.ChatroomMember;
import io.rong.models.chatroom.ChatroomModel;
import io.rong.models.response.ListGagChatroomUserResult;
import io.rong.models.response.ResponseResult;
import io.rong.models.response.StatusResult;
import io.rong.models.response.TokenResult;
import io.rong.models.user.UserModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import javax.annotation.PostConstruct;
import java.util.Date;
import java.util.UUID;

/**
 * 融云服务实现类
 */
@Service
@Slf4j
public class RongCloudServerImpl implements RongCloudServer {

    private static final int RETRY = 2;
    private static RongCloud rongCloud;

    @Value("${biz.live_rongcloud_im.app_key}")
    private String appKey;

    @Value("${biz.live_rongcloud_im.app_secret}")
    private String appSecret;

    @PostConstruct
    public void init() {

        rongCloud = RongCloud.getInstance(appKey, appSecret);
    }

    /**
     * 注册用户，生成用户在融云的唯一身份标识 Token
     * 见文档：<a href="https://doc.rongcloud.cn/imserver/server/v1/user/register">...</a>
     */
    @Override
    public String getToken(String userId, String userName, String portrait) {

        UserModel userModel = new UserModel()
                .setId(userId)
                .setName(userName)
                .setPortrait(portrait);

        int i = 0;
        while (i++ < RETRY) {
            long start = System.currentTimeMillis();
            try {
                TokenResult result = rongCloud.user.register(userModel);
                log.info("register, userId:{}, userName:{}, consume:{}, result:{}", userId, userName, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.code == 200) {
                    return result.getToken();
                }
            } catch (Exception e) {
                log.error("RongCloudServer.getToken error. userId:{}, userName:{}, e:{}", userId, userName, e.toString());
            }
        }
        return null;
    }

    @Override
    public String createChatroom(String name) {
        String chatroomId = UUID.randomUUID().toString().replaceAll("-", "");
        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);
        chatroomModel.setName(name);

        int i = 0;
        while (i++ < RETRY) {
            long start = System.currentTimeMillis();
            try {
                ResponseResult responseResult = rongCloud.chatroom.create(new ChatroomModel[]{chatroomModel});
                log.info("createChatroom, chatroomId:{}, name:{}, consume:{}, result:{}", chatroomId, name, (System.currentTimeMillis() - start), JSONObject.toJSONString(responseResult));
                if (responseResult.getCode() == 200) {
                    log.info("rongCloud createChatroom: success");
                    return chatroomId;
                }
            } catch (Exception e) {
                log.error("RongCloudServer.createChatroom error. chatroomId:{}, name:{}, e:{}", chatroomId, name, e.toString());
            }
        }
        return null;
    }

    @Override
    public boolean muteUser(String chatroomId, String userId, Integer minute) {

        ChatroomMember chatroomMember = new ChatroomMember();
        chatroomMember.setId(userId);
        chatroomMember.setChatroomId(chatroomId);

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);
        chatroomModel.setMembers(new ChatroomMember[]{chatroomMember});
        chatroomModel.setMinute(minute);
        chatroomModel.setNeedNotify(true);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                // :封禁的聊天室信息，其中聊天室 d（必传）,minute(必传), memberIds（必传支持多个最多20个）
                ResponseResult result = rongCloud.chatroom.muteMembers.add(chatroomModel);
                log.info("muteUser.add, chatroomId:{}, userId:{}, minute:{}, consume:{}, result:{}", chatroomId, userId, minute, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.getCode() == 200) {
                    return true;
                }
            } catch (Exception e) {
                log.error("RongCloudServer.muteUser error. chatroomId:{}, userId:{}, minute:{}, e:{}", chatroomId, userId, minute, e.toString());
            }
        }
        return false;
    }

    @Override
    public boolean cancelMuteUser(String chatroomId, String userId) {

        ChatroomMember chatroomMember = new ChatroomMember();
        chatroomMember.setId(userId);
        chatroomMember.setChatroomId(chatroomId);

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);
        chatroomModel.setMembers(new ChatroomMember[]{chatroomMember});
        chatroomModel.setNeedNotify(true);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                ResponseResult result = rongCloud.chatroom.muteMembers.remove(chatroomModel);
                log.info("cancelMuteUser.add, chatroomId:{}, userId:{}, consume:{}, result:{}", chatroomId, userId, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.getCode() == 200) {
                    return true;
                }
            } catch (Exception e) {
                log.error("RongCloudServer.cancelMuteUser error. chatroomId:{}, userId:{}, e:{}", chatroomId, userId, e.toString());
            }
        }
        return false;
    }

    @Override
    public boolean isMuteUser(String chatroomId, String userId) {

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                ListGagChatroomUserResult result = rongCloud.chatroom.muteMembers.getList(chatroomModel);
                log.info("listMuteUsers.add, chatroomId:{}, userId:{}, consume:{}, result:{}", chatroomId, userId, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.getCode() == 200 && !CollectionUtils.isEmpty(result.getMembers())) {
                    for (ChatroomMember member : result.getMembers()) {
                        if (member.getId().equals(userId)) {
                            Date date = DateUtils.parseDate(member.getTime(), "yyyy/MM/dd HH:mm:ss");
                            if (date.getTime() >= System.currentTimeMillis()) {
                                return true;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("RongCloudServer.listMuteUsers error. chatroomId:{}, userId:{}, e:{}", chatroomId, userId, e.toString());
            }
        }
        return false;
    }

    @Override
    public boolean muteChatroom(String chatroomId) {

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);
        chatroomModel.setNeedNotify(true);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                ResponseResult result = rongCloud.chatroom.banAllMember.add(chatroomModel);
                log.info("muteChatroom, chatroomId:{}, consume:{}, result:{}", chatroomId, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.getCode() == 200) {
                    return true;
                }
            } catch (Exception e) {
                log.error("RongCloudServer.muteChatroom error. chatroomId:{},  e:{}", chatroomId, e.toString());
            }
        }
        return false;
    }

    @Override
    public boolean cancelMuteChatroom(String chatroomId) {

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);
        chatroomModel.setNeedNotify(true);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                ResponseResult result = rongCloud.chatroom.banAllMember.remove(chatroomModel);
                log.info("cancelMuteChatroom, chatroomId:{}, consume:{}, result:{}", chatroomId, (System.currentTimeMillis() - start), JSONObject.toJSONString(result));
                if (result.getCode() == 200) {
                    return true;
                }
            } catch (Exception e) {
                log.error("RongCloudServer.cancelMuteChatroom error. chatroomId:{},  e:{}", chatroomId, e.toString());
            }
        }
        return false;
    }

    @Override
    public boolean isMuteChatroom(String chatroomId) {

        ChatroomModel chatroomModel = new ChatroomModel();
        chatroomModel.setId(chatroomId);

        int i = 0;
        while (i++ < RETRY) {
            try {
                long start = System.currentTimeMillis();
                StatusResult check = rongCloud.chatroom.banAllMember.check(chatroomModel);
                log.info("isMuteChatroom, chatroomId:{}, consume:{}, result:{}", chatroomId, (System.currentTimeMillis() - start), JSONObject.toJSONString(check));
                if (check.getCode() == 200) {
                    return "1".equals(check.getStatus());
                }
            } catch (Exception e) {
                log.error("RongCloudServer.isMuteChatroom error. chatroomId:{},  e:{}", chatroomId, e.toString());
            }
        }
        return false;
    }
}
