import "dotenv/config";
import express from "express";
import cors from "cors";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { Pool } from "pg";

const app = express();
const DM_SCAN_SYSTEM_PROMPT = `Return only JSON with classification, severity, peca_section, peca_explanation, evidence_value, recommended_action, summary.`;
const port = Number(process.env.PORT || 8787);
const dataPath = path.resolve(process.cwd(), "api", "data.json");
const supabaseDbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const useSupabaseDb = Boolean(supabaseDbUrl);
const dbPool = useSupabaseDb
  ? new Pool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false },
    })
  : null;

if (dbPool) {
  dbPool.on("error", (err) => {
    console.error("Unexpected error on idle database client:", err.message);
    dbDisabledReason = err.message;
  });
}
let dbReadyPromise = null;
let dbDisabledReason = "";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const otpStore = new Map();
const sessionStore = new Map();
const requestCounters = new Map();

const nearbyHelpByCity = {
  Lahore: [
    { type: "Police Station", name: "Women Police Station, Race Course", phone: "042-99203781", address: "Race Course Road, Lahore" },
    { type: "Police Station", name: "Gulberg Police Station", phone: "042-35710964", address: "Gulberg III, Lahore" },
    { type: "Helpdesk", name: "Punjab Women Helpline", phone: "1043", address: "Punjab-wide support" },
  ],
  Karachi: [
    { type: "Police Station", name: "Women Police Station, Shahrah-e-Faisal", phone: "021-99230371", address: "Shahrah-e-Faisal, Karachi" },
    { type: "Police Station", name: "Aziz Bhatti Police Station", phone: "021-99245176", address: "Gulshan-e-Iqbal, Karachi" },
    { type: "Helpdesk", name: "Madadgaar Helpline", phone: "1099", address: "National support line" },
  ],
  Islamabad: [
    { type: "Police Station", name: "Women Police Station, G-7", phone: "051-9200110", address: "G-7 Markaz, Islamabad" },
    { type: "Police Station", name: "Aabpara Police Station", phone: "051-9202020", address: "Aabpara, Islamabad" },
    { type: "Helpdesk", name: "FIA Cybercrime Wing", phone: "1991", address: "Islamabad HQ / Online portal" },
  ],
  Peshawar: [
    { type: "Police Station", name: "Women Police Station, Peshawar Cantt", phone: "091-9211313", address: "Cantt Area, Peshawar" },
    { type: "Police Station", name: "University Town Police Station", phone: "091-9217324", address: "University Town, Peshawar" },
    { type: "Helpdesk", name: "KP Women Helpline", phone: "1736", address: "KP-wide support line" },
  ],
};

const nearbyNgosByCity = {
  Lahore: [
    { name: "Aurat Foundation (Lahore Desk)", focus: "Women rights and legal support", phone: "+92-42-35711543", address: "Gulberg, Lahore" },
    { name: "Bedari Helpline", focus: "Gender violence response and counselling", phone: "0800-13518", address: "Punjab support network" },
    { name: "Digital Rights Foundation", focus: "Cyber harassment and legal aid", phone: "0800-39393", address: "Remote support, Lahore operations" },
  ],
  Karachi: [
    { name: "Aurat Foundation (Karachi Desk)", focus: "Legal awareness and referrals", phone: "+92-21-35685031", address: "Clifton, Karachi" },
    { name: "Madadgaar Counselling Center", focus: "Crisis counselling and protection referrals", phone: "1098", address: "Karachi city support" },
    { name: "War Against Rape", focus: "Case advocacy and medico-legal support", phone: "+92-21-34373062", address: "Karachi" },
  ],
  Islamabad: [
    { name: "Rozan", focus: "Psychosocial support and violence prevention", phone: "+92-51-2251311", address: "Islamabad" },
    { name: "Aurat Foundation (ICT Desk)", focus: "Women safety legal referrals", phone: "+92-51-2827666", address: "Islamabad" },
    { name: "Digital Rights Foundation", focus: "Online abuse helpline", phone: "0800-39393", address: "National hotline" },
  ],
  Peshawar: [
    { name: "Khwendo Kor", focus: "Women protection and shelter referrals", phone: "+92-91-5617439", address: "Peshawar" },
    { name: "Blue Veins", focus: "GBV response and legal facilitation", phone: "+92-91-2566607", address: "Peshawar" },
    { name: "Aurat Foundation (KP Desk)", focus: "Community and legal support", phone: "+92-91-5701991", address: "Peshawar" },
  ],
};

const cityCoordinates = {
  Lahore: { lat: 31.5204, lon: 74.3587 },
  Karachi: { lat: 24.8607, lon: 67.0011 },
  Islamabad: { lat: 33.6844, lon: 73.0479 },
  Peshawar: { lat: 34.0151, lon: 71.5249 },
};

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function nearestSupportedCity(lat, lon) {
  const cities = Object.keys(cityCoordinates);
  let bestCity = cities[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of cities) {
    const coords = cityCoordinates[city];
    const distance = haversineKm(lat, lon, coords.lat, coords.lon);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCity = city;
    }
  }
  return { city: bestCity, distanceKm: bestDistance };
}

function hashSha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function ensureShape(data) {
  if (!data.settings) data.settings = { stealthMode: false, autoDialPolice: true, cancelPin: "1234" };
  if (!Array.isArray(data.contacts)) data.contacts = [];
  if (!Array.isArray(data.trips)) data.trips = [];
  if (!Array.isArray(data.sosLogs)) data.sosLogs = [];
  if (!Array.isArray(data.communityReports)) data.communityReports = [];
  if (!Array.isArray(data.legalQueue)) data.legalQueue = [];
  if (!Array.isArray(data.legalConsultRequests)) data.legalConsultRequests = [];
  if (!Array.isArray(data.evidenceVault)) data.evidenceVault = [];
  if (!Array.isArray(data.evidenceTimeline)) data.evidenceTimeline = [];
  if (!Array.isArray(data.activityLogs)) data.activityLogs = [];
  if (!Array.isArray(data.communityChatMessages)) data.communityChatMessages = [];
  if (!Array.isArray(data.safetyTimeline)) data.safetyTimeline = [];
  return data;
}

function buildInitialData() {
  return ensureShape({
    settings: { stealthMode: false, autoDialPolice: true, cancelPin: "1234" },
    contacts: [
      { id: "c1", name: "Ammi", phone: "+923001112233" },
      { id: "c2", name: "Maham", phone: "+923002223344" },
      { id: "c3", name: "Zara", phone: "+923003334455" },
    ],
  });
}

async function isTableEmpty(tableName) {
  const result = await dbPool.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return result.rows[0].count === 0;
}

async function writeDbData(data) {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");

    await client.query("UPDATE app_settings SET stealth_mode = $1, auto_dial_police = $2, cancel_pin = $3, updated_at = NOW() WHERE id = 1", [
      Boolean(data.settings?.stealthMode),
      Boolean(data.settings?.autoDialPolice),
      String(data.settings?.cancelPin || "1234"),
    ]);

    await client.query("DELETE FROM contacts");
    for (const contact of data.contacts || []) {
      await client.query("INSERT INTO contacts (id, name, phone) VALUES ($1, $2, $3)", [
        String(contact.id || randomUUID()),
        String(contact.name || ""),
        String(contact.phone || ""),
      ]);
    }

    await client.query("DELETE FROM trips");
    for (const trip of data.trips || []) {
      await client.query(
        `INSERT INTO trips (
          id, destination, destination_coords, started_at, status, events, location_history,
          no_movement_since, distance_trend_up_count, last_distance_to_destination_km
        ) VALUES ($1, $2, $3::jsonb, $4::timestamptz, $5, $6::jsonb, $7::jsonb, $8::timestamptz, $9, $10)`,
        [
          String(trip.id || randomUUID()),
          String(trip.destination || "Unknown"),
          JSON.stringify(trip.destinationCoords || null),
          trip.startedAt || new Date().toISOString(),
          String(trip.status || "active"),
          JSON.stringify(Array.isArray(trip.events) ? trip.events : []),
          JSON.stringify(Array.isArray(trip.locationHistory) ? trip.locationHistory : []),
          trip.noMovementSince || null,
          Number(trip.distanceTrendUpCount || 0),
          typeof trip.lastDistanceToDestinationKm === "number" ? trip.lastDistanceToDestinationKm : null,
        ],
      );
    }

    await client.query("DELETE FROM sos_logs");
    for (const sos of data.sosLogs || []) {
      await client.query(
        "INSERT INTO sos_logs (id, started_at, stopped_at, source, active, dispatch_logs) VALUES ($1, $2::timestamptz, $3::timestamptz, $4, $5, $6::jsonb)",
        [
          String(sos.id || randomUUID()),
          sos.startedAt || new Date().toISOString(),
          sos.stoppedAt || null,
          String(sos.source || "manual"),
          Boolean(sos.active),
          JSON.stringify(Array.isArray(sos.dispatchLogs) ? sos.dispatchLogs : []),
        ],
      );
    }

    await client.query("DELETE FROM community_reports");
    for (const report of data.communityReports || []) {
      await client.query(
        `INSERT INTO community_reports (
          id, city, category, area, description, anonymous, level, title, tags, verified,
          status, moderation_reason, moderated_at, time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz)`,
        [
          String(report.id || randomUUID()),
          String(report.city || ""),
          String(report.category || ""),
          String(report.area || ""),
          String(report.description || ""),
          Boolean(report.anonymous),
          String(report.level || "watch"),
          String(report.title || ""),
          Array.isArray(report.tags) ? report.tags.map(String) : [],
          Boolean(report.verified),
          String(report.status || "pending"),
          String(report.moderationReason || ""),
          report.moderatedAt || null,
          report.time || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM community_chat_messages");
    for (const msg of data.communityChatMessages || []) {
      await client.query(
        `INSERT INTO community_chat_messages (
          id, city, mode, text, alias, anonymous, area, category, tags, severity, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz)`,
        [
          String(msg.id || randomUUID()),
          String(msg.city || "Lahore"),
          String(msg.mode || "chat"),
          String(msg.text || ""),
          String(msg.alias || "Anonymous"),
          Boolean(msg.anonymous),
          msg.area ? String(msg.area) : null,
          msg.category ? String(msg.category) : null,
          Array.isArray(msg.tags) ? msg.tags.map(String) : [],
          String(msg.severity || "normal"),
          msg.createdAt || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM safety_timeline");
    for (const entry of data.safetyTimeline || []) {
      await client.query(
        "INSERT INTO safety_timeline (id, text, context, created_at) VALUES ($1, $2, $3, $4::timestamptz)",
        [
          String(entry.id || randomUUID()),
          String(entry.text || ""),
          entry.context ? String(entry.context) : null,
          entry.createdAt || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM legal_queue");
    for (const item of data.legalQueue || []) {
      await client.query(
        "INSERT INTO legal_queue (id, type, status, user_id, draft, created_at, reviewer_notes) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7)",
        [
          String(item.id || randomUUID()),
          String(item.type || "FIR_DRAFT_REVIEW"),
          String(item.status || "pending_review"),
          String(item.userId || "anonymous"),
          String(item.draft || ""),
          item.createdAt || new Date().toISOString(),
          String(item.reviewerNotes || ""),
        ],
      );
    }

    await client.query("DELETE FROM legal_consult_requests");
    for (const item of data.legalConsultRequests || []) {
      await client.query(
        `INSERT INTO legal_consult_requests (
          id, name, phone, city, issue_type, description, preferred_time, urgent, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz)`,
        [
          String(item.id || randomUUID()),
          String(item.name || "Anonymous"),
          String(item.phone || ""),
          String(item.city || ""),
          String(item.issueType || ""),
          String(item.description || ""),
          String(item.preferredTime || "Earliest available"),
          Boolean(item.urgent),
          String(item.status || "queued"),
          item.createdAt || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM evidence_vault");
    for (const item of data.evidenceVault || []) {
      await client.query(
        "INSERT INTO evidence_vault (id, incident_id, title, type, checksum, size, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)",
        [
          String(item.id || randomUUID()),
          String(item.incidentId || "default-incident"),
          String(item.title || "Untitled evidence"),
          String(item.type || "text"),
          String(item.checksum || ""),
          Number(item.size || 0),
          item.createdAt || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM evidence_timeline");
    for (const event of data.evidenceTimeline || []) {
      await client.query(
        `INSERT INTO evidence_timeline (
          id, incident_id, action, evidence_id, previous_hash, event_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
        [
          String(event.id || randomUUID()),
          String(event.incidentId || "default-incident"),
          String(event.action || "EVIDENCE_UPLOADED"),
          String(event.evidenceId || ""),
          String(event.previousHash || "GENESIS"),
          String(event.eventHash || ""),
          event.createdAt || new Date().toISOString(),
        ],
      );
    }

    await client.query("DELETE FROM activity_logs");
    for (const log of data.activityLogs || []) {
      await client.query("INSERT INTO activity_logs (id, action, metadata, at) VALUES ($1, $2, $3::jsonb, $4::timestamptz)", [
        String(log.id || randomUUID()),
        String(log.action || "unknown"),
        JSON.stringify(log.metadata || {}),
        log.at || new Date().toISOString(),
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createDbSessionForPhone(phone) {
  const userId = hashSha256(phone).slice(0, 16);
  await dbPool.query(
    `INSERT INTO auth_users (id, phone, verified_woman, roles, verification_method, created_at, updated_at)
     VALUES ($1, $2, false, $3::jsonb, NULL, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [userId, phone, JSON.stringify(["user"])],
  );
  const token = randomUUID();
  await dbPool.query(
    `INSERT INTO auth_sessions (token, user_id, phone, roles, verified_woman, verification_method, created_at, last_seen_at)
     VALUES ($1, $2, $3, $4::jsonb, false, NULL, NOW(), NOW())`,
    [token, userId, phone, JSON.stringify(["user"])],
  );
  return {
    token,
    session: {
      userId,
      phone,
      roles: ["user"],
      verifiedWoman: false,
      verificationMethod: null,
      createdAt: new Date().toISOString(),
    },
  };
}

async function getDbSessionByToken(token) {
  const result = await dbPool.query(
    `SELECT token, user_id, phone, roles, verified_woman, verification_method, created_at
     FROM auth_sessions
     WHERE token = $1`,
    [token],
  );
  const row = result.rows[0];
  if (!row) return null;
  await dbPool.query("UPDATE auth_sessions SET last_seen_at = NOW() WHERE token = $1", [token]);
  return {
    token: row.token,
    userId: row.user_id,
    phone: row.phone,
    roles: Array.isArray(row.roles) ? row.roles : ["user"],
    verifiedWoman: Boolean(row.verified_woman),
    verificationMethod: row.verification_method || null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function ensureDbReady() {
  if (!dbPool) return;
  if (dbDisabledReason) throw new Error(dbDisabledReason);
  if (!dbReadyPromise) {
    dbReadyPromise = dbPool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        stealth_mode BOOLEAN NOT NULL DEFAULT false,
        auto_dial_police BOOLEAN NOT NULL DEFAULT true,
        cancel_pin TEXT NOT NULL DEFAULT '1234',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        destination TEXT NOT NULL,
        destination_coords JSONB,
        started_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        events JSONB NOT NULL DEFAULT '[]'::jsonb,
        location_history JSONB NOT NULL DEFAULT '[]'::jsonb,
        no_movement_since TIMESTAMPTZ,
        distance_trend_up_count INTEGER NOT NULL DEFAULT 0,
        last_distance_to_destination_km DOUBLE PRECISION
      );

      CREATE TABLE IF NOT EXISTS sos_logs (
        id TEXT PRIMARY KEY,
        started_at TIMESTAMPTZ NOT NULL,
        stopped_at TIMESTAMPTZ,
        source TEXT NOT NULL DEFAULT 'manual',
        active BOOLEAN NOT NULL DEFAULT true,
        dispatch_logs JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS community_reports (
        id TEXT PRIMARY KEY,
        city TEXT NOT NULL,
        category TEXT NOT NULL,
        area TEXT NOT NULL,
        description TEXT NOT NULL,
        anonymous BOOLEAN NOT NULL DEFAULT true,
        level TEXT NOT NULL DEFAULT 'watch',
        title TEXT NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        verified BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'pending',
        moderation_reason TEXT NOT NULL DEFAULT '',
        moderated_at TIMESTAMPTZ,
        time TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS community_chat_messages (
        id TEXT PRIMARY KEY,
        city TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'chat',
        text TEXT NOT NULL,
        alias TEXT NOT NULL DEFAULT 'Anonymous',
        anonymous BOOLEAN NOT NULL DEFAULT true,
        area TEXT,
        category TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}',
        severity TEXT NOT NULL DEFAULT 'normal',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS safety_timeline (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        context TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS legal_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        user_id TEXT NOT NULL,
        draft TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewer_notes TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS legal_consult_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        description TEXT NOT NULL,
        preferred_time TEXT NOT NULL DEFAULT 'Earliest available',
        urgent BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'queued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS evidence_vault (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        checksum TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS evidence_timeline (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        action TEXT NOT NULL,
        evidence_id TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        event_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        verified_woman BOOLEAN NOT NULL DEFAULT false,
        roles JSONB NOT NULL DEFAULT '["user"]'::jsonb,
        verification_method TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        device_id TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        roles JSONB NOT NULL DEFAULT '["user"]'::jsonb,
        verified_woman BOOLEAN NOT NULL DEFAULT false,
        verification_method TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS moderator_profiles (
        user_id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'moderator',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clerk_profiles (
        clerk_user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        full_name TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }
  try {
    await dbReadyPromise;
  } catch (error) {
    dbDisabledReason = error?.message || "DB unavailable";
    throw error;
  }

  await dbPool.query(
    "INSERT INTO app_settings (id, stealth_mode, auto_dial_police, cancel_pin) VALUES (1, false, true, '1234') ON CONFLICT (id) DO NOTHING",
  );

  const contactsEmpty = await isTableEmpty("contacts");
  if (contactsEmpty) {
    const initial = buildInitialData();
    for (const contact of initial.contacts) {
      await dbPool.query("INSERT INTO contacts (id, name, phone) VALUES ($1, $2, $3)", [contact.id, contact.name, contact.phone]);
    }
  }

  const settingsExists = await dbPool.query("SELECT 1 FROM app_settings WHERE id = 1");
  if (settingsExists.rows.length === 0) {
    const initial = buildInitialData();
    await dbPool.query("INSERT INTO app_settings (id, stealth_mode, auto_dial_police, cancel_pin) VALUES (1, $1, $2, $3)", [
      initial.settings.stealthMode,
      initial.settings.autoDialPolice,
      initial.settings.cancelPin,
    ]);
  }

  const migratedMarker = await dbPool.query("SELECT 1 FROM activity_logs WHERE action = 'supabase_state_migration_completed' LIMIT 1");
  if (migratedMarker.rows.length === 0) {
    const oldState = await dbPool.query("SELECT payload FROM app_state WHERE id = $1", ["nigehbaan-primary"]);
    if (oldState.rows.length > 0) {
      await writeDbData(ensureShape(oldState.rows[0].payload || {}));
      await dbPool.query(
        "INSERT INTO activity_logs (id, action, metadata, at) VALUES ($1, $2, $3::jsonb, NOW())",
        [randomUUID(), "supabase_state_migration_completed", JSON.stringify({ source: "app_state" })],
      );
    }
  }
}

async function readData() {
  if (dbPool) {
    try {
      await ensureDbReady();
      const [
        settingsRes,
        contactsRes,
        tripsRes,
        sosRes,
        reportsRes,
        chatRes,
        safetyTimelineRes,
        legalRes,
        legalConsultRes,
        evidenceRes,
        timelineRes,
        activityRes,
      ] = await Promise.all([
        dbPool.query("SELECT stealth_mode, auto_dial_police, cancel_pin FROM app_settings WHERE id = 1"),
        dbPool.query("SELECT id, name, phone FROM contacts ORDER BY name ASC"),
        dbPool.query(`SELECT id, destination, destination_coords, started_at, status, events, location_history, no_movement_since, distance_trend_up_count, last_distance_to_destination_km FROM trips ORDER BY started_at ASC`),
        dbPool.query("SELECT id, started_at, stopped_at, source, active, dispatch_logs FROM sos_logs ORDER BY started_at ASC"),
        dbPool.query("SELECT id, city, category, area, description, anonymous, level, title, tags, verified, status, moderation_reason, moderated_at, time FROM community_reports ORDER BY time ASC"),
        dbPool.query("SELECT id, city, mode, text, alias, anonymous, area, category, tags, severity, created_at FROM community_chat_messages ORDER BY created_at ASC"),
        dbPool.query("SELECT id, text, context, created_at FROM safety_timeline ORDER BY created_at ASC"),
        dbPool.query("SELECT id, type, status, user_id, draft, created_at, reviewer_notes FROM legal_queue ORDER BY created_at ASC"),
        dbPool.query("SELECT id, name, phone, city, issue_type, description, preferred_time, urgent, status, created_at FROM legal_consult_requests ORDER BY created_at ASC"),
        dbPool.query("SELECT id, incident_id, title, type, checksum, size, created_at FROM evidence_vault ORDER BY created_at ASC"),
        dbPool.query("SELECT id, incident_id, action, evidence_id, previous_hash, event_hash, created_at FROM evidence_timeline ORDER BY created_at ASC"),
        dbPool.query("SELECT id, action, metadata, at FROM activity_logs ORDER BY at ASC"),
      ]);

      const settingsRow = settingsRes.rows[0] || { stealth_mode: false, auto_dial_police: true, cancel_pin: "1234" };
      return ensureShape({
        settings: {
          stealthMode: settingsRow.stealth_mode,
          autoDialPolice: settingsRow.auto_dial_police,
          cancelPin: settingsRow.cancel_pin,
        },
        contacts: contactsRes.rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone })),
        trips: tripsRes.rows.map((r) => ({
          id: r.id,
          destination: r.destination,
          destinationCoords: r.destination_coords,
          startedAt: new Date(r.started_at).toISOString(),
          status: r.status,
          events: Array.isArray(r.events) ? r.events : [],
          locationHistory: Array.isArray(r.location_history) ? r.location_history : [],
          noMovementSince: r.no_movement_since ? new Date(r.no_movement_since).toISOString() : null,
          distanceTrendUpCount: r.distance_trend_up_count || 0,
          lastDistanceToDestinationKm: typeof r.last_distance_to_destination_km === "number" ? r.last_distance_to_destination_km : null,
        })),
        sosLogs: sosRes.rows.map((r) => ({
          id: r.id,
          startedAt: new Date(r.started_at).toISOString(),
          stoppedAt: r.stopped_at ? new Date(r.stopped_at).toISOString() : undefined,
          source: r.source,
          active: Boolean(r.active),
          dispatchLogs: Array.isArray(r.dispatch_logs) ? r.dispatch_logs : [],
        })),
        communityReports: reportsRes.rows.map((r) => ({
          id: r.id,
          city: r.city,
          category: r.category,
          area: r.area,
          description: r.description,
          anonymous: Boolean(r.anonymous),
          level: r.level,
          title: r.title,
          tags: Array.isArray(r.tags) ? r.tags : [],
          verified: Boolean(r.verified),
          status: r.status,
          moderationReason: r.moderation_reason,
          moderatedAt: r.moderated_at ? new Date(r.moderated_at).toISOString() : undefined,
          time: new Date(r.time).toISOString(),
        })),
        communityChatMessages: chatRes.rows.map((r) => ({
          id: r.id,
          city: r.city,
          mode: r.mode,
          text: r.text,
          alias: r.alias,
          anonymous: Boolean(r.anonymous),
          area: r.area || null,
          category: r.category || null,
          tags: Array.isArray(r.tags) ? r.tags : [],
          severity: r.severity || "normal",
          createdAt: new Date(r.created_at).toISOString(),
        })),
        safetyTimeline: safetyTimelineRes.rows.map((r) => ({
          id: r.id,
          text: r.text,
          context: r.context || null,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        legalQueue: legalRes.rows.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          userId: r.user_id,
          draft: r.draft,
          createdAt: new Date(r.created_at).toISOString(),
          reviewerNotes: r.reviewer_notes,
        })),
        legalConsultRequests: legalConsultRes.rows.map((r) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          city: r.city,
          issueType: r.issue_type,
          description: r.description,
          preferredTime: r.preferred_time,
          urgent: Boolean(r.urgent),
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        evidenceVault: evidenceRes.rows.map((r) => ({
          id: r.id,
          incidentId: r.incident_id,
          title: r.title,
          type: r.type,
          checksum: r.checksum,
          size: Number(r.size || 0),
          createdAt: new Date(r.created_at).toISOString(),
        })),
        evidenceTimeline: timelineRes.rows.map((r) => ({
          id: r.id,
          incidentId: r.incident_id,
          action: r.action,
          evidenceId: r.evidence_id,
          previousHash: r.previous_hash,
          eventHash: r.event_hash,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        activityLogs: activityRes.rows.map((r) => ({
          id: r.id,
          action: r.action,
          metadata: r.metadata || {},
          at: new Date(r.at).toISOString(),
        })),
      });
    } catch {
      // Fallback to local file storage when Supabase DB is unavailable.
    }
  }

  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return ensureShape(JSON.parse(raw));
  } catch {
    const initial = buildInitialData();
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeData(data) {
  if (dbPool) {
    try {
      await ensureDbReady();
      await writeDbData(ensureShape(data));
      return;
    } catch {
      // Fallback to local file storage when Supabase DB is unavailable.
    }
  }

  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

function logActivity(data, action, metadata = {}) {
  data.activityLogs.push({
    id: randomUUID(),
    action,
    metadata,
    at: new Date().toISOString(),
  });
}

function rateLimit({ keyPrefix, windowMs, max }) {
  return (req, res, next) => {
    const id = req.ip || "unknown";
    const key = `${keyPrefix}:${id}`;
    const now = Date.now();
    const record = requestCounters.get(key) || { count: 0, windowStart: now };
    if (now - record.windowStart > windowMs) {
      record.count = 0;
      record.windowStart = now;
    }
    record.count += 1;
    requestCounters.set(key, record);
    if (record.count > max) {
      return res.status(429).json({ error: "Rate limit exceeded. Please try again shortly." });
    }
    return next();
  };
}

function moderateReportText(text) {
  const value = String(text || "").toLowerCase();
  const tags = [];
  const map = [
    { key: "harassment", words: ["harass", "stalk", "catcall", "follow"] },
    { key: "unsafe-transit", words: ["bus", "rickshaw", "van", "station", "stop"] },
    { key: "night-risk", words: ["night", "dark", "isolated"] },
    { key: "cyber-abuse", words: ["deepfake", "dm", "blackmail", "threat", "online"] },
  ];
  for (const item of map) {
    if (item.words.some((w) => value.includes(w))) tags.push(item.key);
  }
  if (tags.length === 0) tags.push("general-safety");
  return tags.slice(0, 4);
}

function isVerifiedReport({ category, area, description }) {
  return (
    String(category || "").trim().length > 0 &&
    String(area || "").trim().length >= 3 &&
    String(description || "").trim().length >= 35
  );
}

function sanitizeUserText(text) {
  return String(text || "").replace(/[<>{}]/g, "").slice(0, 4000);
}

async function callGroq({ systemPrompt, messages, maxTokens = 900 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return callGemini({ systemPrompt, messages, maxTokens });
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });
    if (!response.ok) throw new Error(`Groq error ${response.status}`);
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Groq failed, falling back to Gemini:", err.message);
    return callGemini({ systemPrompt, messages, maxTokens });
  }
}

async function callGemini({ systemPrompt, messages, maxTokens = 900, imageBase64 = null, imageMimeType = "image/jpeg" }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("No AI API keys configured (GROQ or GEMINI)");

  const history = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // If there's an image, append it to the last user message or add a new one
  if (imageBase64) {
    const lastMessage = history[history.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      lastMessage.parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64,
        },
      });
    } else {
      history.push({
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: imageMimeType,
              data: imageBase64,
            },
          },
        ],
      });
    }
  }

  const payload = {
    contents: history,
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.2,
    },
  };

  const modelName = imageBase64 ? "gemini-1.5-flash" : "gemini-1.5-flash"; // Both support vision

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Gemini error ${response.status}: ${JSON.stringify(errData)}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

function looksLikeJwt(token) {
  return typeof token === "string" && token.startsWith("ey") && token.split(".").length >= 3;
}

function getClerkSecretKey() {
  return String(process.env.CLERK_SECRET_KEY || "").trim();
}

function clerkVerifyTokenOptions() {
  const secretKey = getClerkSecretKey();
  if (!secretKey) return null;
  const parties = String(process.env.CLERK_AUTHORIZED_PARTIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    secretKey,
    ...(parties.length ? { authorizedParties: parties } : {}),
  };
}

async function verifyClerkJwtToUserId(token) {
  const opts = clerkVerifyTokenOptions();
  if (!opts) throw new Error("Clerk not configured");
  const payload = await verifyToken(token, opts);
  const sub = payload.sub;
  if (!sub) throw new Error("Missing sub");
  const clerk = createClerkClient({ secretKey: opts.secretKey });
  if (sub.startsWith("user_")) return sub;
  if (sub.startsWith("sess_")) {
    const session = await clerk.sessions.getSession(sub);
    return session.userId;
  }
  try {
    await clerk.users.getUser(sub);
    return sub;
  } catch {
    const session = await clerk.sessions.getSession(sub);
    return session.userId;
  }
}

async function getSessionForBearerToken(token) {
  if (!token) return null;
  if (looksLikeJwt(token)) {
    const secretKey = getClerkSecretKey();
    if (!secretKey) return null;
    try {
      const userId = await verifyClerkJwtToUserId(token);
      return {
        userId,
        phone: "",
        roles: ["user"],
        verifiedWoman: false,
        verificationMethod: null,
        createdAt: new Date().toISOString(),
        authSource: "clerk",
      };
    } catch {
      return null;
    }
  }
  if (dbPool) {
    try {
      const rowSession = await getDbSessionByToken(token);
      if (rowSession) return { ...rowSession, authSource: "otp" };
    } catch {
      // ignore
    }
  }
  const mem = sessionStore.get(token);
  return mem ? { ...mem, authSource: "otp-mem" } : null;
}

async function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  const session = await getSessionForBearerToken(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.session = session;
  return next();
}

async function requireModerator(req, res, next) {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  if (!dbPool || dbDisabledReason) {
    const session = await getSessionForBearerToken(token);
    if (!session || !(session.roles || []).includes("moderator")) return res.status(403).json({ error: "Moderator access required" });
    req.session = session;
    return next();
  }

  try {
    const session = await getSessionForBearerToken(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    const profile = await dbPool.query("SELECT role, active FROM moderator_profiles WHERE user_id = $1", [session.userId]);
    if (!profile.rows[0] || !profile.rows[0].active) return res.status(403).json({ error: "Moderator access required" });
    req.session = { ...session, roles: Array.from(new Set([...(session.roles || ["user"]), profile.rows[0].role])) };
    return next();
  } catch {
    dbDisabledReason = dbDisabledReason || "DB unavailable during moderator check";
    const session = await getSessionForBearerToken(token);
    if (!session || !(session.roles || []).includes("moderator")) return res.status(403).json({ error: "Moderator access required" });
    req.session = session;
    return next();
  }
}

async function sendSmsOptional(to, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !auth || !from) return { provider: "mock", status: "skipped_no_credentials" };
  const authHeader = Buffer.from(`${sid}:${auth}`).toString("base64");
  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) return { provider: "twilio", status: "failed", code: res.status };
  const payload = await res.json();
  return { provider: "twilio", status: "sent", sid: payload.sid };
}

app.get("/api/health", async (_req, res) => {
  const data = await readData();
  res.json({
    ok: true,
    service: "nigehbaan-backend",
    env: process.env.NODE_ENV || "development",
    stats: {
      contacts: data.contacts.length,
      trips: data.trips.length,
      communityReports: data.communityReports.length,
      evidenceItems: data.evidenceVault.length,
    },
  });
});

app.get("/api/auth/status", async (_req, res) => {
  const clerkSecretConfigured = Boolean(getClerkSecretKey());
  const databaseUrlConfigured = Boolean(supabaseDbUrl);
  let databaseQueryable = false;
  if (dbPool) {
    try {
      await ensureDbReady();
      await dbPool.query("SELECT 1 AS ok");
      databaseQueryable = true;
    } catch {
      databaseQueryable = false;
    }
  }
  res.json({
    clerkSecretConfigured,
    databaseUrlConfigured,
    databaseQueryable,
    clerkProfileSyncReady: clerkSecretConfigured && databaseQueryable,
  });
});

app.get("/api/state", async (_req, res) => {
  const data = await readData();
  res.json({ settings: data.settings, contacts: data.contacts });
});

app.get("/api/safety/timeline", async (_req, res) => {
  const data = await readData();
  const entries = (data.safetyTimeline || [])
    .slice(-40)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ entries });
});

app.post("/api/safety/timeline", rateLimit({ keyPrefix: "safety-timeline", windowMs: 60 * 1000, max: 20 }), async (req, res) => {
  const text = sanitizeUserText(req.body?.text || "");
  const context = sanitizeUserText(req.body?.context || "");
  if (!text.trim()) return res.status(400).json({ error: "text is required" });
  const data = await readData();
  const entry = {
    id: randomUUID(),
    text: text.trim(),
    context: context.trim() || null,
    createdAt: new Date().toISOString(),
  };
  data.safetyTimeline.push(entry);
  logActivity(data, "safety_timeline_added", { entryId: entry.id });
  await writeData(data);
  res.json({ entry });
});

app.put("/api/settings", async (req, res) => {
  const data = await readData();
  data.settings = { ...data.settings, ...req.body };
  logActivity(data, "settings_updated", { keys: Object.keys(req.body || {}) });
  await writeData(data);
  res.json({ settings: data.settings });
});

app.post("/api/contacts", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });
  const data = await readData();
  const contact = { id: randomUUID(), name, phone };
  data.contacts.push(contact);
  logActivity(data, "contact_added", { contactId: contact.id });
  await writeData(data);
  res.json({ contact, contacts: data.contacts });
});

app.delete("/api/contacts/:id", async (req, res) => {
  const data = await readData();
  data.contacts = data.contacts.filter((c) => c.id !== req.params.id);
  logActivity(data, "contact_removed", { contactId: req.params.id });
  await writeData(data);
  res.json({ contacts: data.contacts });
});

app.post("/api/auth/request-otp", rateLimit({ keyPrefix: "otp", windowMs: 5 * 60 * 1000, max: 6 }), async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  const deviceId = String(req.body?.deviceId || "unknown-device");
  if (!phone) return res.status(400).json({ error: "phone is required" });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  if (dbPool) {
    try {
      await ensureDbReady();
      await dbPool.query(
        `INSERT INTO otp_codes (id, phone, code, device_id, expires_at, used, created_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes', false, NOW())`,
        [randomUUID(), phone, code, deviceId],
      );
      return res.json({ ok: true, expiresInSeconds: 300, demoCode: code });
    } catch {
      // Fallback below.
    }
  }

  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000, deviceId });
  return res.json({ ok: true, expiresInSeconds: 300, demoCode: code });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  const code = String(req.body?.code || "").trim();
  const deviceId = String(req.body?.deviceId || "unknown-device");

  if (dbPool) {
    try {
      await ensureDbReady();
      const otpRes = await dbPool.query(
        `SELECT id, code, device_id, expires_at
         FROM otp_codes
         WHERE phone = $1 AND used = false
         ORDER BY created_at DESC
         LIMIT 1`,
        [phone],
      );
      const saved = otpRes.rows[0];
      if (!saved || new Date(saved.expires_at).getTime() < Date.now() || saved.code !== code) {
        return res.status(403).json({ error: "Invalid or expired OTP" });
      }
      if (saved.device_id !== deviceId) return res.status(403).json({ error: "Device mismatch" });
      await dbPool.query("UPDATE otp_codes SET used = true WHERE id = $1", [saved.id]);
      const response = await createDbSessionForPhone(phone);
      return res.json(response);
    } catch {
      // Fallback below.
    }
  }

  const saved = otpStore.get(phone);
  if (!saved || saved.expiresAt < Date.now() || saved.code !== code) {
    return res.status(403).json({ error: "Invalid or expired OTP" });
  }
  if (saved.deviceId !== deviceId) return res.status(403).json({ error: "Device mismatch" });
  const token = randomUUID();
  const session = {
    userId: hashSha256(phone).slice(0, 16),
    phone,
    roles: ["user"],
    verifiedWoman: false,
    verificationMethod: null,
    createdAt: new Date().toISOString(),
  };
  sessionStore.set(token, session);
  otpStore.delete(phone);
  return res.json({ token, session });
});

app.post("/api/auth/clerk-sync", rateLimit({ keyPrefix: "clerk-sync", windowMs: 60 * 1000, max: 40 }), async (req, res) => {
  const secretKey = process.env.CLERK_SECRET_KEY || "";
  if (!secretKey.trim()) {
    return res.status(503).json({ ok: false, error: "Server missing CLERK_SECRET_KEY (Clerk Dashboard → API Keys → Secret)." });
  }
  if (!dbPool) {
    return res.status(503).json({ ok: false, error: "Database not configured (set SUPABASE_DB_URL)." });
  }
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ ok: false, error: "Missing Authorization bearer token" });

  try {
    await ensureDbReady();
  } catch {
    return res.status(503).json({ ok: false, error: "Database unavailable" });
  }

  try {
    const clerkUserId = await verifyClerkJwtToUserId(token);
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(clerkUserId);

    const email = user.primaryEmailAddress?.emailAddress || "";
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "";
    const imageUrl = user.imageUrl || null;

    await dbPool.query(
      `INSERT INTO clerk_profiles (clerk_user_id, email, full_name, image_url, last_synced_at, created_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         image_url = EXCLUDED.image_url,
         last_synced_at = NOW()`,
      [clerkUserId, email, fullName, imageUrl],
    );

    return res.json({
      ok: true,
      profile: { clerkUserId, email, fullName, imageUrl },
    });
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired Clerk session" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ session: req.session });
});

app.post("/api/auth/verify-identity", requireAuth, async (req, res) => {
  req.session.verifiedWoman = true;
  req.session.verificationMethod = String(req.body?.method || "manual-review");
  if (dbPool && req.session.authSource !== "clerk") {
    try {
      await dbPool.query(
        `UPDATE auth_users
         SET verified_woman = true, verification_method = $2, updated_at = NOW()
         WHERE id = $1`,
        [req.session.userId, req.session.verificationMethod],
      );
      await dbPool.query(
        `UPDATE auth_sessions
         SET verified_woman = true, verification_method = $2, roles = $3::jsonb
         WHERE token = $1`,
        [
          getAuthToken(req),
          req.session.verificationMethod,
          JSON.stringify(Array.from(new Set([...(req.session.roles || ["user"]), "verified_user"]))),
        ],
      );
    } catch {
      dbDisabledReason = dbDisabledReason || "DB unavailable during identity verification";
    }
  }
  res.json({ session: req.session });
});

app.post("/api/moderation/bootstrap", async (req, res) => {
  const bootstrapKey = String(process.env.MODERATOR_BOOTSTRAP_KEY || "");
  const providedKey = String(req.body?.bootstrapKey || "");
  if (!bootstrapKey || providedKey !== bootstrapKey) {
    return res.status(403).json({ error: "Invalid bootstrap key" });
  }

  const phone = String(req.body?.phone || "").trim();
  const displayName = String(req.body?.displayName || "Moderator").trim();
  if (!phone) return res.status(400).json({ error: "phone is required" });

  if (!dbPool) return res.status(400).json({ error: "Supabase DB is required for moderator bootstrap" });

  const userId = hashSha256(phone).slice(0, 16);
  try {
    await ensureDbReady();
    await dbPool.query(
      `INSERT INTO auth_users (id, phone, verified_woman, roles, verification_method, created_at, updated_at)
       VALUES ($1, $2, false, $3::jsonb, NULL, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET roles = EXCLUDED.roles, updated_at = NOW()`,
      [userId, phone, JSON.stringify(["user", "moderator"])],
    );
    await dbPool.query(
      `INSERT INTO moderator_profiles (user_id, phone, display_name, role, active, created_at)
       VALUES ($1, $2, $3, 'moderator', true, NOW())
       ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone, display_name = EXCLUDED.display_name, active = true`,
      [userId, phone, displayName],
    );
    return res.json({ ok: true, userId, phone, displayName });
  } catch {
    return res.status(503).json({ error: "Supabase DB is unavailable for moderator bootstrap" });
  }
});

app.post("/api/legal/chat", rateLimit({ keyPrefix: "legal-chat", windowMs: 60 * 1000, max: 20 }), async (req, res) => {
  const userMessage = sanitizeUserText(req.body?.message);
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
  const systemPrompt = String(req.body?.systemPrompt || "");
  try {
    const safeHistory = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: sanitizeUserText(m.content) }));
    const reply = await callGroq({
      systemPrompt: `${systemPrompt}\n\nNever provide self-harm, illegal, or vigilante instructions. If emergency risk appears, prioritize official helplines.`,
      messages: [...safeHistory, { role: "user", content: userMessage }],
    });
    res.json({ reply, live: true });
  } catch {
    res.json({
      live: false,
      reply:
        "I understand this is stressful. Preserve screenshots, timestamps, and profile links. You can file with FIA Cybercrime (1991 / complaint.fia.gov.pk) and use SOS if in immediate danger (15 / 1099).",
    });
  }
});

app.post("/api/legal/draft-fir", rateLimit({ keyPrefix: "legal-draft", windowMs: 60 * 1000, max: 5 }), async (req, res) => {
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-20) : [];
  if (history.length === 0) {
    return res.json({ draft: "No chat history found to generate an FIR draft." });
  }

  try {
    const safeHistory = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: sanitizeUserText(m.content) }));
    const draftPrompt = `You are a legal assistant. Based on the following conversation history between the user and the legal aid chatbot, draft a formal First Information Report (FIR) or official cybercrime complaint addressed to the FIA (Federal Investigation Agency) Cybercrime Wing.
    
    Extract the key facts, dates, suspect information, and the nature of the offense from the chat. 
    Format it formally with placeholders like [Date], [Your Name], [Contact Info] for missing details.
    Do NOT include any markdown code blocks like \`\`\` text, just return the plain text of the draft.
    Keep it professional, objective, and structured.`;

    const draft = await callGroq({
      systemPrompt: draftPrompt,
      messages: [...safeHistory, { role: "user", content: "Please generate the FIR draft based on our conversation." }],
      maxTokens: 1000,
    });
    
    res.json({ draft: draft.trim() });
  } catch {
    res.status(500).json({ error: "Failed to generate FIR draft. Please try again later." });
  }
});

app.post("/api/legal/queue", async (req, res) => {
  const data = await readData();
  const item = {
    id: randomUUID(),
    type: "FIR_DRAFT_REVIEW",
    status: "pending_review",
    userId: String(req.body?.userId || "anonymous"),
    draft: sanitizeUserText(req.body?.draft || ""),
    createdAt: new Date().toISOString(),
    reviewerNotes: "",
  };
  data.legalQueue.push(item);
  logActivity(data, "legal_queue_item_created", { queueId: item.id });
  await writeData(data);
  res.json({ item });
});

app.post("/api/legal/consult", rateLimit({ keyPrefix: "legal-consult", windowMs: 60 * 1000, max: 10 }), async (req, res) => {
  const name = sanitizeUserText(req.body?.name || "").trim();
  const phone = sanitizeUserText(req.body?.phone || "").trim();
  const city = sanitizeUserText(req.body?.city || "").trim();
  const issueType = sanitizeUserText(req.body?.issueType || "").trim();
  const description = sanitizeUserText(req.body?.description || "").trim();
  const preferredTime = sanitizeUserText(req.body?.preferredTime || "").trim();
  const urgent = Boolean(req.body?.urgent);
  if (!phone || !city || !issueType || !description) {
    return res.status(400).json({ error: "phone, city, issueType, and description are required" });
  }
  const data = await readData();
  const request = {
    id: randomUUID(),
    name: name || "Anonymous",
    phone,
    city,
    issueType,
    description,
    preferredTime: preferredTime || "Earliest available",
    urgent,
    status: urgent ? "priority_queue" : "queued",
    createdAt: new Date().toISOString(),
  };
  data.legalConsultRequests.push(request);
  logActivity(data, "legal_consult_requested", {
    requestId: request.id,
    city: request.city,
    issueType: request.issueType,
    urgent: request.urgent,
  });
  await writeData(data);
  res.json({ request });
});

app.get("/api/legal/consult", async (req, res) => {
  const status = String(req.query.status || "all");
  const data = await readData();
  const items = data.legalConsultRequests
    .filter((item) => (status === "all" ? true : item.status === status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items });
});

app.post("/api/ai/analyze-image", rateLimit({ keyPrefix: "ai-vision", windowMs: 60 * 1000, max: 10 }), async (req, res) => {
  const { imageBase64, imageMimeType, toolType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

  let systemPrompt;
  if (toolType === "deepfake") {
    systemPrompt = "You are an AI Deepfake and Image Manipulation Detector. Analyze the provided image for signs of AI generation, inconsistencies in lighting, skin texture, background artifacts, or metadata anomalies. Provide a probability score and a detailed explanation of why you think it is or is not AI-generated. Return strict JSON with fields: { classification: 'Real'|'AI-Generated'|'Suspicious', confidence_score: number, anomalies: string[], explanation: string }";
  } else if (toolType === "dm") {
    systemPrompt = "You are an AI Harassment Scanner. Analyze this screenshot of a chat/message for threats, harassment, stalking, or abusive behavior under the PECA (Prevention of Electronic Crimes Act) framework of Pakistan. Return strict JSON with fields: { classification: string, severity: number, peca_section: string, peca_explanation: string, evidence_value: string, recommended_action: string, summary: string }";
  } else if (toolType === "voice") {
    systemPrompt = "You are an AI Voice Clone and Deepfake Audio Detector. Analyze the provided audio/spectrogram for signs of synthetic generation, robotic artifacts, or inconsistent pitch patterns. Return strict JSON with fields: { classification: 'Real'|'Synthetic'|'Suspicious', confidence_score: number, anomalies: string[], explanation: string }";
  } else {
    systemPrompt = "Analyze this image for any safety concerns, threats, or useful context for a women's safety app. Return strict JSON with a summary of findings.";
  }

  try {
    const output = await callGemini({
      systemPrompt: `${systemPrompt}\n\nReturn strict JSON only. No markdown.`,
      messages: [{ role: "user", content: "Analyze this image." }],
      imageBase64,
      imageMimeType: imageMimeType || "image/jpeg",
    });
    const parsed = JSON.parse(output.replace(/```json|```/g, "").trim());
    res.json({ result: parsed, live: true });
  } catch (err) {
    console.error("AI Vision failed:", err.message);
    res.status(500).json({ error: "AI Analysis failed", detail: err.message });
  }
});

app.post("/api/dm/scan", rateLimit({ keyPrefix: "dm-scan", windowMs: 60 * 1000, max: 20 }), async (req, res) => {
  const { text, imageBase64, imageMimeType, systemPrompt } = req.body;
  if (!text && !imageBase64) return res.status(400).json({ error: "text or imageBase64 is required" });

  try {
    const output = await callGemini({
      systemPrompt: `${systemPrompt || DM_SCAN_SYSTEM_PROMPT}\n\nReturn strict JSON only. No markdown.`,
      messages: [{ role: "user", content: text || "Analyze this screenshot." }],
      imageBase64: imageBase64 || null,
      imageMimeType: imageMimeType || "image/jpeg",
    });
    const parsed = JSON.parse(output.replace(/```json|```/g, "").trim());
    res.json({ result: parsed, live: true });
  } catch (err) {
    console.error("DM Scan failed:", err.message);
    res.json({
      result: {
        classification: "Threat (Offline Fallback)",
        severity: 7,
        peca_section: "PECA Section 24",
        peca_explanation: "Likely harassment based on offline heuristics.",
        evidence_value: "Medium",
        recommended_action: "Keep this proof and consult a legal expert.",
        summary: "Analysis failed, but the content appears concerning.",
      },
      live: false,
      error: err.message,
    });
  }
});

app.post("/api/transit/start", async (req, res) => {
  const data = await readData();
  const destination = String(req.body?.destination || "Unknown");
  const destinationCoords = req.body?.destinationCoords || null;
  const trip = {
    id: randomUUID(),
    destination,
    destinationCoords,
    startedAt: new Date().toISOString(),
    status: "active",
    events: ["Trip started", "Tracking link sent to trusted contacts"],
    locationHistory: [],
    noMovementSince: null,
    distanceTrendUpCount: 0,
    lastDistanceToDestinationKm: null,
  };
  data.trips.push(trip);
  logActivity(data, "trip_started", { tripId: trip.id });
  await writeData(data);
  res.json({ trip });
});

app.post("/api/transit/location", async (req, res) => {
  const data = await readData();
  const trip = data.trips.find((t) => t.id === req.body?.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const lat = Number(req.body?.lat);
  const lon = Number(req.body?.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: "lat/lon required" });
  const at = req.body?.at || new Date().toISOString();
  trip.locationHistory.push({ lat, lon, at });
  if (trip.locationHistory.length > 300) trip.locationHistory.shift();

  const alerts = [];
  const history = trip.locationHistory;
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const movedKm = haversineKm(prev.lat, prev.lon, lat, lon);
    if (movedKm < 0.05) {
      if (!trip.noMovementSince) trip.noMovementSince = at;
    } else {
      trip.noMovementSince = null;
    }
    if (trip.noMovementSince) {
      const idleMs = new Date(at).getTime() - new Date(trip.noMovementSince).getTime();
      if (idleMs >= 5 * 60 * 1000) alerts.push("No movement > 5 minutes");
    }
  }

  if (trip.destinationCoords && typeof trip.destinationCoords.lat === "number" && typeof trip.destinationCoords.lon === "number") {
    const currentDistance = haversineKm(lat, lon, trip.destinationCoords.lat, trip.destinationCoords.lon);
    if (typeof trip.lastDistanceToDestinationKm === "number" && currentDistance - trip.lastDistanceToDestinationKm > 0.8) {
      trip.distanceTrendUpCount += 1;
    } else {
      trip.distanceTrendUpCount = 0;
    }
    trip.lastDistanceToDestinationKm = currentDistance;
    if (trip.distanceTrendUpCount >= 2) alerts.push("Possible route deviation detected");
  }

  if (alerts.length > 0 && trip.status === "active") {
    trip.status = "deviated";
    trip.events.push(...alerts);
  }

  await writeData(data);
  res.json({ trip, alerts });
});

app.post("/api/transit/deviation", async (req, res) => {
  const data = await readData();
  const trip = data.trips.find((t) => t.id === req.body?.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  trip.status = "deviated";
  trip.events.push("Route deviation detected", data.settings.autoDialPolice ? "Police auto-dial scheduled" : "Police auto-dial disabled");
  await writeData(data);
  res.json({ trip });
});

app.post("/api/sos/start", async (req, res) => {
  const data = await readData();
  const event = {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    source: String(req.body?.source || "manual"),
    active: true,
    dispatchLogs: [],
  };

  for (const contact of data.contacts) {
    const target = String(contact.phone || "").trim();
    if (!target) {
      event.dispatchLogs.push({ contactId: contact.id, status: "skipped_no_phone" });
      continue;
    }
    const result = await sendSmsOptional(
      target,
      "Nigehbaan SOS alert: Emergency triggered. Please check on your contact immediately.",
    );
    event.dispatchLogs.push({ contactId: contact.id, ...result });
  }

  data.sosLogs.push(event);
  logActivity(data, "sos_started", { eventId: event.id, dispatchCount: event.dispatchLogs.length });
  await writeData(data);
  res.json({ event, contacts: data.contacts, autoDialPolice: data.settings.autoDialPolice });
});

app.post("/api/sos/stop", async (req, res) => {
  const data = await readData();
  const pin = String(req.body?.pin || "");
  if (pin !== data.settings.cancelPin) return res.status(403).json({ error: "Invalid PIN" });
  const active = [...data.sosLogs].reverse().find((entry) => entry.active);
  if (active) {
    active.active = false;
    active.stoppedAt = new Date().toISOString();
  }
  logActivity(data, "sos_stopped", { eventId: active?.id || null });
  await writeData(data);
  res.json({ ok: true });
});

app.post("/api/evidence/upload", async (req, res) => {
  const data = await readData();
  const incidentId = String(req.body?.incidentId || "default-incident");
  const title = String(req.body?.title || "Untitled evidence");
  const type = String(req.body?.type || "text");
  const rawContent = String(req.body?.content || "");
  const checksum = hashSha256(rawContent);
  const item = {
    id: randomUUID(),
    incidentId,
    title,
    type,
    checksum,
    size: rawContent.length,
    createdAt: new Date().toISOString(),
  };
  data.evidenceVault.push(item);

  const previousHash = data.evidenceTimeline.length ? data.evidenceTimeline[data.evidenceTimeline.length - 1].eventHash : "GENESIS";
  const payload = `${incidentId}|${item.id}|${checksum}|${previousHash}|${item.createdAt}`;
  const eventHash = hashSha256(payload);
  data.evidenceTimeline.push({
    id: randomUUID(),
    incidentId,
    action: "EVIDENCE_UPLOADED",
    evidenceId: item.id,
    previousHash,
    eventHash,
    createdAt: item.createdAt,
  });
  logActivity(data, "evidence_uploaded", { incidentId, evidenceId: item.id });
  await writeData(data);
  res.json({ item, chainEventHash: eventHash });
});

app.get("/api/evidence/timeline/:incidentId", async (req, res) => {
  const data = await readData();
  const timeline = data.evidenceTimeline.filter((entry) => entry.incidentId === req.params.incidentId);
  const evidence = data.evidenceVault.filter((item) => item.incidentId === req.params.incidentId);
  res.json({ incidentId: req.params.incidentId, evidence, timeline });
});

app.post("/api/evidence/export/:incidentId", async (req, res) => {
  const data = await readData();
  const incidentId = req.params.incidentId;
  const evidence = data.evidenceVault.filter((item) => item.incidentId === incidentId);
  const timeline = data.evidenceTimeline.filter((entry) => entry.incidentId === incidentId);
  const packet = {
    incidentId,
    generatedAt: new Date().toISOString(),
    evidenceCount: evidence.length,
    timelineCount: timeline.length,
    evidence,
    timeline,
  };
  const signature = hashSha256(JSON.stringify(packet));
  res.json({ packet, signature, format: "json-packet" });
});

app.get("/api/help/nearby", (req, res) => {
  const city = String(req.query.city || "Lahore");
  const contacts = nearbyHelpByCity[city] || nearbyHelpByCity.Lahore;
  res.json({ city, contacts });
});

app.get("/api/help/ngos", (req, res) => {
  const city = String(req.query.city || "Lahore");
  const ngos = nearbyNgosByCity[city] || nearbyNgosByCity.Lahore;
  res.json({ city, ngos });
});

app.get("/api/community/feed", async (req, res) => {
  const city = String(req.query.city || "Lahore");
  const data = await readData();

  const staticFeed = [
    {
      id: `advisory-${city}-1`,
      city,
      level: "advisory",
      title: `Safety advisory for ${city}`,
      description: "Prefer main roads after 8 PM, keep SOS ready, and share transit links with trusted contacts.",
      time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      source: "Nigehbaan Community Desk",
      tags: ["general-safety"],
      verified: true,
    },
    {
      id: `hotspot-${city}-1`,
      city,
      level: "watch",
      title: "Community hotspot watch",
      description: "Multiple community reports flagged poorly lit streets and harassment risk around bus stops.",
      time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      source: "Verified user reports",
      tags: ["night-risk", "unsafe-transit"],
      verified: true,
    },
  ];

  const reportFeed = data.communityReports
    .filter((r) => r.city === city && r.status === "approved")
    .slice(-20)
    .map((report) => ({
      id: `report-${report.id}`,
      city: report.city,
      level: report.level,
      title: report.title,
      description: report.description,
      time: report.time,
      source: report.anonymous ? "Anonymous community member" : "Community member",
      tags: report.tags || [],
      verified: Boolean(report.verified),
    }));

  const tripFeed = (data.trips || []).slice(-5).map((trip) => ({
    id: `trip-${trip.id}`,
    city,
    level: trip.status === "deviated" ? "high" : "info",
    title: trip.status === "deviated" ? "Transit deviation event" : "Transit safety update",
    description: `${trip.destination} - ${trip.events?.[trip.events.length - 1] || "Trip event recorded"}`,
    time: trip.startedAt,
    source: "Transit monitor",
    tags: ["unsafe-transit"],
    verified: true,
  }));

  const sosFeed = (data.sosLogs || []).slice(-5).map((event) => ({
    id: `sos-${event.id}`,
    city,
    level: event.active ? "high" : "resolved",
    title: event.active ? "SOS currently active" : "SOS event resolved",
    description: `Source: ${event.source}`,
    time: event.startedAt,
    source: "Emergency system",
    tags: ["emergency"],
    verified: true,
  }));

  const feed = [...reportFeed, ...sosFeed, ...tripFeed, ...staticFeed]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 12);

  res.json({ city, feed });
});

app.post("/api/community/report", rateLimit({ keyPrefix: "community-report", windowMs: 60 * 1000, max: 8 }), async (req, res) => {
  const city = String(req.body?.city || "").trim();
  const category = String(req.body?.category || "").trim();
  const area = String(req.body?.area || "").trim();
  const description = sanitizeUserText(req.body?.description || "");
  const anonymous = req.body?.anonymous !== false;
  if (!city || !category || !area || !description) {
    return res.status(400).json({ error: "city, category, area, and description are required" });
  }
  const data = await readData();
  const tags = moderateReportText(`${category} ${area} ${description}`);
  const verified = isVerifiedReport({ category, area, description });
  const report = {
    id: randomUUID(),
    city,
    category,
    area,
    description,
    anonymous,
    level: tags.includes("harassment") || tags.includes("cyber-abuse") ? "high" : "watch",
    title: `${category} reported near ${area}`,
    tags,
    verified,
    status: verified ? "approved" : "pending",
    moderationReason: verified ? "Auto-approved by quality threshold" : "Pending moderator review",
    time: new Date().toISOString(),
  };
  data.communityReports.push(report);
  logActivity(data, "community_report_created", { reportId: report.id, status: report.status });
  await writeData(data);
  res.json({ report });
});

app.get("/api/community/chat", async (req, res) => {
  const city = String(req.query.city || "Lahore");
  const data = await readData();
  const messages = (data.communityChatMessages || [])
    .filter((msg) => msg.city === city)
    .slice(-80);
  res.json({ city, messages });
});

app.post("/api/community/chat/message", rateLimit({ keyPrefix: "community-chat", windowMs: 60 * 1000, max: 30 }), async (req, res) => {
  const city = String(req.body?.city || "").trim();
  const text = sanitizeUserText(req.body?.text || "");
  const alias = sanitizeUserText(req.body?.alias || "Anonymous");
  const mode = String(req.body?.mode || "chat").trim(); // chat | incident
  const area = sanitizeUserText(req.body?.area || "");
  const category = sanitizeUserText(req.body?.category || "");
  const anonymous = req.body?.anonymous !== false;
  if (!city || !text) return res.status(400).json({ error: "city and text are required" });

  const data = await readData();
  const safeAlias = anonymous ? "Anonymous" : alias || "Community Member";
  const tags = mode === "incident" ? moderateReportText(`${category} ${area} ${text}`) : [];
  const message = {
    id: randomUUID(),
    city,
    mode: mode === "incident" ? "incident" : "chat",
    text,
    alias: safeAlias,
    anonymous,
    area: area || null,
    category: category || null,
    tags,
    severity: mode === "incident" && (tags.includes("harassment") || tags.includes("cyber-abuse")) ? "high" : "normal",
    createdAt: new Date().toISOString(),
  };
  data.communityChatMessages.push(message);

  if (message.mode === "incident") {
    const verified = isVerifiedReport({
      category: category || "Incident",
      area: area || "community area",
      description: text,
    });
    const report = {
      id: randomUUID(),
      city,
      category: category || "Community Incident",
      area: area || "Community area",
      description: text,
      anonymous,
      level: message.severity === "high" ? "high" : "watch",
      title: `${category || "Incident"} reported near ${area || "community area"}`,
      tags: tags.length ? tags : ["general-safety"],
      verified,
      status: verified ? "approved" : "pending",
      moderationReason: verified ? "Auto-approved by quality threshold" : "Pending moderator review",
      time: message.createdAt,
    };
    data.communityReports.push(report);
    logActivity(data, "community_incident_from_chat", {
      reportId: report.id,
      messageId: message.id,
      status: report.status,
    });
  }

  logActivity(data, "community_chat_message_created", { messageId: message.id, mode: message.mode, city });
  await writeData(data);
  res.json({ message });
});

app.get("/api/moderation/reports", requireModerator, async (req, res) => {
  const status = String(req.query.status || "pending");
  const data = await readData();
  const reports = data.communityReports.filter((report) => (status === "all" ? true : report.status === status));
  res.json({ reports });
});

app.post("/api/moderation/reports/:id/review", requireModerator, async (req, res) => {
  const action = String(req.body?.action || "").trim(); // approve|reject|takedown
  const reason = String(req.body?.reason || "").trim();
  const data = await readData();
  const report = data.communityReports.find((item) => item.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (!["approve", "reject", "takedown"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  report.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "taken_down";
  report.moderationReason = reason || "Reviewed by moderator";
  report.moderatedAt = new Date().toISOString();
  logActivity(data, "community_report_reviewed", { reportId: report.id, action: report.status });
  await writeData(data);
  res.json({ report });
});

app.post("/api/help/detect-city", async (req, res) => {
  const lat = Number(req.body?.lat);
  const lon = Number(req.body?.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: "lat and lon are required numbers" });

  let detectedCity = null;
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&key=${encodeURIComponent(googleKey)}`,
      );
      if (googleRes.ok) {
        const payload = await googleRes.json();
        const components = (payload.results || [])
          .flatMap((r) => r.address_components || [])
          .map((c) => String(c.long_name || ""));
        const text = components.join(" ").toLowerCase();
        for (const city of Object.keys(nearbyHelpByCity)) {
          if (text.includes(city.toLowerCase())) {
            detectedCity = city;
            break;
          }
        }
      }
    } catch {
      // fallback below
    }
  }
  if (!detectedCity) {
    try {
      const reverse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        { headers: { "user-agent": "nigehbaan-safety-app/1.0" } },
      );
      if (reverse.ok) {
        const payload = await reverse.json();
        const address = payload?.address || {};
        const text = `${address.city || ""} ${address.town || ""} ${address.state || ""} ${address.county || ""}`.toLowerCase();
        for (const city of Object.keys(nearbyHelpByCity)) {
          if (text.includes(city.toLowerCase())) {
            detectedCity = city;
            break;
          }
        }
      }
    } catch {
      // fallback below
    }
  }

  const nearest = nearestSupportedCity(lat, lon);
  const finalCity = detectedCity || nearest.city;
  res.json({
    city: finalCity,
    method: detectedCity ? "reverse_geocode" : "nearest_supported_city",
    distanceKmToSupportedCity: Number(nearest.distanceKm.toFixed(2)),
  });
});

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}
