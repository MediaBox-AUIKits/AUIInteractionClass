package com.aliyuncs.aui.dto.enums;

/**
 * 自定义消息类型
 *
 * @author chunlei.zcl
 */
public enum MessageType {

    Join(11001),
    Exit(11002),
    Kick(11003);
    private final int val;

    public static MessageType of(int val) {

        for (MessageType value : MessageType.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    MessageType(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }
}
