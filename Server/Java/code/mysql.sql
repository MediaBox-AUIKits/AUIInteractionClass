CREATE TABLE `class_infos` (
  `id` varchar(256) NOT NULL COMMENT '课堂ID',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '修改时间',
  `title` varchar(256) DEFAULT NULL COMMENT '课堂标题',
  `anchor` varchar(256) DEFAULT NULL COMMENT '课堂主播',
  `extends` mediumtext COMMENT '扩展字段',
  `status` bigint DEFAULT NULL COMMENT '1-开始上课,2-结束上课,0-暂停或没有上课',
  `mode` bigint DEFAULT NULL COMMENT '0-公开,1-大班,2-小班',
  `a_li_yun_id` varchar(256) DEFAULT NULL COMMENT 'IM群ID',
  `pk_id` varchar(256) DEFAULT NULL,
  `notice` varchar(256) DEFAULT NULL COMMENT '课堂公告',
  `meeting_id` varchar(256) DEFAULT NULL COMMENT '连麦ID',
  `cover_url` varchar(256) DEFAULT NULL COMMENT '封面图,预留字段',
  `teacher_id` varchar(256) DEFAULT NULL COMMENT '老师ID',
  `teacher_nick` varchar(256) DEFAULT NULL COMMENT '老师昵称',
  `vod_id` varchar(256) DEFAULT NULL,
  `meeting_info` mediumtext COMMENT 'JSON字符串,连麦观众信息',
  `started_at` datetime DEFAULT NULL COMMENT '课堂的开始时间',
  `stopped_at` datetime DEFAULT NULL COMMENT '课堂的结束时间',
  `boards` mediumtext COMMENT '白板信息, JSON字符串',
  `rong_cloud_id` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_create_at` (`created_at`)
) ENGINE=InnoDB;


CREATE TABLE `doc_infos` (
  `doc_id` varchar(256) NOT NULL COMMENT '文档id',
  `class_id` varchar(256) NOT NULL COMMENT '课堂id',
  `server_type` varchar(256) NOT NULL COMMENT '文档类型',
  `doc_infos` mediumtext DEFAULT NULL COMMENT '文档信息, JSON字符串',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (doc_id, class_id)
) ENGINE=InnoDB;

CREATE TABLE `class_member` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
  `class_id` varchar(256) NOT NULL COMMENT '课堂id',
  `user_id` varchar(256) NOT NULL COMMENT '用户Id',
  `user_name` varchar(256) NOT NULL COMMENT '用户名',
  `user_avatar` varchar(256) COMMENT '头像',
  `identity` tinyint NOT NULL COMMENT '身份。1-学生，2-老师',
  `status` tinyint NOT NULL COMMENT '状态。1-正常，2-退出， 3-踢出',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
   UNIQUE KEY udx_class_user_id(`class_id`, `user_id`),
   KEY idx_class_created_at(`class_id`, `created_at`)
) ENGINE=InnoDB;

CREATE TABLE `class_kick_member` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
  `class_id` varchar(256) NOT NULL COMMENT '课堂id',
  `user_id` varchar(256) NOT NULL COMMENT '用户Id',
  `expired_at` datetime NOT NULL COMMENT '过期时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
   KEY idx_class_user_id(`class_id`, `user_id`)
) ENGINE=InnoDB;


CREATE TABLE `assistant_permit` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
  `class_id` varchar(256) NOT NULL COMMENT '课堂id',
  `permit` text NOT NULL COMMENT '权限信息',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
   UNIQUE KEY udx_class_id(`class_id`)
) ENGINE=InnoDB;

CREATE TABLE `class_check_in` (
  `id` char(32) PRIMARY KEY COMMENT 'id',
  `class_id` varchar(256) NOT NULL COMMENT '课堂id',
  `title` varchar(256) COMMENT '签到标题',
  `creator` varchar(256) COMMENT '创建者',
  `start_time` datetime NOT NULL COMMENT '签到开始时间',
  `duration` int NOT NULL COMMENT '签到时长， 单位：秒',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
   KEY idx_class_id_start_time(`class_id`, `start_time`)
) ENGINE=InnoDB;


CREATE TABLE `class_check_in_record` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
  `check_in_id` char(32) NOT NULL COMMENT '签到id',
  `user_id` varchar(256) COMMENT '签到者',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
   UNIQUE KEY udx_check_in_id_user_id(`check_in_id`, `user_id`),
   KEY idx_check_in_id_created_at(`check_in_id`, `created_at`)
) ENGINE=InnoDB;
