-- 003: UNIQUE index na booking_events (cal_booking_id, event_type)
--
-- Gate nález Vlny 3A: idempotenční claim v /api/booking-webhook je fail-open
-- při výpadku Redisu — bez DB-level unikátnosti by výpadek mohl vytvořit
-- duplicitní řádek s invoice_status='pending_invoice' pro placený tier,
-- tj. riziko dvojí fakturace. S tímto indexem degraduje fail-open na
-- neškodný konflikt 23505, který route ošetřuje jako `{ deduped: true }`.
--
-- Stejný princip jako 002 pro leads.email: Redis je optimalizace,
-- Postgres je autorita.

-- Guard: na existující DB s duplicitami by CREATE UNIQUE INDEX spadl uprostřed
-- `db push` s nejasnou chybou — radši explicitní výčet, co deduplikovat.
DO $$
DECLARE dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT cal_booking_id, event_type
    FROM booking_events
    GROUP BY cal_booking_id, event_type
    HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'booking_events obsahuje % duplicitních (cal_booking_id, event_type) dvojic — deduplikujte před aplikací migrace 003 (ponechte řádek s nejstarším created_at).',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS booking_events_cal_id_event_type_key
  ON booking_events (cal_booking_id, event_type);
