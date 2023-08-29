package com.aliyuncs.aui.controller;

import com.aliyuncs.aui.common.utils.Result;
import com.aliyuncs.aui.common.utils.ValidatorUtils;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.DocResponse;
import com.aliyuncs.aui.dto.res.DocsAddResponse;
import com.aliyuncs.aui.dto.res.DocsDeleteResponse;
import com.aliyuncs.aui.service.ClassInfoService;
import com.aliyuncs.aui.service.DocService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/v1/class")
@Slf4j
public class DocController {

    @Resource
    private DocService docService;

    @Resource
    private ClassInfoService roomInfoService;

    /* 添加课件  Courseware*/
    @RequestMapping("/addDoc")
    public Result addDoc(@RequestBody DocAddRequest docCreateRequest) {
        ValidatorUtils.validateEntity(docCreateRequest);
        DocResponse docResponse = docService.addDoc(docCreateRequest);
        if (docResponse != null) {
            return roomInfoService.returnResult(docResponse);
        }
        return Result.error("id已经存在");
    }

    /* 删除课件  Courseware*/
    @RequestMapping("/deleteDoc")
    public Result deleteDoc(@RequestBody DocDeleteRequest docDeleteRequest) {

        if (docDeleteRequest == null){
            return Result.error();
        }

        if (docService.deleteDoc(docDeleteRequest)) {
            return Result.ok();
        }
        return Result.error();
    }

    /* 查询课件  Courseware*/
    @RequestMapping("/queryDoc")
    public Result queryDoc(@RequestBody DocQueryRequest docQueryRequest) {

        if (docQueryRequest == null){
            return Result.error();
        }

        List<DocResponse> docResponseList =  docService.queryDoc(docQueryRequest);
        if (docResponseList == null) {
            return Result.invalidParam();
        }

        return Result.ok(docResponseList);
    }


    /* 添加课件  Courseware*/
    @RequestMapping("/addDocs")
    public Result addDocs(@RequestBody DocsAddRequest docsAddRequest) {

        log.info("docsInfoList: {}", docsAddRequest.getDocInfo());
        DocsAddResponse docResponse = docService.addDocs(docsAddRequest);
        if (docResponse != null) {
            return roomInfoService.returnResult(docResponse);
        }
        return Result.error("id已经存在");
    }

    /* 删除课件  Courseware*/
    @RequestMapping("/deleteDocs")
    public Result deleteDocs(@RequestBody DocsDeleteRequest docsDeleteRequest) {

        if (docsDeleteRequest == null){
            return Result.error();
        }
        List<DocsDeleteResponse> docsDeleteResponse = docService.deleteDocs(docsDeleteRequest);

        if (!docsDeleteResponse.isEmpty()) {
            return Result.ok(docsDeleteResponse);
        }
        return Result.ok("docIds不存在");
    }

}
