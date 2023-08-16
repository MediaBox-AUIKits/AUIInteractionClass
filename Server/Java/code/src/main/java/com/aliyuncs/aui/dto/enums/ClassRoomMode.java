package com.aliyuncs.aui.dto.enums;

/**
 * 直播模式
 */
public enum ClassRoomMode {

    ClassRoomOpen(0L), //公开课
    ClassRoomBig(1L), //大班课
    ClassRoomSmall(2L); //小班课

    private final long val;

    public static ClassRoomMode of(long val) {

        for (ClassRoomMode value : ClassRoomMode.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    ClassRoomMode(long val) {
        this.val = val;
    }

    public long getVal() {
        return val;
    }
}
