/*
  # Satellite TLE Cache

  Stores TLE data fetched from CelesTrak so the edge function can
  serve cached results without hammering the upstream source.

  1. New Tables
    - `satellite_tle_cache`
      - `group_name` (text, primary key) — CelesTrak group identifier
      - `records` (jsonb) — array of parsed TLE records for this group
      - `fetched_at` (timestamptz) — when data was last refreshed from CelesTrak

  2. Security
    - RLS enabled; service-role (edge function) can read and write
    - No direct client access
*/

CREATE TABLE IF NOT EXISTS satellite_tle_cache (
  group_name  text        PRIMARY KEY,
  records     jsonb       NOT NULL DEFAULT '[]',
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE satellite_tle_cache ENABLE ROW LEVEL SECURITY;

-- Only the service role (used by the edge function) may read/write
CREATE POLICY "Service role can select cache"
  ON satellite_tle_cache FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert cache"
  ON satellite_tle_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cache"
  ON satellite_tle_cache FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
