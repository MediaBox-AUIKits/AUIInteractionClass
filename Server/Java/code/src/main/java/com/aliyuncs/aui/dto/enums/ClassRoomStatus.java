package com.aliyuncs.aui.dto.enums;

/**
 * 直播状态
 */
public enum ClassRoomStatus {

    /**
    * 准备中或暂停中
    */
    ClassRoomStatusPrepare(0),

    /**
     * 已开始
     */
    ClassRoomStatusOn(1),

    /**
     * 已结束
     */
    ClassRoomStatusOff(2);

    private final int val;

    public static ClassRoomStatus of(int val) {

        for (ClassRoomStatus value : ClassRoomStatus.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    ClassRoomStatus(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }

}
