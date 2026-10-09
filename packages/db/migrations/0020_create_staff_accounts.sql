-- Staff who sign in with Google to manage their own directory listing
-- (/directory/my-listing). Separate from `admins`: a staff account can only
-- edit its own listing.
CREATE TABLE IF NOT EXISTS staff_accounts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  google_sub VARCHAR(64) NOT NULL,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(150) NULL,
  picture_url VARCHAR(700) NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_accounts_google_sub (google_sub),
  KEY idx_staff_accounts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
