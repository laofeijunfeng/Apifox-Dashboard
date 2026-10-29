-- Apifox Dashboard 独立运营数据表。
-- 该库只保存看板补充事件，不复制、不修改 apifox 业务库表。
-- 应用使用只读账号，seat_reclaims 的写入由受控的运营流程完成。

CREATE DATABASE IF NOT EXISTS apifox_dashboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE apifox_dashboard;

CREATE TABLE IF NOT EXISTS seat_reclaims (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Apifox 团队 ID',
  user_id INT UNSIGNED NOT NULL COMMENT 'Apifox 用户 ID',
  reclaimed_at DATETIME NOT NULL COMMENT 'UTC 回收时间',
  reason VARCHAR(500) NOT NULL DEFAULT '' COMMENT '回收原因',
  operator_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '操作人或任务标识',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'UTC 创建时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (id),
  KEY idx_seat_reclaims_reclaimed_at (reclaimed_at, deleted_at),
  KEY idx_seat_reclaims_team_user (team_id, user_id),
  KEY idx_seat_reclaims_user (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='闲置账号回收事件，供运营看板计算回收率';
