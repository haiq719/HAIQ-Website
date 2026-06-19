-- ============================================================
-- Migration 017: Backfill loyalty tier for existing members
-- A customer whose loyalty card has been approved (or dispatched /
-- delivered) is a member and should no longer show as "Classic".
-- Going forward this is kept in sync by the loyalty PATCH handler.
-- "Crown" (premium) is never downgraded here.
-- ============================================================

UPDATE users u
SET    loyalty_tier = 'Reserve'
WHERE  u.loyalty_tier IS DISTINCT FROM 'Crown'
  AND  EXISTS (
    SELECT 1
    FROM   loyalty_cards lc
    WHERE  lc.user_id = u.id
      AND  lc.status IN ('approved', 'dispatched', 'delivered')
  );
