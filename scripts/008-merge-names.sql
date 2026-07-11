-- Migration: 008-merge-names.sql
-- Description: Merge display_name into name where name is null, then drop display_name column.

UPDATE users
SET name = display_name
WHERE name IS NULL;

ALTER TABLE users
DROP COLUMN display_name;
