package com.aliyuncs.aui.service;

import com.aliyuncs.aui.dto.req.RoomCreateRequestDto;
import com.aliyuncs.aui.dto.res.BoardAuthResponse;
import com.aliyuncs.aui.dto.res.BoardCreateResponse;

public interface BoardRoomService {

    BoardCreateResponse createBoardRoom(RoomCreateRequestDto roomCreateRequestDto, BoardAuthResponse boardAuthResponse, String boardId);

    BoardCreateResponse deleteBoardRoom(String cid);

}
