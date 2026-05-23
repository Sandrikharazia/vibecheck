import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("events.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    organizer_id TEXT NOT NULL,
    image_url TEXT,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );
`);

// Add sample events if table is empty
const count = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number };
if (count.count === 0) {
  const samples = [
    { title: "Tech Networking Night", description: "Connect with local developers", date: "2026-04-15T18:00", location: "Innovation Hub, London", category: "Tech", lat: 51.524, lng: -0.084 },
    { title: "Art in the Park", description: "Outdoor gallery and workshops", date: "2026-04-20T10:00", location: "Hyde Park, London", category: "Art", lat: 51.507, lng: -0.165 },
    { title: "Street Food Festival", description: "Taste flavors from around the world", date: "2026-05-01T12:00", location: "Southbank, London", category: "Food", lat: 51.506, lng: -0.115 },
    { title: "Sunday Football Match", description: "Friendly local football match", date: "2026-05-10T15:00", location: "Community Pitch, London", category: "Sports", lat: 51.548, lng: -0.192 }
  ];
  const insert = db.prepare("INSERT INTO events (title, description, date, location, category, organizer_id, image_url, lat, lng) VALUES (?, ?, ?, ?, ?, 'system', 'https://picsum.photos/seed/event/800/600', ?, ?)");
  samples.forEach(s => insert.run(s.title, s.description, s.date, s.location, s.category, s.lat, s.lng));
}

// Add default admins if they don't exist
const defaultAdmins = [
  { id: 'admin_1', email: 'admin@vibecheck.com', password: 'admin123' },
  { id: 'admin_2', email: 'kharaziasandro@gmail.com', password: 'password123' }
];

defaultAdmins.forEach(admin => {
  const exists = db.prepare("SELECT * FROM users WHERE email = ?").get(admin.email);
  if (!exists) {
    db.prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)").run(
      admin.id,
      admin.email,
      admin.password,
      'admin'
    );
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    
    res.json({ id: user.id, email: user.email, role: user.role });
  });

  app.post("/api/signup", (req, res) => {
    const { email, password } = req.body;
    const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    // Default all new signups to 'user' role. 
    // Roles are now managed in the database, not by email prefix.
    const role = "user";
    const id = Math.random().toString(36).substring(2, 15);
    
    db.prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)").run(id, email, password, role);
    res.json({ id, email, role });
  });

  // API Routes
  app.get("/api/events", (req, res) => {
    const { category, search } = req.query;
    let query = "SELECT * FROM events WHERE 1=1";
    const params: any[] = [];

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY date ASC";
    const events = db.prepare(query).all(...params);
    res.json(events);
  });

  app.get("/api/events/:id", (req, res) => {
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.post("/api/events", (req, res) => {
    const { title, description, date, location, category, image_url, organizer_id, lat, lng } = req.body;
    const result = db.prepare(`
      INSERT INTO events (title, description, date, location, category, image_url, organizer_id, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, 
      description, 
      date, 
      location, 
      category, 
      image_url || "https://picsum.photos/seed/event/800/600", 
      organizer_id || "guest_organizer",
      lat || 51.5074, // Default to London
      lng || -0.1278
    );
    
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/events/:id", (req, res) => {
    const { id } = req.params;
    try {
      const deleteTx = db.transaction((eventId) => {
        db.prepare("DELETE FROM saved_events WHERE event_id = ?").run(eventId);
        const result = db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
        return result.changes;
      });
      
      const changes = deleteTx(id);
      if (changes === 0) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ status: "deleted", changes });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/saved-events", (req, res) => {
    const userId = req.query.userId || "guest_user";
    const events = db.prepare(`
      SELECT e.* FROM events e
      JOIN saved_events s ON e.id = s.event_id
      WHERE s.user_id = ?
    `).all(userId);
    res.json(events);
  });

  app.post("/api/saved-events", (req, res) => {
    const { userId, eventId } = req.body;
    const existing = db.prepare("SELECT * FROM saved_events WHERE user_id = ? AND event_id = ?").get(userId, eventId);
    
    if (existing) {
      db.prepare("DELETE FROM saved_events WHERE user_id = ? AND event_id = ?").run(userId, eventId);
      return res.json({ status: "removed" });
    } else {
      db.prepare("INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)").run(userId, eventId);
      return res.json({ status: "saved" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
