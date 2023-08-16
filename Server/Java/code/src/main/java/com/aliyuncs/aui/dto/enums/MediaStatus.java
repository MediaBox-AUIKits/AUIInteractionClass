package com.aliyuncs.aui.dto.enums;

/**
 * 媒资状态
 */
public enum MediaStatus {

    VodStatusPrepare(0),
    VodStatusOK(1),
    VodStatusFailed(2);
    private final int val;

    public static MediaStatus of(int val) {

        for (MediaStatus value : MediaStatus.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    MediaStatus(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }

}
