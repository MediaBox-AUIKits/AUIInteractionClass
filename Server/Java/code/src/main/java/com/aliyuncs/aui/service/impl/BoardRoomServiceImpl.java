package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.aui.dto.req.BoardCreateRequest;
import com.aliyuncs.aui.dto.req.RoomCreateRequestDto;
import com.aliyuncs.aui.dto.res.BoardAuthResponse;
import com.aliyuncs.aui.dto.res.BoardCreateResponse;
import com.aliyuncs.aui.service.BoardRoomService;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
public class BoardRoomServiceImpl implements BoardRoomService {


    @Value("${room.boards.app_key}")
    private String APP_KEY;


    @Value("${room.boards.create_url}")
    private String CREATE_URL;

    @Value("${room.boards.delete_url}")
    private String DELETE_URL;

    @Value("${room.boards.channel_destroy_time}")
    private int channelDestroyTime;

    @Override
    public BoardCreateResponse createBoardRoom(RoomCreateRequestDto roomCreateRequestDto, BoardAuthResponse boardAuthResponse, String boardId) {
        // 添加header
        HttpPost httpPost = getHttpPost(boardAuthResponse);
        // 添加
        int uid = (int)(System.currentTimeMillis() / 1000);
        BoardCreateRequest boardCreateRequestDto = BoardCreateRequest.builder()
                .channelName(boardId)
                .uid(uid)
                .mode(2)
                .persistent(true)
                .platform(2)
                .channelDestroyTime(uid + channelDestroyTime)
                .build();
        String roomStringInfo = JSON.toJSONString(boardCreateRequestDto);
        httpPost.setEntity(new StringEntity(roomStringInfo, "UTF-8"));

        // post 请求
        CloseableHttpClient httpClient = HttpClients.createDefault();
        BoardCreateResponse boardRoomResponseDto = new BoardCreateResponse();
        try {
            // 执行http请求
            CloseableHttpResponse response = httpClient.execute(httpPost);
            String resultString = EntityUtils.toString(response.getEntity(), "utf-8");

            JSONObject jsonObject = JSON.parseObject(resultString);
            log.info("createBoardRoom:  {}", jsonObject);
            int codeStatus = jsonObject.getInteger("code");
            String msg = jsonObject.getString("msg") != null? jsonObject.getString("msg") : jsonObject.getString("errmsg");
            if (codeStatus == 200) {
                boardRoomResponseDto.setCode(codeStatus);
                boardRoomResponseDto.setMessage(msg);
                boardRoomResponseDto.setCid(jsonObject.getString("cid"));
                boardRoomResponseDto.setBoardTitle(roomCreateRequestDto.getTitle());
                boardRoomResponseDto.setUid(uid);
                boardRoomResponseDto.setBoardId(boardId);
                boardRoomResponseDto.setAppKey(APP_KEY);
            } else {
                boardRoomResponseDto.setCode(codeStatus);
                boardRoomResponseDto.setMessage(msg);
            }
        } catch (Exception e) {
            log.error(e.toString());
        }
        log.info("boardRoomResponseDto:  {}", boardRoomResponseDto);
        return boardRoomResponseDto;
    }

    @NotNull
    private HttpPost getHttpPost(BoardAuthResponse boardAuthResponse) {
        HttpPost httpPost = new HttpPost(CREATE_URL);

        httpPost.setHeader("Content-type", "application/json; chartset=UTF-8");
        httpPost.setHeader("User-Agent", "PostmanRuntime/7.26.2");
        httpPost.setHeader("Accept", "*/*");
        httpPost.setHeader("Accept-Encoding", "gzip, deflate, br");
        httpPost.setHeader("AppKey", APP_KEY);
        httpPost.setHeader("Nonce", boardAuthResponse.getNonce());
        httpPost.setHeader("CurTime", String.valueOf(boardAuthResponse.getCurTime()));
        httpPost.setHeader("CheckSum",  boardAuthResponse.getChecksum());
        return httpPost;
    }

    @Override
    public BoardCreateResponse deleteBoardRoom(String cid) {
        HttpDelete httpDelete = new HttpDelete(DELETE_URL + cid);

        BoardCreateResponse boardRoomResponseDto = new BoardCreateResponse();

        CloseableHttpClient httpClient = HttpClients.createDefault();
        try {
            CloseableHttpResponse response = httpClient.execute(httpDelete);
            int codeStatus = response.getStatusLine().getStatusCode();
            if (codeStatus == 200) {
                boardRoomResponseDto.setCode(codeStatus);
            } else {
                boardRoomResponseDto.setCode(codeStatus);
            }
        } catch (Exception e) {
            log.error(e.toString());
        }
        return boardRoomResponseDto;
    }
}
