package com.aliyuncs.aui.dto.enums;

/**
 * 课堂成员状态
 */
public enum ClassMemberStatus {

    All(0),
    Normal(1),
    Exit(2),
    Kick(3);
    private final int val;

    public static ClassMemberStatus of(int val) {

        for (ClassMemberStatus value : ClassMemberStatus.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    ClassMemberStatus(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }

}
