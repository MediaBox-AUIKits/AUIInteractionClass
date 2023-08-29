package com.aliyuncs.aui.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.aui.dao.CoursewareInfoDao;
import com.aliyuncs.aui.dto.DocsInfo;
import com.aliyuncs.aui.dto.enums.ClassServerType;
import com.aliyuncs.aui.dto.req.*;
import com.aliyuncs.aui.dto.res.DocResponse;
import com.aliyuncs.aui.dto.res.DocsAddResponse;
import com.aliyuncs.aui.dto.res.DocsDeleteResponse;
import com.aliyuncs.aui.entity.DocEntity;
import com.aliyuncs.aui.service.DocService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.*;

@Service("DocService")
@Slf4j
public class DocServiceImpl extends ServiceImpl<CoursewareInfoDao, DocEntity>  implements DocService {

    @Override
    public DocResponse addDoc(DocAddRequest docCreateRequest) {

        QueryWrapper <DocEntity> QR = new QueryWrapper<>();
        DocEntity doc = getOne(QR.eq("class_id", docCreateRequest.getClassId()).eq("doc_id", docCreateRequest.getDocId()).last("limit 1"));
        if (doc != null) {
            return null;
        }

        DocEntity entity = DocEntity.builder()
                .classId(docCreateRequest.getClassId())
                .docId(docCreateRequest.getDocId())
                .serverType(ClassServerType.NetEase.getVal())
                .docInfos(docCreateRequest.getDocInfos())
                .createdAt(new Date())
                .build();

        boolean saved = this.save(entity);
        if (!saved) {
            log.error("save db error. roomInfoEntity:{}", JSONObject.toJSONString(entity));
            return null;
        }
        DocResponse docResponse = new DocResponse();
        BeanUtils.copyProperties(entity, docResponse);
        return docResponse;
    }

    @Override
    public boolean deleteDoc(DocDeleteRequest docDeleteRequest) {

        Map<String, Object> doc = new HashMap<>();
        doc.put("class_id", docDeleteRequest.getClassId());
        doc.put("doc_id", docDeleteRequest.getDocId());

        return this.removeByMap(doc);
    }


    @Override
    public List<DocResponse> queryDoc(DocQueryRequest docQueryRequest) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("class_id", docQueryRequest.getClassId());
        List<DocEntity> docEntities = this.listByMap(doc);

        List<DocResponse> docResponses = new ArrayList<>();
        for (DocEntity docEntity: docEntities) {
            DocResponse docResponse = new DocResponse();
            BeanUtils.copyProperties(docEntity, docResponse);
            docResponse.setServerType(setServerType(docEntity.getServerType()));
            docResponses.add(docResponse);
        }
        return  docResponses;
    }

    @Override
    public DocsAddResponse addDocs(DocsAddRequest docsAddRequest) {

        List<DocsInfo> docsInfoList = new ArrayList<>();
        for (DocsInfo docsInfo: docsAddRequest.getDocInfo()) {
            QueryWrapper<DocEntity> QR = new QueryWrapper<>();
            DocEntity doc = getOne(QR.eq("class_id", docsAddRequest.getClassId()).eq("doc_id", docsInfo.getDocId()).last("limit 1"));
            if (doc != null) {
                continue;
            }

            DocEntity entity = DocEntity.builder()
                    .classId(docsAddRequest.getClassId())
                    .docId(docsInfo.getDocId())
                    .serverType(ClassServerType.NetEase.getVal())
                    .docInfos(docsInfo.getDocInfos())
                    .createdAt(new Date())
                    .build();

            boolean saved = this.save(entity);
            if (!saved) {
                log.error("save db error. roomInfoEntity:{}", JSONObject.toJSONString(entity));
                continue;
            }
            docsInfoList.add(docsInfo);
        }
        return DocsAddResponse.builder()
                .classId(docsAddRequest.getClassId())
                .docsInfoList(docsInfoList)
                .build();
    }

    @Override
    public List<DocsDeleteResponse> deleteDocs(DocsDeleteRequest docsDeleteRequest) {
        String docsIds = docsDeleteRequest.getDocIds();
        String[] docsIdList = docsIds.split(",");
        List<DocsDeleteResponse> docsDeleteResponseList = new ArrayList<>();
        for (String docId :docsIdList) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("class_id", docsDeleteRequest.getClassId());
            doc.put("doc_id", docId);
            if (this.removeByMap(doc)) {
                DocsDeleteResponse docsDeleteResponse = DocsDeleteResponse.builder()
                        .classId(docsDeleteRequest.getClassId())
                        .docId(docId)
                        .build();
                docsDeleteResponseList.add(docsDeleteResponse);
            }
        }
        return docsDeleteResponseList;
    }

    public String setServerType(long type) {
        switch ((int) type) {
            case 0:
                return "阿里云";
            case 1:
                return "融云";
        }
        return null;
    }
}
