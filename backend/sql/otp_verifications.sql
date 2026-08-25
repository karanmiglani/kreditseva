-- OTP issued and verified per raw lead. One row per send attempt.
DROP TABLE IF EXISTS otp_verifications;

CREATE TABLE otp_verifications (
    id            BIGINT       NOT NULL AUTO_INCREMENT,

    lead_id       VARCHAR(36)  NOT NULL,           -- raw_leads.raw_lead_id (UUID)
    phone         VARCHAR(20)  NOT NULL,           -- 10 digits, stored without the +91
    otp_hash      CHAR(64)     NOT NULL,           -- sha256 hex; the plain OTP is never stored

    expires_at    DATETIME     NOT NULL,           -- written as DATE_ADD(NOW(), INTERVAL 5 MINUTE)

    -- NOT NULL matters: `attempts = attempts + 1` on a NULL yields NULL, which
    -- would silently switch off the 5-attempt lockout.
    attempts      INT          NOT NULL DEFAULT 0,

    is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
    verified_at   DATETIME     NULL,

    -- Outcome of the WhatsApp call. The row is inserted as 'pending' BEFORE the
    -- provider is called, so a failed send still counts against the rate limit.
    -- 'failed' rows are skipped when verifying: the user never got that code.
    status        ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
    error_message VARCHAR(255) NULL,               -- provider's own error, for debugging

    -- Not written yet. Reserved for the per-IP cap, so that limit can be added
    -- later without an ALTER on a table that by then holds live data.
    ip_address    VARCHAR(45)  NULL,

    last_sent_at  DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- verify: WHERE lead_id = ? AND status <> 'failed' ORDER BY id DESC LIMIT 1
    KEY idx_otp_lead (lead_id, id),

    -- rate limit: WHERE phone = ? AND created_at >= ...
    KEY idx_otp_phone_created (phone, created_at),

    -- per-IP rate limit
    KEY idx_otp_ip_created (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
