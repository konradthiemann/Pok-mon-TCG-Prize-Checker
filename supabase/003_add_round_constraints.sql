-- Constraints für rounds-Tabelle: verhindert ungültige Daten.
ALTER TABLE rounds ADD CONSTRAINT rounds_h_range CHECK (h >= 0 AND h <= 6);
ALTER TABLE rounds ADD CONSTRAINT rounds_t_positive CHECK (t > 0);
ALTER TABLE rounds ADD CONSTRAINT rounds_ts_positive CHECK (ts > 0);
