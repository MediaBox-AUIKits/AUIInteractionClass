# aui-class-appserver 帮助文档

<p align="center" class="flex justify-center">
    <a href="https://www.serverless-devs.com" class="ml-1">
    <img src="http://editor.devsapp.cn/icon?package=start-springboot&type=packageType">
  </a>
  <a href="http://www.devsapp.cn/details.html?name=start-springboot" class="ml-1">
    <img src="http://editor.devsapp.cn/icon?package=start-springboot&type=packageVersion">
  </a>
  <a href="http://www.devsapp.cn/details.html?name=start-springboot" class="ml-1">
    <img src="http://editor.devsapp.cn/icon?package=start-springboot&type=packageDownload">
  </a>
</p>
<table>

## 前期准备
使用该项目，推荐您拥有以下的产品权限 / 策略：

| 服务/业务 | 函数计算                 |     
| --- |----------------------|   
| 权限/策略 | AliyunFCFullAccess   |     
| 权限/策略 | AliyunLiveFullAccess |     
| 权限/策略 | AliyunVODFullAccess    |     

</table>

<appdetail id="flushContent">

# 应用详情

- 关于技术选型 
  - 基于主流的Java8 + Springboot2搭建框架
  - 基于Mybatis plus(https://baomidou.com/)作为Repository层选型
  - 基于SpringSecurity + JWT 来实现权限控制
- 关于部署
  - 理论上只要安装了Java8即可运行在各个ECS或容器上。可以考虑使用Serverless平台(https://help.aliyun.com/product/50980.html)来快速部署

</appdetail>

# 工程配置说明
见下描述
```yaml
# 监听端口
server:
  port: 8080

# # mysql相关配置
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    # 连接信息
    url: jdbc:mysql://******:3306/*****?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: "******"
    password: "******"
  jackson:
    time-zone: GMT+8
    date-format: yyyy/MM/dd HH:mm:ss
    default-property-inclusion: non_null

#mybatis-plus相关配置。一般不用调整
mybatis-plus:
  # 实体扫描，多个package用逗号或者分号分隔
  typeAliasesPackage: com.aliyuncs.aui.entity
  configuration:
    # 是否输出sql语句，本地开发时建议打开，上线前去掉
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    # sql执行超时时间
    default-statement-timeout: 10

# pop config
biz:
  # pop配置。需要配置账号的ak及as，用于调用IM及VOD相关服务
  openapi:
    access:
      key: "*********"
      secret: "*********"
    # 融云相关配置，默认使用阿里云IM服务，该部分无需配置。
    live_rongcloud_im:
    	app_key: "*********"
    	app_secret: "*********"
  # 旧IM，旧IM无需配置 
  live_im:
    app_id: TY3****
  # 新IM服务配置
  new_im:
    appId: "*********"
    appKey: "*********"
    appSign: "*********"
  # 直播推拉流配置
  live_stream:
    #推流域名
    push_url: push.*****.vip
    #拉流域名
    pull_url: pull.*****.vip
    #推流对应的authkey
    push_auth_key: zJl4******
    #拉流对应的authkey
    pull_auth_key: mDZs********
    app_name: live
    auth_expires: 604800
  # 连麦应用信息
  live_mic:
    app_id: 7c61********
    app_key: c461b*********
  # 推流状态回调的authKey
  live_callback:
    auth_key: avdsd*******

# 白板信息
room:
  boards:
    app_key: "*********"
    app_secret: "*********"
    # 地址配置，不用调
    create_url: https://logic-dev.netease.im/v2/api/room
    delete_url: https://logic-dev.netease.im/v2/api/rooms/
    #  one day: 86400  one hour=3600
    channel_destroy_time: 86400
# 配置允许跨域的请求域名
http:
  cors:
    host: "*"
```

# 打包&启动
以监听9000为示例，见下
```shell
#!/usr/bin/env bash

mvn package -DskipTests
cp target/*.jar target/webframework.jar
java -Dserver.port=9000 -jar target/webframework.jar
```

