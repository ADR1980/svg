/* ==========================================================================
   Verbindung zum Supabase-Projekt.

   Beide Werte gehören ins Repository. Der anon key identifiziert nur das
   Projekt und trägt keine Rechte — welche Zeile jemand sieht, entscheiden
   ausschließlich die Policies aus sql/02_rls.sql und das JWT der Anmeldung.
   Der service_role-Schlüssel hat hier nichts verloren.

   Eingetragen ist der moderne "publishable"-Schlüssel (sb_publishable_…).
   Er lässt sich in Supabase einzeln austauschen, ohne den alten anon-JWT
   anzufassen — Settings → API Keys.
   ========================================================================== */

window.INVENTAR_CONFIG = {
  SUPABASE_URL: 'https://jlqmdwpvumxvitxxylxn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_FF5-4dtVIw5Nh2jXm4OeBw_GJxIzQP1',

  // Adresse, die auf QR-Aufkleber und NFC-Tags landet. Ohne Schrägstrich am
  // Ende. Läuft die Anwendung vorübergehend woanders, hier anpassen —
  // bereits gedruckte Etiketten zeigen weiter auf die alte Adresse, und die
  // klebt auf Geräten, die zehn Jahre im Haus bleiben.
  APP_URL: 'https://svg.global/inventory',

  BUCKET: 'asset-photos'
};
