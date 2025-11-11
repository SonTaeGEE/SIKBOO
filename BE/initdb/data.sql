-- ============================================
-- SIKBOO 공동구매 플랫폼 데이터베이스 스키마 (Clean)
-- PostgreSQL + PostGIS
-- ============================================

-- PostGIS 확장
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. 회원 (Member)
-- ============================================
CREATE TABLE member (
    member_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    -- 지병/알레르기: 배열로 보관
    diseases  TEXT[] NOT NULL DEFAULT '{}',
    allergies TEXT[] NOT NULL DEFAULT '{}',
    -- 온보딩 완료 여부
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 동일 provider 내 중복 계정 방지
    CONSTRAINT uq_member_provider_providerid UNIQUE (provider, provider_id)
);

COMMENT ON TABLE member IS '회원 정보';
COMMENT ON COLUMN member.diseases  IS '지병 목록(TEXT 배열)';
COMMENT ON COLUMN member.allergies IS '알레르기 목록(TEXT 배열)';
COMMENT ON COLUMN member.onboarding_completed IS '최초 온보딩(사전설문) 완료 여부';

-- ============================================
-- 2. 재료 (Ingredient)
-- ============================================
CREATE TABLE ingredient (
    ingredient_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    ingredient_name VARCHAR(100) NOT NULL,
    location VARCHAR(50) NOT NULL,     -- VARCHAR 유지
    due TIMESTAMP NOT NULL,            -- NOT NULL 유지(트리거로 보완 가능)
    is_due_estimated BOOLEAN NOT NULL DEFAULT TRUE, -- 예상 기한 여부
    memo VARCHAR(255),
    CONSTRAINT fk_ingredient_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE,
    -- 허용 값 제약(오타 방지)
    CONSTRAINT chk_ingredient_location
        CHECK (location IN ('냉장고','냉동실','실온'))
);

COMMENT ON TABLE ingredient IS '냉장고 재료 정보';
COMMENT ON COLUMN ingredient.is_due_estimated IS '소비기한이 추정값인지 여부(TRUE=추정)';

-- (옵션) due 미입력 시 기본값 자동 보완 트리거
-- 규칙 예: 냉장고 +7일, 냉동실 +90일, 실온 +3일
CREATE OR REPLACE FUNCTION set_default_due_if_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due IS NULL THEN
    IF NEW.location = '냉장고' THEN
      NEW.due := (NOW() + INTERVAL '7 days');
    ELSIF NEW.location = '냉동실' THEN
      NEW.due := (NOW() + INTERVAL '90 days');
    ELSE
      NEW.due := (NOW() + INTERVAL '3 days');
    END IF;
    NEW.is_due_estimated := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_due ON ingredient;
CREATE TRIGGER trg_set_default_due
BEFORE INSERT ON ingredient
FOR EACH ROW
EXECUTE FUNCTION set_default_due_if_null();

-- ============================================
-- 3. 레시피 (Recipe)
-- ============================================
CREATE TABLE recipe (
    recipe_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    recipe_name   VARCHAR(100)  NOT NULL,
    recipe_detail VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recipe_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE
);

COMMENT ON TABLE recipe IS '레시피 정보';

-- ============================================
-- 4. 공동구매 (GroupBuying)
-- ============================================
CREATE TABLE groupbuying (
    groupbuying_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_price INTEGER NOT NULL,
    max_people INTEGER NOT NULL,
    info VARCHAR(1000),
    current_people INTEGER NOT NULL DEFAULT 1,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_latitude  NUMERIC(10, 8) NOT NULL,
    pickup_longitude NUMERIC(11, 8) NOT NULL,
    pickup_location_point GEOGRAPHY(POINT, 4326),
    deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT '모집중',
    CONSTRAINT fk_groupbuying_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE,
    CONSTRAINT chk_people CHECK (current_people <= max_people)
);

COMMENT ON TABLE groupbuying IS '공동구매 정보';
COMMENT ON COLUMN groupbuying.pickup_location_point IS 'PostGIS 포인트 (위치 기반 검색용)';

-- 픽업 좌표 변경 시 포인트 자동 업데이트
CREATE OR REPLACE FUNCTION update_groupbuying_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pickup_latitude IS NOT NULL AND NEW.pickup_longitude IS NOT NULL THEN
    NEW.pickup_location_point = ST_SetSRID(
      ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_groupbuying_location ON groupbuying;
CREATE TRIGGER trigger_update_groupbuying_location
BEFORE INSERT OR UPDATE ON groupbuying
FOR EACH ROW
EXECUTE FUNCTION update_groupbuying_location();

-- ============================================
-- 5. 공동구매 참여자 (Participants)
-- ============================================
CREATE TABLE participants (
    participant_id BIGSERIAL PRIMARY KEY,
    groupbuying_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participants_groupbuying FOREIGN KEY (groupbuying_id)
        REFERENCES groupbuying(groupbuying_id) ON DELETE CASCADE,
    CONSTRAINT fk_participants_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE,
    CONSTRAINT uk_participant UNIQUE (groupbuying_id, member_id)
);

COMMENT ON TABLE participants IS '공동구매 참여자';

-- 참여자 수 증가/감소 트리거
CREATE OR REPLACE FUNCTION increment_current_people()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groupbuying
  SET current_people = current_people + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE groupbuying_id = NEW.groupbuying_id
    AND current_people < max_people;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_people ON participants;
CREATE TRIGGER trigger_increment_people
AFTER INSERT ON participants
FOR EACH ROW
EXECUTE FUNCTION increment_current_people();

CREATE OR REPLACE FUNCTION decrement_current_people()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groupbuying
  SET current_people = current_people - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE groupbuying_id = OLD.groupbuying_id
    AND current_people > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_people ON participants;
CREATE TRIGGER trigger_decrement_people
AFTER DELETE ON participants
FOR EACH ROW
EXECUTE FUNCTION decrement_current_people();

-- 마감 상태 자동 갱신 함수(스케줄러/크론에서 호출)
CREATE OR REPLACE FUNCTION auto_close_expired_groupbuying()
RETURNS void AS $$
BEGIN
  UPDATE groupbuying
  SET status = '마감',
      updated_at = CURRENT_TIMESTAMP
  WHERE deadline < CURRENT_TIMESTAMP
    AND status = '모집중';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 채팅 메시지 (ChatMessage)
-- ============================================
CREATE TABLE chat_message (
    message_id BIGSERIAL PRIMARY KEY,
    groupbuying_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chatmessage_groupbuying FOREIGN KEY (groupbuying_id)
        REFERENCES groupbuying(groupbuying_id) ON DELETE CASCADE,
    CONSTRAINT fk_chatmessage_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE
);

COMMENT ON TABLE chat_message IS '공동구매 채팅 메시지';

-- ============================================
-- 7. 리프레시 토큰 (Refresh Token)
-- ============================================
CREATE TABLE refresh_token (
    refresh_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    token VARCHAR(512) NOT NULL,
    expire_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_member FOREIGN KEY (member_id)
        REFERENCES member(member_id) ON DELETE CASCADE
);

COMMENT ON TABLE refresh_token IS 'JWT 리프레시 토큰 정보';

-- ============================================
-- 인덱스
-- ============================================

-- member: 질병/알레르기 배열 검색
CREATE INDEX IF NOT EXISTS idx_member_diseases_gin  ON member USING GIN (diseases);
CREATE INDEX IF NOT EXISTS idx_member_allergies_gin ON member USING GIN (allergies);

-- ingredient: 회원/위치/기한 조회 최적화
CREATE INDEX IF NOT EXISTS idx_ing_member_loc_due
  ON ingredient(member_id, location, due);

-- recipe
CREATE INDEX IF NOT EXISTS idx_recipe_member ON recipe(member_id);

-- groupbuying
CREATE INDEX IF NOT EXISTS idx_groupbuying_member   ON groupbuying(member_id);
CREATE INDEX IF NOT EXISTS idx_groupbuying_status   ON groupbuying(status);
CREATE INDEX IF NOT EXISTS idx_groupbuying_deadline ON groupbuying(deadline);
CREATE INDEX IF NOT EXISTS idx_groupbuying_category ON groupbuying(category);
CREATE INDEX IF NOT EXISTS idx_groupbuying_location ON groupbuying USING GIST (pickup_location_point);

-- participants
CREATE INDEX IF NOT EXISTS idx_participants_groupbuying ON participants(groupbuying_id);
CREATE INDEX IF NOT EXISTS idx_participants_member      ON participants(member_id);

-- chat_message
CREATE INDEX IF NOT EXISTS idx_chatmessage_groupbuying ON chat_message(groupbuying_id);
CREATE INDEX IF NOT EXISTS idx_chatmessage_member      ON chat_message(member_id);

-- refresh_token
CREATE INDEX IF NOT EXISTS idx_refresh_member ON refresh_token(member_id);
