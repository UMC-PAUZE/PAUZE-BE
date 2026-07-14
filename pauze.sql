-- 1. 독립 테이블 (외래키 참조를 받기만 하거나 참조가 없는 테이블)
CREATE TABLE `audio_category` (
	`category_id`	BIGINT	NOT NULL,
	`category_name`	VARCHAR(50)	NOT NULL,
	`category_code`	ENUM('NATURE_SOUND', 'ASMR', 'NOISE')	NOT NULL	COMMENT 'NATURE_SOUND, ASMR, NOISE',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_AUDIO_CATEGORY` PRIMARY KEY (`category_id`)
);

CREATE TABLE `curation_categories` (
	`category_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`name`	ENUM('HSP팁', '연구', '호흡법', '사운드')	NOT NULL	COMMENT 'HSP팁, 연구, 호흡법, 사운드',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_CURATION_CATEGORIES` PRIMARY KEY (`category_id`)
);

CREATE TABLE `term` (
	`term_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'AUTO_INCREMENT',
	`term_name`	ENUM('NONE')	NULL	DEFAULT 'NONE',
	CONSTRAINT `PK_TERM` PRIMARY KEY (`term_id`)
);

CREATE TABLE `users` (
	`uid`	BINARY(16)	NOT NULL,
	`email`	VARCHAR(255)	NOT NULL	COMMENT 'unique',
	`nickname`	VARCHAR(255)	NOT NULL,
	`profile_image_url`	TEXT	NULL,
	`profile_s3_key`	VARCHAR(255)	NULL,
	`reminder_alarm_active`	BOOLEAN	NOT NULL	DEFAULT true,
	`sensitive_alarm_active`	BOOLEAN	NOT NULL	DEFAULT true,
	`curation_alarm_active`	BOOLEAN	NOT NULL	DEFAULT true,
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDatetime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDatetime',
	`push_token`	VARCHAR(255)	NULL,
	`role`	ENUM('USER', 'ADMIN')	NOT NULL	DEFAULT 'USER'	COMMENT 'USER, ADMIN',
	`birth`	DATE	NOT NULL	COMMENT 'LocalDate',
	CONSTRAINT `PK_USERS` PRIMARY KEY (`uid`),
	UNIQUE KEY `uq_users_email` (`email`)
);

CREATE TABLE `trigger` (
	`trigger_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'PK, AUTO_INCREMENT',
	`name`	VARCHAR(50)	NOT NULL,
	`code`	VARCHAR(50)	NOT NULL	COMMENT 'UNIQUE',
	`description`	TEXT	NULL,
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_TRIGGER` PRIMARY KEY (`trigger_id`),
	UNIQUE KEY `uq_trigger_code` (`code`)
);

CREATE TABLE `rest_guide` (
	`rest_id`	BIGINT	NOT NULL,
	`rest_title`	VARCHAR(50)	NOT NULL,
	`rest_content`	TEXT	NOT NULL,
	`tip`	TEXT	NULL,
	`process_time`	INT	NOT NULL	COMMENT '초 단위',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_REST_GUIDE` PRIMARY KEY (`rest_id`)
);

CREATE TABLE `breathe_guide` (
	`breathe_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(50)	NOT NULL,
	`inhale_seconds`	INT	NULL,
	`hold_seconds`	INT	NULL,
	`exhale_seconds`	INT	NULL,
	`breathe_cycles`	INT	NOT NULL	DEFAULT 3,
	CONSTRAINT `PK_BREATHE_GUIDE` PRIMARY KEY (`breathe_id`)
);

CREATE TABLE `visual_guide` (
	`visual_id`	BIGINT	NOT NULL,
	`visual_title`	VARCHAR(50)	NOT NULL,
	`content`	VARCHAR(100)	NULL,
	`audio_url`	TEXT	NOT NULL,
	`audio_key`	VARCHAR(255)	NOT NULL,
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_VISUAL_GUIDE` PRIMARY KEY (`visual_id`)
);


-- 2. 1차 의존 테이블 (기본 테이블의 PK를 참조하는 테이블들)
CREATE TABLE `audio_guide` (
	`audio_id`	BIGINT	NOT NULL,
	`category_id`	BIGINT	NOT NULL,
	`audio_title`	VARCHAR(50)	NOT NULL,
	`audio_url`	TEXT	NOT NULL	COMMENT '(mp3 앨범 커버 넣기)',
	`audio_key`	VARCHAR(255)	NOT NULL,
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_AUDIO_GUIDE` PRIMARY KEY (`audio_id`),
	CONSTRAINT `FK_audio_category_TO_audio_guide` FOREIGN KEY (`category_id`) REFERENCES `audio_category` (`category_id`)
);

CREATE TABLE `curation_posts` (
	`post_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`title`	VARCHAR(255)	NOT NULL,
	`content`	TEXT	NOT NULL,
	`source`	VARCHAR(255)	NULL,
	`thumbnail_url`	TEXT	NULL	COMMENT '수정필요...',
	`view_count`	INT	NOT NULL	DEFAULT 0,
	`is_published`	BOOLEAN	NOT NULL	DEFAULT true,
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`category_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`estimated_read_time`	INT	NOT NULL	COMMENT '분 단위',
	CONSTRAINT `PK_CURATION_POSTS` PRIMARY KEY (`post_id`),
	CONSTRAINT `FK_curation_categories_TO_curation_posts` FOREIGN KEY (`category_id`) REFERENCES `curation_categories` (`category_id`)
);

CREATE TABLE `sensitivity_report` (
	`report_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'PK, AUTO_INCREMENT',
	`uid`	BINARY(16)	NOT NULL	COMMENT 'FK',
	`report_type`	ENUM('WEEKLY', 'MONTHLY')	NOT NULL, -- 임의 ENUM값 보정 필요시 수정
	`period_start`	DATE	NOT NULL	COMMENT '리포트 시작일',
	`period_end`	DATE	NOT NULL	COMMENT '리포트 종료일',
	`average_score`	INT	NOT NULL,
	`hardest_day`	ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')	NULL,
	`pauze_count`	INT	NOT NULL,
	`score_change`	INT	NULL,
	`insight`	TEXT	NULL	COMMENT 'AI 생성 문장',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_SENSITIVITY_REPORT` PRIMARY KEY (`report_id`),
	CONSTRAINT `FK_users_TO_sensitivity_report` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `token_redis` (
	`refresh_id`	VARCHAR(255)	NOT NULL	COMMENT '해시값',
	`uid`	BINARY(16)	NOT NULL,
	`provider_id`	VARCHAR(255)	NOT NULL,
	`refresh_token`	VARCHAR(255)	NOT NULL,
	`ttl`	BIGINT	NOT NULL, -- duration 대용 타입 지정
	CONSTRAINT `PK_TOKEN_REDIS` PRIMARY KEY (`refresh_id`),
	CONSTRAINT `FK_users_TO_token_redis` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `oauth` (
	`oauth_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'AUTO_INCREMENT',
	`uid`	BINARY(16)	NOT NULL,
	`social_type`	ENUM('KAKAO', 'LOCAL')	NOT NULL	COMMENT 'KAKAO, LOCAL',
	`provider_id`	VARCHAR(255)	NOT NULL	COMMENT 'if(local) salt임',
	`password`	TEXT	NULL	COMMENT 'SHA-512',
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDatetime',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDatetime',
	`login_email`	VARCHAR(255)	NOT NULL	COMMENT 'local은 직접, kakako는 받아서, 연동하시겟어요 뜸',
	CONSTRAINT `PK_OAUTH` PRIMARY KEY (`oauth_id`),
	CONSTRAINT `FK_users_TO_oauth` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `user_term` (
	`user_term_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'AUTO_INCREMENT',
	`uid`	BINARY(16)	NOT NULL,
	`term_id`	BIGINT	NOT NULL	COMMENT 'AUTO_INCREMENT',
	`term_active`	BOOLEAN	NOT NULL	DEFAULT false,
	`updated_at`	DATETIME	NULL	COMMENT 'LocalDatetime',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDatetime',
	CONSTRAINT `PK_USER_TERM` PRIMARY KEY (`user_term_id`),
	CONSTRAINT `FK_users_TO_user_term` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`),
	CONSTRAINT `FK_term_TO_user_term` FOREIGN KEY (`term_id`) REFERENCES `term` (`term_id`)
);

CREATE TABLE `search_histories` (
	`search_history_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`keyword`	VARCHAR(255)	NOT NULL,
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`uid`	BINARY(16)	NOT NULL,
	CONSTRAINT `PK_SEARCH_HISTORIES` PRIMARY KEY (`search_history_id`),
	CONSTRAINT `FK_users_TO_search_histories` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `Untitled` (
	`condition_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`uid`	BINARY(16)	NOT NULL	COMMENT 'FK',
	`sleep_level`	ENUM('LESS_4', 'FOUR_TO_SIX', 'SIX_TO_EIGHT', 'OVER_8')	NOT NULL	COMMENT 'LESS_4, FOUR_TO_SIX, SIX_TO_EIGHT, OVER_8',
	`noise_level`	ENUM('QUIET', 'NORMAL', 'UNCOMFORTABLE', 'HARD')	NOT NULL	COMMENT 'QUIET, NORMAL, UNCOMFORTABLE, HARD',
	`visual_level`	ENUM('LOW', 'NORMAL', 'HIGH', 'VERY_HIGH')	NOT NULL	COMMENT 'LOW, NORMAL, HIGH, VERY_HIGH',
	`social_level`	ENUM('ALONE', 'LITTLE', 'SOME', 'MANY')	NOT NULL	COMMENT 'ALONE, LITTLE, SOME, MANY',
	`energy_level`	ENUM('NONE', 'LOW', 'NORMAL', 'ENOUGH')	NOT NULL	COMMENT 'NONE, LOW, NORMAL, ENOUGH',
	`sensitivity_score`	INT	NOT NULL	COMMENT '0~100',
	`sensitivity_level`	ENUM('LOW', 'NORMAL', 'HIGH')	NOT NULL	COMMENT 'LOW, NORMAL, HIGH',
	`condition_date`	DATE	NOT NULL	COMMENT 'LocalDate',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_UNTITLED` PRIMARY KEY (`condition_id`),
	CONSTRAINT `FK_users_TO_Untitled` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);


-- 3. 2차 의존 테이블 (의존성을 가진 테이블들을 한 번 더 가리키는 관계형/로그형 테이블)
CREATE TABLE `audio_liked` (
	`liked_id`	BIGINT	NOT NULL,
	`audio_id`	BIGINT	NOT NULL,
	`uid`	BINARY(16)	NOT NULL,
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_AUDIO_LIKED` PRIMARY KEY (`liked_id`),
	CONSTRAINT `FK_audio_guide_TO_audio_liked` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide` (`audio_id`),
	CONSTRAINT `FK_users_TO_audio_liked` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `post_likes` (
	`likes_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`post_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`uid`	BINARY(16)	NOT NULL,
	`likes_num`	INT	NOT NULL,
	CONSTRAINT `PK_POST_LIKES` PRIMARY KEY (`likes_id`),
	CONSTRAINT `FK_curation_posts_TO_post_likes` FOREIGN KEY (`post_id`) REFERENCES `curation_posts` (`post_id`),
	CONSTRAINT `FK_users_TO_post_likes` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `post_bookmarks` (
	`bookmark_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`post_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`uid`	BINARY(16)	NOT NULL,
	CONSTRAINT `PK_POST_BOOKMARKS` PRIMARY KEY (`bookmark_id`),
	CONSTRAINT `FK_curation_posts_TO_post_bookmarks` FOREIGN KEY (`post_id`) REFERENCES `curation_posts` (`post_id`),
	CONSTRAINT `FK_users_TO_post_bookmarks` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
);

CREATE TABLE `report_trigger_rank` (
	`rank_id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT 'PK, AUTO_INCREMENT',
	`report_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`trigger_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`rank_order`	INT	NOT NULL	COMMENT '1~5',
	`trigger_count`	INT	NOT NULL	COMMENT 'COUNT 결과',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_REPORT_TRIGGER_RANK` PRIMARY KEY (`rank_id`),
	CONSTRAINT `FK_sensitivity_report_TO_report_trigger_rank` FOREIGN KEY (`report_id`) REFERENCES `sensitivity_report` (`report_id`),
	CONSTRAINT `FK_trigger_TO_report_trigger_rank` FOREIGN KEY (`trigger_id`) REFERENCES `trigger` (`trigger_id`)
);

CREATE TABLE `condition_trigger` (
	`condition_trigger_id`	BIGINT	NOT NULL	COMMENT 'PK',
	`condition_id`	BIGINT	NOT NULL	COMMENT 'FK', -- Untitled의 condition_id가 BIGINT이므로 타입 일치시킴
	`trigger_id`	BIGINT	NOT NULL	COMMENT 'FK',
	`created_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	`updated_at`	DATETIME	NOT NULL	COMMENT 'LocalDateTime',
	CONSTRAINT `PK_CONDITION_TRIGGER` PRIMARY KEY (`condition_trigger_id`),
	CONSTRAINT `FK_Untitled_TO_condition_trigger` FOREIGN KEY (`condition_id`) REFERENCES `Untitled` (`condition_id`),
	CONSTRAINT `FK_trigger_TO_condition_trigger` FOREIGN KEY (`trigger_id`) REFERENCES `trigger` (`trigger_id`)
);