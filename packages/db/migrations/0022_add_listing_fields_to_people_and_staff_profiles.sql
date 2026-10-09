-- Rows a self-service listing publishes into the directory are tagged with
-- its id, so it can replace them on each edit and remove them when hidden.
ALTER TABLE people
  ADD COLUMN listing_id INT UNSIGNED NULL AFTER profile_slug,
  ADD KEY idx_people_listing (listing_id),
  ADD CONSTRAINT fk_people_listing FOREIGN KEY (listing_id) REFERENCES staff_listings (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE staff_profiles
  ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER staff_status,
  ADD COLUMN listing_id INT UNSIGNED NULL AFTER is_verified,
  ADD CONSTRAINT fk_staff_profiles_listing FOREIGN KEY (listing_id) REFERENCES staff_listings (id) ON DELETE SET NULL ON UPDATE CASCADE;
