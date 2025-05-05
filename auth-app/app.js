import express from "express";
import cookieParser from "cookie-parser";
import { createId } from "@paralleldrive/cuid2";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

const sessions = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const db = await open({
  filename: "./db/database.sqlite",
  driver: sqlite3.Database,
});

await db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);`);

app.get("/", (req, res) => res.redirect("/login"));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password]);
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);

  if (user) {
    const sessionId = createId();
    sessions[sessionId] = { userId: user.id, name: user.name };
    res.cookie("sessionId", sessionId, { httpOnly: true });
    res.redirect("/dashboard");
  } else {
    res.send("Fel e-post eller lösenord");
  }
});

app.get("/dashboard", (req, res) => {
  const session = sessions[req.cookies.sessionId];
  if (!session) return res.redirect("/login");

  res.render("dashboard", { name: session.name });
});

app.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});
