package com.aliyuncs.aui.service;


import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.DocResponse;
import com.aliyuncs.aui.dto.res.DocsAddResponse;
import com.aliyuncs.aui.dto.res.DocsDeleteResponse;

import java.util.List;

/**
 *  房间服务
 */
public interface DocService {

    /**
     * 添加课件
     */
    DocResponse addDoc(DocAddRequest docCreateRequest);

    /**
     * 删除课
     */
    boolean deleteDoc(DocDeleteRequest docDeleteRequest);

    /**
     * 查询课件
     */
    List<DocResponse> queryDoc(DocQueryRequest docQueryRequest);


    DocsAddResponse addDocs(DocsAddRequest docsAddRequest);

    /**
     * 删除课
     */
    List<DocsDeleteResponse> deleteDocs(DocsDeleteRequest docsDeleteRequest);
}
