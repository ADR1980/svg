/* ==========================================================================
   Der Zustand der Anwendung.

   Jede Schreiboperation geht denselben Weg: erst in den örtlichen Bestand und
   die Outbox, dann — wenn Netz da ist — nach Supabase. Die Oberfläche wartet
   nie auf das Netz, und ein Satz zwischen zwei Übungen ist sofort gespeichert.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { aufNutzerUmschreiben, fuehreZusammen, holeBestand, schiebeOutbox } from '../lib/abgleich'
import { heute, naechsterMontag } from '../lib/datum'
import { FOTO_EIMER, fern, fernVorhanden, imNetz } from '../lib/fern'
import {
  LEERER_BESTAND,
  geraeteNutzer,
  ladeBestand,
  ladeOutbox,
  letzterAbgleich as ladeAbgleich,
  merkeAbgleich,
  speichereBestand,
  speichereOutbox,
  type Bestand
} from '../lib/lager'
import type {
  Auftrag,
  Foto,
  Koerperwert,
  MuscleUpEintrag,
  Satz,
  TabellenName,
  Training,
  VorlageId
} from '../lib/types'
import { naechsterPausentag, naechsterTag, wocheIndex } from '../lib/zyklus'

interface Speicher {
  bereit: boolean
  bestand: Bestand
  offen: number
  online: boolean
  angemeldet: boolean
  emailAdresse: string | null
  letzterAbgleich: string | null
  meldung: string | null
  fernbetrieb: boolean

  anmelden: (email: string, passwort: string, neu: boolean) => Promise<string | null>
  abmelden: () => Promise<void>
  abgleichen: () => Promise<void>

  zyklusStarten: (start: string) => Promise<void>
  zyklusTagSetzen: (tag: number) => Promise<void>
  pauseHeute: (grund: string) => Promise<void>

  trainingSichern: (vorlage: VorlageId) => Promise<Training>
  trainingAendern: (id: string, teil: Partial<Training>) => Promise<void>
  trainingAbschliessen: (id: string, rpe: number | null, notiz: string | null) => Promise<void>
  trainingLoeschen: (id: string) => Promise<void>

  satzSichern: (satz: Satz) => Promise<void>
  satzLoeschen: (id: string) => Promise<void>

  koerperwertSichern: (wert: Omit<Koerperwert, 'user_id'>) => Promise<void>
  fotoHochladen: (datei: File, pose: Foto['pose'], datum: string) => Promise<string | null>
  fotoAdresse: (pfad: string) => Promise<string | null>

  muEintragSichern: (eintrag: Omit<MuscleUpEintrag, 'user_id'>) => Promise<void>
  markeSetzen: (blockId: number, notiz: string | null) => Promise<void>
}

const Zusammenhang = createContext<Speicher | null>(null)

export function useSpeicher(): Speicher {
  const s = useContext(Zusammenhang)
  if (!s) throw new Error('useSpeicher außerhalb des Providers')
  return s
}

export function SpeicherProvider({ children }: { children: ReactNode }) {
  const [bereit, setBereit] = useState(false)
  const [bestand, setBestand] = useState<Bestand>(LEERER_BESTAND)
  const [outbox, setOutbox] = useState<Auftrag[]>([])
  const [online, setOnline] = useState(imNetz())
  const [angemeldet, setAngemeldet] = useState(false)
  const [emailAdresse, setEmail] = useState<string | null>(null)
  const [letzterAbgleich, setAbgleich] = useState<string | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)

  const bestandRef = useRef(bestand)
  const outboxRef = useRef(outbox)
  bestandRef.current = bestand
  outboxRef.current = outbox

  const schreibeBestand = useCallback((naechster: Bestand) => {
    bestandRef.current = naechster
    setBestand(naechster)
    void speichereBestand(naechster)
  }, [])

  const schreibeOutbox = useCallback((naechste: Auftrag[]) => {
    outboxRef.current = naechste
    setOutbox(naechste)
    void speichereOutbox(naechste)
  }, [])

  /* --- Start ----------------------------------------------------------- */

  useEffect(() => {
    let abgebrochen = false
    void (async () => {
      const [b, o, a] = await Promise.all([ladeBestand(), ladeOutbox(), ladeAbgleich()])
      if (abgebrochen) return
      let nutzer = b.user_id
      if (fernVorhanden && fern) {
        const { data } = await fern.auth.getSession()
        if (data.session) {
          nutzer = data.session.user.id
          setAngemeldet(true)
          setEmail(data.session.user.email ?? null)
        }
      }
      if (!nutzer) nutzer = await geraeteNutzer()
      bestandRef.current = { ...b, user_id: nutzer }
      outboxRef.current = o
      setBestand(bestandRef.current)
      setOutbox(o)
      setAbgleich(a)
      setBereit(true)
    })()
    return () => {
      abgebrochen = true
    }
  }, [])

  useEffect(() => {
    if (!fern) return
    const { data } = fern.auth.onAuthStateChange((_ereignis, sitzung) => {
      setAngemeldet(Boolean(sitzung))
      setEmail(sitzung?.user.email ?? null)
      if (sitzung) {
        // Was vor der Anmeldung unter der Gerätekennung entstand, gehört ab
        // jetzt dem angemeldeten Nutzer — Bestand und Warteschlange mit.
        const { bestand, outbox } = aufNutzerUmschreiben(
          bestandRef.current,
          outboxRef.current,
          sitzung.user.id
        )
        schreibeBestand(bestand)
        schreibeOutbox(outbox)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [schreibeBestand, schreibeOutbox])

  useEffect(() => {
    const an = () => setOnline(true)
    const aus = () => setOnline(false)
    window.addEventListener('online', an)
    window.addEventListener('offline', aus)
    return () => {
      window.removeEventListener('online', an)
      window.removeEventListener('offline', aus)
    }
  }, [])

  /* --- Abgleich -------------------------------------------------------- */

  const abgleichen = useCallback(async () => {
    if (!fern || !imNetz()) return
    const { data } = await fern.auth.getSession()
    if (!data.session) return
    const nutzer = data.session.user.id
    try {
      const rest = await schiebeOutbox(outboxRef.current)
      schreibeOutbox(rest)
      const vomServer = await holeBestand(nutzer)
      schreibeBestand({ ...fuehreZusammen(bestandRef.current, vomServer, rest), user_id: nutzer })
      const jetzt = new Date().toISOString()
      setAbgleich(jetzt)
      await merkeAbgleich(jetzt)
      setMeldung(null)
    } catch (e) {
      setMeldung('Abgleich fehlgeschlagen: ' + String((e as Error).message ?? e))
    }
  }, [schreibeBestand, schreibeOutbox])

  // Beim Start, bei Rückkehr des Netzes und wenn die App wieder sichtbar wird.
  useEffect(() => {
    if (!bereit || !angemeldet) return
    void abgleichen()
  }, [bereit, angemeldet, online, abgleichen])

  useEffect(() => {
    const beiSicht = () => {
      if (document.visibilityState === 'visible') void abgleichen()
    }
    document.addEventListener('visibilitychange', beiSicht)
    return () => document.removeEventListener('visibilitychange', beiSicht)
  }, [abgleichen])

  /* --- Schreiben ------------------------------------------------------- */

  /** Eine Änderung: örtlich anwenden, in die Outbox legen, nachschieben. */
  const mutiere = useCallback(
    async (
      tabelle: TabellenName,
      op: Auftrag['op'],
      nutzlast: object,
      anwenden: (b: Bestand) => Bestand
    ) => {
      schreibeBestand(anwenden(bestandRef.current))
      const auftrag: Auftrag = {
        id: crypto.randomUUID(),
        table: tabelle,
        op,
        payload: nutzlast as Record<string, unknown>,
        queued_at: new Date().toISOString(),
        versuche: 0
      }
      const naechste = [...outboxRef.current, auftrag]
      schreibeOutbox(naechste)
      if (fern && imNetz() && angemeldet) {
        const rest = await schiebeOutbox(naechste)
        schreibeOutbox(rest)
      }
    },
    [angemeldet, schreibeBestand, schreibeOutbox]
  )

  const nutzer = bestand.user_id ?? ''

  /* --- Zyklus ---------------------------------------------------------- */

  const zyklusStarten = useCallback(
    async (start: string) => {
      const zustand = {
        user_id: nutzer,
        started_on: start || naechsterMontag(),
        current_day: 1,
        last_advanced_on: null
      }
      await mutiere('cycle_state', 'upsert', zustand, (b) => ({ ...b, zyklus: zustand }))
    },
    [mutiere, nutzer]
  )

  const zyklusTagSetzen = useCallback(
    async (tag: number) => {
      const alt = bestandRef.current.zyklus
      if (!alt) return
      const zustand = { ...alt, current_day: tag, last_advanced_on: heute() }
      await mutiere('cycle_state', 'upsert', zustand, (b) => ({ ...b, zyklus: zustand }))
    },
    [mutiere]
  )

  const pauseHeute = useCallback(
    async (grund: string) => {
      const alt = bestandRef.current.zyklus
      if (!alt) return
      const ziel = naechsterPausentag(alt.current_day)
      const sprung = {
        id: crypto.randomUUID(),
        user_id: nutzer,
        on_date: heute(),
        from_day: alt.current_day,
        to_day: ziel,
        reason: grund || null,
        created_at: new Date().toISOString()
      }
      await mutiere('cycle_skips', 'upsert', sprung, (b) => ({
        ...b,
        pausen: [...b.pausen, sprung]
      }))
      const zustand = { ...alt, current_day: ziel, last_advanced_on: heute() }
      await mutiere('cycle_state', 'upsert', zustand, (b) => ({ ...b, zyklus: zustand }))
    },
    [mutiere, nutzer]
  )

  /* --- Trainings ------------------------------------------------------- */

  const trainingSichern = useCallback(
    async (vorlage: VorlageId): Promise<Training> => {
      const b = bestandRef.current
      const tag = heute()
      const vorhanden = b.trainings.find((t) => t.performed_on === tag && t.template_id === vorlage)
      if (vorhanden) return vorhanden
      const jetzt = new Date().toISOString()
      const training: Training = {
        id: crypto.randomUUID(),
        user_id: nutzer,
        template_id: vorlage,
        performed_on: tag,
        started_at: jetzt,
        finished_at: null,
        cycle_day: b.zyklus?.current_day ?? 1,
        week_index: b.zyklus ? wocheIndex(b.zyklus.started_on, tag) : 1,
        is_deload: false,
        session_rpe: null,
        note: null,
        created_at: jetzt,
        updated_at: jetzt
      }
      await mutiere('workouts', 'upsert', training, (alt) => ({
        ...alt,
        trainings: [training, ...alt.trainings]
      }))
      return training
    },
    [mutiere, nutzer]
  )

  const trainingAendern = useCallback(
    async (id: string, teil: Partial<Training>) => {
      const alt = bestandRef.current.trainings.find((t) => t.id === id)
      if (!alt) return
      const neu = { ...alt, ...teil, updated_at: new Date().toISOString() }
      await mutiere('workouts', 'upsert', neu, (b) => ({
        ...b,
        trainings: b.trainings.map((t) => (t.id === id ? neu : t))
      }))
    },
    [mutiere]
  )

  const trainingAbschliessen = useCallback(
    async (id: string, rpe: number | null, notiz: string | null) => {
      const b = bestandRef.current
      const alt = b.trainings.find((t) => t.id === id)
      if (!alt) return
      const neu: Training = {
        ...alt,
        finished_at: alt.finished_at ?? new Date().toISOString(),
        session_rpe: rpe,
        note: notiz,
        updated_at: new Date().toISOString()
      }
      await mutiere('workouts', 'upsert', neu, (x) => ({
        ...x,
        trainings: x.trainings.map((t) => (t.id === id ? neu : t))
      }))
      // Eine abgeschlossene Einheit rückt den Zähler um genau eine Position.
      if (b.zyklus && !alt.finished_at) {
        const zustand = {
          ...b.zyklus,
          current_day: naechsterTag(b.zyklus.current_day),
          last_advanced_on: heute()
        }
        await mutiere('cycle_state', 'upsert', zustand, (x) => ({ ...x, zyklus: zustand }))
      }
    },
    [mutiere]
  )

  const trainingLoeschen = useCallback(
    async (id: string) => {
      const saetze = bestandRef.current.saetze.filter((s) => s.workout_id === id)
      for (const s of saetze) {
        await mutiere('sets', 'delete', { id: s.id }, (b) => ({
          ...b,
          saetze: b.saetze.filter((x) => x.id !== s.id)
        }))
      }
      await mutiere('workouts', 'delete', { id }, (b) => ({
        ...b,
        trainings: b.trainings.filter((t) => t.id !== id)
      }))
    },
    [mutiere]
  )

  /* --- Sätze ----------------------------------------------------------- */

  const satzSichern = useCallback(
    async (satz: Satz) => {
      const vollstaendig = { ...satz, user_id: nutzer }
      await mutiere('sets', 'upsert', vollstaendig, (b) => ({
        ...b,
        saetze: b.saetze.some((s) => s.id === satz.id)
          ? b.saetze.map((s) => (s.id === satz.id ? vollstaendig : s))
          : [...b.saetze, vollstaendig]
      }))
    },
    [mutiere, nutzer]
  )

  const satzLoeschen = useCallback(
    async (id: string) => {
      await mutiere('sets', 'delete', { id }, (b) => ({
        ...b,
        saetze: b.saetze.filter((s) => s.id !== id)
      }))
    },
    [mutiere]
  )

  /* --- Körper ---------------------------------------------------------- */

  const koerperwertSichern = useCallback(
    async (wert: Omit<Koerperwert, 'user_id'>) => {
      const vorhanden = bestandRef.current.koerperwerte.find(
        (k) => k.measured_on === wert.measured_on
      )
      const voll: Koerperwert = { ...wert, id: vorhanden?.id ?? wert.id, user_id: nutzer }
      await mutiere('body_metrics', 'upsert', voll, (b) => ({
        ...b,
        koerperwerte: vorhanden
          ? b.koerperwerte.map((k) => (k.id === voll.id ? voll : k))
          : [...b.koerperwerte, voll]
      }))
    },
    [mutiere, nutzer]
  )

  const fotoHochladen = useCallback(
    async (datei: File, pose: Foto['pose'], datum: string) => {
      if (!fern || !imNetz() || !angemeldet) {
        return 'Fotos brauchen eine Verbindung — sie liegen im privaten Eimer, nicht auf dem Gerät.'
      }
      const endung = datei.name.split('.').pop()?.toLowerCase() || 'jpg'
      const pfad = `${nutzer}/${datum}-${pose}-${Date.now()}.${endung}`
      const { error } = await fern.storage
        .from(FOTO_EIMER)
        .upload(pfad, datei, { contentType: datei.type || 'image/jpeg', upsert: false })
      if (error) return 'Hochladen fehlgeschlagen: ' + error.message
      const foto: Foto = {
        id: crypto.randomUUID(),
        user_id: nutzer,
        taken_on: datum,
        storage_path: pfad,
        pose
      }
      await mutiere('progress_photos', 'upsert', foto, (b) => ({ ...b, fotos: [...b.fotos, foto] }))
      return null
    },
    [angemeldet, mutiere, nutzer]
  )

  const fotoAdresse = useCallback(async (pfad: string) => {
    if (!fern) return null
    const { data, error } = await fern.storage.from(FOTO_EIMER).createSignedUrl(pfad, 120)
    if (error) return null
    return data.signedUrl
  }, [])

  /* --- Muscle-Up ------------------------------------------------------- */

  const muEintragSichern = useCallback(
    async (eintrag: Omit<MuscleUpEintrag, 'user_id'>) => {
      const voll: MuscleUpEintrag = { ...eintrag, user_id: nutzer }
      await mutiere('muscleup_log', 'upsert', voll, (b) => ({
        ...b,
        muEintraege: b.muEintraege.some((m) => m.id === voll.id)
          ? b.muEintraege.map((m) => (m.id === voll.id ? voll : m))
          : [...b.muEintraege, voll]
      }))
    },
    [mutiere, nutzer]
  )

  const markeSetzen = useCallback(
    async (blockId: number, notiz: string | null) => {
      const marke = {
        id: crypto.randomUUID(),
        user_id: nutzer,
        block_id: blockId,
        reached_on: heute(),
        note: notiz
      }
      await mutiere('muscleup_milestones', 'upsert', marke, (b) => ({
        ...b,
        muMarken: [...b.muMarken, marke]
      }))
    },
    [mutiere, nutzer]
  )

  /* --- Anmeldung ------------------------------------------------------- */

  const anmelden = useCallback(
    async (email: string, passwort: string, neu: boolean) => {
      if (!fern) return 'Ohne Supabase-Zugang läuft die App nur auf diesem Gerät.'
      const { data, error } = neu
        ? await fern.auth.signUp({ email, password: passwort })
        : await fern.auth.signInWithPassword({ email, password: passwort })
      if (error) return error.message
      if (!data.session) return 'Bestätige die Anmeldung per E-Mail, dann noch einmal hier.'
      return null
    },
    []
  )

  const abmelden = useCallback(async () => {
    if (fern) await fern.auth.signOut()
    const geraet = await geraeteNutzer()
    // Abmelden räumt den Bestand vom Gerät: ein fremder Blick bekommt nichts.
    schreibeBestand({ ...LEERER_BESTAND, user_id: geraet })
    schreibeOutbox([])
    setAngemeldet(false)
    setEmail(null)
  }, [schreibeBestand, schreibeOutbox])

  const wert = useMemo<Speicher>(
    () => ({
      bereit,
      bestand,
      offen: outbox.length,
      online,
      angemeldet,
      emailAdresse,
      letzterAbgleich,
      meldung,
      fernbetrieb: fernVorhanden,
      anmelden,
      abmelden,
      abgleichen,
      zyklusStarten,
      zyklusTagSetzen,
      pauseHeute,
      trainingSichern,
      trainingAendern,
      trainingAbschliessen,
      trainingLoeschen,
      satzSichern,
      satzLoeschen,
      koerperwertSichern,
      fotoHochladen,
      fotoAdresse,
      muEintragSichern,
      markeSetzen
    }),
    [
      bereit,
      bestand,
      outbox.length,
      online,
      angemeldet,
      emailAdresse,
      letzterAbgleich,
      meldung,
      anmelden,
      abmelden,
      abgleichen,
      zyklusStarten,
      zyklusTagSetzen,
      pauseHeute,
      trainingSichern,
      trainingAendern,
      trainingAbschliessen,
      trainingLoeschen,
      satzSichern,
      satzLoeschen,
      koerperwertSichern,
      fotoHochladen,
      fotoAdresse,
      muEintragSichern,
      markeSetzen
    ]
  )

  return <Zusammenhang.Provider value={wert}>{children}</Zusammenhang.Provider>
}
