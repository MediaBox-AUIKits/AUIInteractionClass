package com.aliyuncs.aui.dto.enums;

/**
 * 直播状态
 */
public enum ClassServerType {

    // 网易
    NetEase(0);

    private final int val;

    public static ClassServerType of(int val) {

        for (ClassServerType value : ClassServerType.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    ClassServerType(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }

}
