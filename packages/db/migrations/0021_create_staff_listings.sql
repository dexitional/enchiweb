-- A staff member's self-service directory listing: one per staff account.
-- While it is submitted and visible, it is copied into the directory
-- (people rows with listing_id, plus the staff_profiles row for its slug) by
-- apps/web/src/server/staff-listings.ts.
CREATE TABLE IF NOT EXISTS staff_listings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  honorific VARCHAR(20) NULL,
  full_name VARCHAR(150) NULL,
  position VARCHAR(150) NULL,
  staff_type ENUM('teaching', 'non-teaching') NULL,
  -- JSON: [{ departmentId, role }] — where they work, and any leadership role there.
  affiliations JSON NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  show_email TINYINT(1) NOT NULL DEFAULT 1,
  show_phone TINYINT(1) NOT NULL DEFAULT 0,
  photo_url VARCHAR(700) NULL,
  about TEXT NULL,
  -- JSON: see apps/web/src/lib/directory.ts (profileDetailsSchema).
  details JSON NULL,
  joined_on DATE NULL,
  -- The directory profile this listing publishes to; set on first publish,
  -- or by an admin to link the listing to an existing profile.
  profile_slug VARCHAR(160) NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 0,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  admin_note VARCHAR(500) NULL,
  submitted_at DATETIME NULL,
  content_updated_at DATETIME NULL,
  reviewed_at DATETIME NULL,
  reviewed_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_listings_account (account_id),
  KEY idx_staff_listings_status (status, is_visible),
  KEY idx_staff_listings_profile_slug (profile_slug),
  CONSTRAINT fk_staff_listings_account FOREIGN KEY (account_id) REFERENCES staff_accounts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_staff_listings_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES admins (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
