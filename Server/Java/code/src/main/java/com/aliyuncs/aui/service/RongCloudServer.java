package com.aliyuncs.aui.service;

/**
 * 融云IM服务
 */
public interface RongCloudServer {

    /**
    * 获取Token
    */
    String getToken(String userId, String userName, String portrait);

    /**
     * 禁言群成员
     */
    boolean muteUser(String chatroomId, String userId, Integer minute);


    /**
     * 解禁群成员
     */
    boolean cancelMuteUser(String chatroomId, String userId);


    /**
    * 创建聊天室
    */
    String createChatroom(String name);


    /**
     * 获取指定用户的禁言状态
     */
    boolean isMuteUser(String chatroomId, String userId);


    /**
     * 禁言聊天室
     */
    boolean muteChatroom(String chatroomId);

    /**
     * 解禁聊天室
     */
    boolean cancelMuteChatroom(String chatroomId);

    /**
     * 查询聊天室禁言状态
     */
    boolean isMuteChatroom(String chatroomId);


}
