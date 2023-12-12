package com.aliyuncs.aui.dto.enums;

/**
 * 课堂成员身份
 */
public enum Identity {

    All(0),
    Student(1),
    Assistant(2),
    Teacher(3);

    private final int val;

    public static Identity of(int val) {

        for (Identity value : Identity.values()) {
            if (val == value.getVal()) {
                return value;
            }
        }
        return null;
    }

    Identity(int val) {
        this.val = val;
    }

    public int getVal() {
        return val;
    }

}
