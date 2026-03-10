import { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════
// SUPABASE CONFIG — Replace with your values
// ══════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://bkdfbouefcnkowrrcqgp.supabase.co";
const SUPABASE_KEY = "sb_publishable_UiHlPSHypA2_yg47wOmemg_udwAgoLx";
// ══════════════════════════════════════════════════════════════════

const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
const url = (table, q = "") => `${SUPABASE_URL}/rest/v1/${table}${q ? "?" + q : ""}`;
const db = {
  get: async (t, q) => { try { const r = await fetch(url(t, q), { headers: HEADERS }); return r.ok ? r.json() : []; } catch { return []; } },
  add: async (t, d) => { try { const r = await fetch(url(t), { method: "POST", headers: HEADERS, body: JSON.stringify(d) }); return r.ok ? r.json() : []; } catch { return []; } },
  set: async (t, id, d) => { try { await fetch(url(t, `id=eq.${id}`), { method: "PATCH", headers: HEADERS, body: JSON.stringify(d) }); } catch {} },
  del: async (t, id) => { try { await fetch(url(t, `id=eq.${id}`), { method: "DELETE", headers: HEADERS }); } catch {} },
};
const supaOn = () => SUPABASE_URL && !SUPABASE_URL.includes("YOUR_PROJECT") && SUPABASE_KEY && !SUPABASE_KEY.includes("YOUR_ANON");

// ─── Categories ───────────────────────────────────────────────────
const DEF_CATS = [
  { name: "Lead Gen & Data", color: "#00C896" }, { name: "Cold Email Campaigns", color: "#4F9DFF" },
  { name: "LinkedIn Outreach", color: "#A78BFA" }, { name: "Apollo / Clay Enrichment", color: "#F59E0B" },
  { name: "Instantly / Domains", color: "#F97316" }, { name: "Zoho CRM / Pipeline", color: "#38BDF8" },
  { name: "Webinar & Partnerships", color: "#FB7185" }, { name: "AI Agents / Automation", color: "#C084FC" },
  { name: "Recruiting", color: "#EC4899" }, { name: "Website / Product", color: "#2DD4BF" },
  { name: "Reporting / Dashboards", color: "#06B6D4" }, { name: "Process Docs / SOPs", color: "#FBBF24" },
  { name: "Admin / Misc", color: "#94A3B8" },
];
const PRIO = {
  High: { color: "#f87171", bg: "#3a1a1a", icon: "▲" },
  Medium: { color: "#F59E0B", bg: "#2a2a1a", icon: "◆" },
  Low: { color: "#4ade80", bg: "#1a3a1a", icon: "▽" },
};
const COLORS = ["#00C896","#4F9DFF","#A78BFA","#F59E0B","#F97316","#EC4899","#06B6D4","#2DD4BF","#FBBF24","#94A3B8","#f87171","#C084FC","#38BDF8","#FB7185","#84CC16","#E879F9","#22D3EE","#FF6B6B","#34D399","#818CF8"];
const ADD_CAT = "__ADD__";

// ─── THE TIMER FUNCTION — This is the ONLY place time is calculated ──
// actual_seconds = accumulated time from FINISHED sessions (saved on pause/finish)
// session_start  = ISO timestamp of when current session began (set on start/resume)
// Display time   = actual_seconds + elapsed since session_start (if running)
function calcTime(task) {
  if (!task) return 0;
  let t = task.actual_seconds || 0;
  if (task.running && task.session_start) {
    t += Math.max(0, Math.round((Date.now() - new Date(task.session_start).getTime()) / 1000));
  }
  return t;
}

function getStatus(t) {
  if (t.finished) return calcTime(t) <= t.expected_minutes * 60 ? "Finished Early" : "Finished Late";
  if (t.running) return "In Progress";
  if ((t.actual_seconds || 0) > 0) return "Paused";
  return "Pending";
}
function statusStyle(s) {
  return { "In Progress": { bg: "#1a3a2a", c: "#00C896", b: "#00C896" }, Paused: { bg: "#1a2a3a", c: "#4F9DFF", b: "#4F9DFF" }, "Finished Early": { bg: "#1a3a1a", c: "#4ade80", b: "#4ade80" }, "Finished Late": { bg: "#3a1a1a", c: "#f87171", b: "#f87171" } }[s] || { bg: "#1a1a2a", c: "#94A3B8", b: "#334155" };
}
function fmt(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtClock(d) { return d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : ""; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""; }

// ─── Small components ─────────────────────────────────────────────
function Toggle({ on, set, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => set(!on)}>
      <div style={{ width: 38, height: 20, borderRadius: 11, background: on ? "#00C896" : "#1E293B", border: `1px solid ${on ? "#00C896" : "#334155"}`, position: "relative", transition: "all .25s" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: on ? "#fff" : "#475569", position: "absolute", top: 2, left: on ? 21 : 3, transition: "all .25s" }} />
      </div>
      {label && <span style={{ fontSize: 11, color: on ? "#00C896" : "#475569" }}>{label}</span>}
    </div>
  );
}
function Ring({ pct, size = 54, sw = 4, color = "#A78BFA" }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (<svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E293B" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c-(Math.min(pct,100)/100)*c} strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s" }}/></svg>);
}
function GoalInput({ value, onChange, list }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = list.filter(s => s.toLowerCase().includes(value.toLowerCase()));
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="e.g. Send 500 cold emails this week" style={INP} />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => { onChange(s); setOpen(false); }}
              style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#E2E8F0", borderBottom: "1px solid #1E293B11" }}
              onMouseEnter={e => e.currentTarget.style.background="#1a1a2e"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span style={{ color: "#A78BFA", marginRight: 8 }}>◎</span>{s}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{list.length > 0 ? "Type or select existing" : "Type a goal name"}</div>
    </div>
  );
}

const INP = { width: "100%", background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const LBL = { fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 };

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [cats, setCats] = useState(DEF_CATS);
  const [tasks, setTasks] = useState([]);
  const [sess, setSess] = useState([]);
  const [view, setView] = useState("daily");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addCat, setAddCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(COLORS[0]);
  const [catHex, setCatHex] = useState("");
  const [expGoal, setExpGoal] = useState(null);
  const [form, setForm] = useState({ name: "", cat: DEF_CATS[0].name, mins: 30, notes: "", prio: "Medium", link: false, goal: "", contrib: "" });
  const enabled = supaOn();

  // ── Tick — just updates `now` so calcTime recalculates ──
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Load from Supabase ──
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    (async () => {
      const [c, t, s] = await Promise.all([db.get("categories", "order=id.asc"), db.get("tasks", "order=id.asc"), db.get("sessions", "order=id.asc")]);
      if (c.length) setCats(c.map(x => ({ id: x.id, name: x.name, color: x.color })));
      setTasks(t); setSess(s); setConnected(true); setLoading(false);
    })();
  }, []);

  // ── Poll every 10s — just fetches raw server data ──
  useEffect(() => {
    if (!enabled || !connected) return;
    const i = setInterval(async () => {
      const [t, s] = await Promise.all([db.get("tasks", "order=id.asc"), db.get("sessions", "order=id.asc")]);
      // Only replace if server data looks valid (has the tasks we expect)
      if (t.length > 0 || tasks.length === 0) {
        setTasks(prev => {
          // For each remote task, check if we have a local version with session_start
          // that the server might not have yet (race condition protection)
          return t.map(remote => {
            const local = prev.find(l => l.id === remote.id);
            if (local && local.session_start && !remote.session_start) return local;
            return remote;
          });
        });
      }
      setSess(s);
    }, 10000);
    return () => clearInterval(i);
  }, [enabled, connected, tasks.length]);

  const color = name => (cats.find(c => c.name === name) || {}).color || "#94A3B8";
  const taskSess = id => sess.filter(s => s.task_id === id);
  const goals = [...new Set(tasks.filter(t => t.linked_to_weekly && t.weekly_goal_name).map(t => t.weekly_goal_name))];
  const goalData = g => { const l = tasks.filter(t => t.weekly_goal_name === g); return { linked: l, pct: Math.min(l.filter(t => t.finished).reduce((s, t) => s + t.contribution_percent, 0), 100) }; };
  const totalTime = tasks.reduce((s, t) => s + calcTime(t), 0);
  const catTime = cats.map(c => ({ name: c.name, color: c.color, sec: tasks.filter(t => t.category === c.name).reduce((s, t) => s + calcTime(t), 0) })).filter(c => c.sec > 0).sort((a, b) => b.sec - a.sec);
  const pend = tasks.filter(t => !t.finished), done = tasks.filter(t => t.finished);

  // ── CRUD ──
  const doAddCat = async () => {
    const n = catName.trim(); if (!n || cats.find(c => c.name === n)) return;
    const col = catHex.match(/^#[0-9a-fA-F]{6}$/) ? catHex : catColor;
    if (enabled) { const r = await db.add("categories", { name: n, color: col }); if (r.length) setCats(p => [...p, { id: r[0].id, name: r[0].name, color: r[0].color }]); }
    else setCats(p => [...p, { name: n, color: col }]);
    setForm(f => ({ ...f, cat: n })); setCatName(""); setCatHex(""); setAddCat(false);
  };

  const doAdd = async () => {
    if (!form.name.trim()) return;
    const c = form.contrib === "" ? 0 : Math.min(100, Math.max(0, Number(form.contrib) || 0));
    const d = { name: form.name, category: form.cat, expected_minutes: Number(form.mins) || 30, notes: form.notes, priority: form.prio, actual_seconds: 0, running: false, finished: false, started_at: null, finished_at: null, session_start: null, linked_to_weekly: form.link, weekly_goal_name: form.link ? form.goal.trim() : "", contribution_percent: form.link ? c : 0 };
    if (enabled) { const r = await db.add("tasks", d); if (r.length) setTasks(p => [...p, r[0]]); }
    else setTasks(p => [...p, { ...d, id: Date.now(), created_at: new Date().toISOString() }]);
    setForm({ name: "", cat: cats[0]?.name || "", mins: 30, notes: "", prio: "Medium", link: false, goal: "", contrib: "" });
    setShowForm(false); setAddCat(false);
  };

  const doStart = async (id) => {
    const nowISO = new Date().toISOString();
    // Pause any running task first
    const running = tasks.find(t => t.running && t.id !== id);
    if (running) await doPause(running.id);
    // Write server FIRST
    const task = tasks.find(t => t.id === id);
    if (enabled) await db.set("tasks", id, { running: true, started_at: task?.started_at || nowISO, session_start: nowISO });
    // Then local
    setTasks(p => p.map(t => t.id === id ? { ...t, running: true, started_at: t.started_at || nowISO, session_start: nowISO } : t));
  };

  const doPause = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowISO = new Date().toISOString();
    const elapsed = task.session_start ? Math.max(0, Math.round((Date.now() - new Date(task.session_start).getTime()) / 1000)) : 0;
    const newSec = (task.actual_seconds || 0) + elapsed;
    // Server first
    if (enabled) {
      await db.set("tasks", id, { running: false, actual_seconds: newSec, session_start: null });
      if (task.session_start) { const r = await db.add("sessions", { task_id: id, started_at: task.session_start, stopped_at: nowISO, duration_sec: elapsed, note: "" }); if (r.length) setSess(p => [...p, r[0]]); }
    }
    setTasks(p => p.map(t => t.id === id ? { ...t, running: false, actual_seconds: newSec, session_start: null } : t));
  };

  const doFinish = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowISO = new Date().toISOString();
    const elapsed = task.session_start ? Math.max(0, Math.round((Date.now() - new Date(task.session_start).getTime()) / 1000)) : 0;
    const newSec = (task.actual_seconds || 0) + elapsed;
    if (enabled) {
      await db.set("tasks", id, { running: false, finished: true, finished_at: nowISO, actual_seconds: newSec, session_start: null });
      if (task.session_start) { const r = await db.add("sessions", { task_id: id, started_at: task.session_start, stopped_at: nowISO, duration_sec: elapsed, note: "" }); if (r.length) setSess(p => [...p, r[0]]); }
    }
    setTasks(p => p.map(t => t.id === id ? { ...t, running: false, finished: true, finished_at: nowISO, actual_seconds: newSec, session_start: null } : t));
  };

  const doDel = async (id) => { setTasks(p => p.filter(t => t.id !== id)); setSess(p => p.filter(s => s.task_id !== id)); if (enabled) await db.del("tasks", id); };
  const doSessNote = async (sid, note) => { setSess(p => p.map(s => s.id === sid ? { ...s, note } : s)); if (enabled) await db.set("sessions", sid, { note }); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00C896", boxShadow: "0 0 20px #00C896", margin: "0 auto 16px", animation: "pulse 1s infinite" }} />
        <div style={{ color: "#00C896", fontSize: 12, letterSpacing: 3 }}>LOADING PARALEAGLE...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0D1117, #0F1923)", borderBottom: "1px solid #1E293B", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#00C896" : "#F59E0B", boxShadow: `0 0 8px ${connected ? "#00C896" : "#F59E0B"}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#00C896", letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Paraleagle</span>
            {enabled && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: connected ? "#1a3a2a" : "#2a2a1a", color: connected ? "#00C896" : "#F59E0B", border: `1px solid ${connected ? "#00C89644" : "#F59E0B44"}` }}>{connected ? "SYNCED" : "OFFLINE"}</span>}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 3, color: "#F1F5F9" }}>Work Tracker</div>
        </div>
        <div style={{ display: "flex", background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
          {["daily", "weekly"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "8px 20px", background: view === v ? "linear-gradient(135deg,#00C89622,#4F9DFF22)" : "transparent", border: "none", color: view === v ? "#00C896" : "#475569", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: view === v ? "2px solid #00C896" : "2px solid transparent" }}>
              {v === "daily" ? "◉ Daily" : "◎ Weekly"}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#00C896" }}>{new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{new Date(now).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      {!enabled && <div style={{ background: "#2a2a1a", borderBottom: "1px solid #F59E0B44", padding: "10px 28px", fontSize: 11, color: "#F59E0B" }}>⚠ Supabase not configured — data resets on refresh. Add your URL and key in App.jsx.</div>}

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "24px 20px" }}>

        {/* ═══ DAILY ═══ */}
        {view === "daily" && (<>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[{ l: "Total Tasks", v: tasks.length, c: "#4F9DFF" }, { l: "In Progress", v: tasks.filter(t => t.running).length, c: "#00C896" }, { l: "Completed", v: done.length, c: "#4ade80" }, { l: "Time Logged", v: fmt(totalTime), c: "#F59E0B" }].map(s => (
              <div key={s.l} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "13px 16px" }}>
                <div style={{ ...LBL, marginBottom: 5 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {catTime.length > 0 && (
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ ...LBL, marginBottom: 12 }}>Time by Category</div>
              {catTime.map(({ name, color: cl, sec }) => { const p = Math.round((sec / totalTime) * 100); return (
                <div key={name} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 11, color: cl }}>{name}</span><span style={{ fontSize: 11, color: "#64748B" }}>{fmt(sec)} ({p}%)</span></div>
                  <div style={{ height: 3, background: "#1E293B", borderRadius: 4 }}><div style={{ height: "100%", borderRadius: 4, width: `${p}%`, background: cl, transition: "width .5s" }} /></div>
                </div>
              ); })}
            </div>
          )}

          {/* Add button */}
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => { setShowForm(!showForm); setAddCat(false); }} style={{ background: showForm ? "#1E293B" : "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 10, padding: "11px 22px", color: showForm ? "#94A3B8" : "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
              {showForm ? "✕ Cancel" : "+ Add Daily Task"}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 14, padding: "22px", marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={LBL}>Task Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => e.key === "Enter" && !addCat && doAdd()} placeholder="What are you working on?" style={INP} /></div>
                <div><label style={LBL}>Category</label>
                  <select value={addCat ? ADD_CAT : form.cat} onChange={e => { if (e.target.value === ADD_CAT) setAddCat(true); else { setForm(f => ({ ...f, cat: e.target.value })); setAddCat(false); } }} style={INP}>
                    {cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    <option disabled>───────────────</option>
                    <option value={ADD_CAT}>+ Add New Category</option>
                  </select>
                </div>
                <div><label style={LBL}>Priority</label><select value={form.prio} onChange={e => setForm({ ...form, prio: e.target.value })} style={INP}>{Object.keys(PRIO).map(p => <option key={p}>{p}</option>)}</select></div>
              </div>

              {addCat && (
                <div style={{ background: "#0A0F1A", border: "1px solid #00C89644", borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 10, color: "#00C896", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>New Category</span>
                    <button onClick={() => setAddCat(false)} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
                    <div><label style={LBL}>Name</label><input value={catName} onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && doAddCat()} placeholder="e.g. Client Calls" style={INP} autoFocus /></div>
                    <div><label style={LBL}>Hex</label><input value={catHex} onChange={e => setCatHex(e.target.value)} placeholder="#FF5733" style={{ ...INP, width: 110 }} /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><label style={LBL}>Color</label><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{COLORS.map(c => <div key={c} onClick={() => { setCatColor(c); setCatHex(""); }} style={{ width: 24, height: 24, borderRadius: 5, background: c, cursor: "pointer", border: catColor === c && !catHex ? "2px solid #fff" : "2px solid transparent" }} />)}</div></div>
                  {catName.trim() && <div style={{ marginBottom: 10 }}><span style={{ fontSize: 10, color: "#475569" }}>Preview: </span><span style={{ fontSize: 12, color: catHex.match(/^#[0-9a-fA-F]{6}$/) ? catHex : catColor }}>● {catName.trim()}</span></div>}
                  <button onClick={doAddCat} style={{ background: "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 7, padding: "8px 20px", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Create</button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
                <div><label style={LBL}>Expected (mins)</label><input type="number" value={form.mins} onChange={e => setForm({ ...form, mins: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any context..." style={INP} /></div>
              </div>

              <div style={{ background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <Toggle on={form.link} set={v => setForm({ ...form, link: v })} label="Link to Weekly To-Do" />
                {form.link && (
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                    <div><label style={LBL}>Weekly Goal</label><GoalInput value={form.goal} onChange={v => setForm({ ...form, goal: v })} list={goals} /></div>
                    <div><label style={LBL}>Contribution %</label><input type="number" min="0" max="100" value={form.contrib} onChange={e => setForm({ ...form, contrib: e.target.value })} placeholder="e.g. 20" style={INP} /></div>
                  </div>
                )}
              </div>
              <button onClick={doAdd} style={{ background: "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 8, padding: "10px 26px", color: "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Add Task</button>
            </div>
          )}

          {/* Pending */}
          {pend.length > 0 && (<div style={{ marginBottom: 28 }}>
            <div style={{ ...LBL, letterSpacing: 3, marginBottom: 14 }}>To Do & In Progress — {pend.length} tasks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pend.map(t => <Card key={t.id} t={t} cc={color(t.category)} onStart={doStart} onPause={doPause} onFinish={doFinish} onDel={doDel} gd={goalData} ss={taskSess(t.id)} onNote={doSessNote} now={now} />)}
            </div>
          </div>)}

          {/* Done */}
          {done.length > 0 && (<div>
            <div style={{ ...LBL, letterSpacing: 3, marginBottom: 14 }}>Completed — {done.length} tasks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {done.map(t => { const st = getStatus(t), ss = statusStyle(st), cc = color(t.category), pr = PRIO[t.priority] || PRIO.Medium, d = calcTime(t) - t.expected_minutes * 60, ts = taskSess(t.id); return (
                <div key={t.id} style={{ background: "#090D14", border: "1px solid #1E293B", borderLeft: `3px solid ${cc}44`, borderRadius: 12, padding: "13px 18px", opacity: .75 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: pr.color }}>{pr.icon}</span>
                        <span style={{ fontSize: 13, color: "#94A3B8", textDecoration: "line-through" }}>{t.name}</span>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: ss.bg, color: ss.c, border: `1px solid ${ss.b}`, textTransform: "uppercase" }}>{st}</span>
                        {t.linked_to_weekly && t.weekly_goal_name && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e44", color: "#A78BFA88", border: "1px solid #A78BFA22" }}>✓ {t.weekly_goal_name} +{t.contribution_percent}%</span>}
                      </div>
                      <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#334155" }}>
                        <span style={{ color: cc + "88" }}>● {t.category}</span><span>Exp: {t.expected_minutes}m</span><span>Actual: {fmt(calcTime(t))}</span>
                        <span style={{ color: d > 0 ? "#f87171" : "#4ade80" }}>{d > 0 ? `+${fmt(d)} over` : `${fmt(Math.abs(d))} under`}</span>
                        <span>{ts.length} session{ts.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <button onClick={() => doDel(t.id)} style={{ background: "transparent", border: "none", color: "#334155", fontSize: 14, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ); })}
            </div>
          </div>)}

          {tasks.length === 0 && <div style={{ textAlign: "center", padding: "70px 0", color: "#1E293B" }}><div style={{ fontSize: 44, marginBottom: 14 }}>◈</div><div style={{ fontSize: 13, letterSpacing: 2 }}>NO TASKS YET</div></div>}
        </>)}

        {/* ═══ WEEKLY ═══ */}
        {view === "weekly" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[{ l: "Weekly Goals", v: goals.length, c: "#A78BFA" }, { l: "Linked Tasks", v: tasks.filter(t => t.linked_to_weekly).length, c: "#4F9DFF" }, { l: "Avg Completion", v: goals.length ? Math.round(goals.reduce((s, g) => s + goalData(g).pct, 0) / goals.length) + "%" : "—", c: "#00C896" }].map(s => (
              <div key={s.l} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "13px 16px" }}><div style={{ ...LBL, marginBottom: 5 }}>{s.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div></div>
            ))}
          </div>
          <div style={{ ...LBL, letterSpacing: 3, marginBottom: 8, color: "#334155" }}>Weekly goals auto-appear when you link daily tasks</div>

          {goals.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {goals.map(g => { const { linked, pct } = goalData(g), fin = linked.filter(t => t.finished), gc = [...new Set(linked.map(t => t.category))], exp = expGoal === g;
                const allS = linked.flatMap(t => taskSess(t.id).map(s => ({ ...s, tn: t.name, tc: t.category }))).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
                return (
                  <div key={g} style={{ background: "#0D1117", border: `1px solid ${pct >= 100 ? "#4ade8044" : "#1E293B"}`, borderLeft: `3px solid ${pct >= 100 ? "#4ade80" : "#A78BFA"}`, borderRadius: 14, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 100 ? "#4ade80" : "#F1F5F9" }}>{pct >= 100 ? "✓ " : ""}{g}</span>
                          <span style={{ fontSize: 9, padding: "2px 9px", borderRadius: 20, background: pct >= 100 ? "#1a3a1a" : "#1a1a2e", color: pct >= 100 ? "#4ade80" : "#A78BFA", border: `1px solid ${pct >= 100 ? "#4ade8044" : "#A78BFA44"}`, textTransform: "uppercase" }}>{pct >= 100 ? "Complete" : "In Progress"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
                          {gc.map(c => <span key={c} style={{ color: color(c) }}>● {c}</span>)}
                          <span>{linked.length} task{linked.length !== 1 ? "s" : ""}</span><span>{fin.length} done</span><span>{allS.length} session{allS.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ring pct={pct} color={pct >= 100 ? "#4ade80" : "#A78BFA"} />
                        <span style={{ position: "absolute", fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "#1E293B", borderRadius: 6, marginBottom: 14 }}><div style={{ height: "100%", borderRadius: 6, width: `${pct}%`, background: pct >= 100 ? "linear-gradient(90deg,#4ade80,#00C896)" : "linear-gradient(90deg,#A78BFA,#4F9DFF)", transition: "width .5s" }} /></div>

                    <div style={{ background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr .8fr .8fr 1fr .8fr", padding: "9px 14px", borderBottom: "1px solid #1E293B" }}>
                        {["Task", "Priority", "Contrib%", "Status", "Time"].map(h => <span key={h} style={{ ...LBL, marginBottom: 0, textAlign: h === "Task" ? "left" : "center" }}>{h}</span>)}
                      </div>
                      {linked.map(t => { const st = getStatus(t), ss = statusStyle(st), pr = PRIO[t.priority] || PRIO.Medium; return (
                        <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr .8fr .8fr 1fr .8fr", padding: "9px 14px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: t.finished ? "#64748B" : "#E2E8F0", textDecoration: t.finished ? "line-through" : "none" }}>{t.name}</span>
                          <div style={{ textAlign: "center" }}><span style={{ fontSize: 10, color: pr.color }}>{pr.icon} {t.priority}</span></div>
                          <div style={{ textAlign: "center" }}><span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{t.contribution_percent}%</span></div>
                          <div style={{ textAlign: "center" }}><span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: ss.bg, color: ss.c, border: `1px solid ${ss.b}`, textTransform: "uppercase" }}>{st}</span></div>
                          <div style={{ textAlign: "center", fontSize: 11, color: "#64748B" }}>{fmt(calcTime(t))}</div>
                        </div>
                      ); })}
                    </div>

                    <button onClick={() => setExpGoal(exp ? null : g)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "6px 14px", color: "#475569", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
                      {exp ? "▲ Hide Sessions" : `▼ Sessions (${allS.length})`}
                    </button>
                    {exp && allS.length > 0 && (
                      <div style={{ marginTop: 12, background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr 2fr", padding: "8px 14px", borderBottom: "1px solid #1E293B" }}>
                          {["Task", "Started", "Stopped", "Dur", "Note"].map(h => <span key={h} style={{ ...LBL, marginBottom: 0, fontSize: 9 }}>{h}</span>)}
                        </div>
                        {allS.map((s, i) => (
                          <div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr 2fr", padding: "7px 14px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.tn}</span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{fmtDate(s.started_at)} {fmtClock(s.started_at)}</span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{fmtClock(s.stopped_at)}</span>
                            <span style={{ fontSize: 10, color: "#64748B" }}>{fmt(s.duration_sec)}</span>
                            <input value={s.note || ""} onChange={e => doSessNote(s.id, e.target.value)} placeholder="Note..." style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "3px 6px", color: "#E2E8F0", fontSize: 10, fontFamily: "inherit", outline: "none", width: "100%" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ); })}
            </div>
          ) : <div style={{ textAlign: "center", padding: "70px 0", color: "#1E293B", marginTop: 16 }}><div style={{ fontSize: 44, marginBottom: 14 }}>◎</div><div style={{ fontSize: 13, letterSpacing: 2 }}>NO WEEKLY GOALS YET</div></div>}
        </>)}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{margin:0;background:#080C14}
        input::placeholder{color:#334155}input:focus,select:focus{border-color:#334155!important}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080C14}::-webkit-scrollbar-thumb{background:#1E293B;border-radius:4px}
      `}</style>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────
function Card({ t, cc, onStart, onPause, onFinish, onDel, gd, ss, onNote, now }) {
  const sec = calcTime(t), st = getStatus(t), sty = statusStyle(st);
  const exp = t.expected_minutes * 60, pct = exp > 0 ? Math.min((sec / exp) * 100, 100) : 0, over = sec > exp;
  const pr = PRIO[t.priority] || PRIO.Medium;
  const [showS, setShowS] = useState(false);
  const wi = t.linked_to_weekly && t.weekly_goal_name ? gd(t.weekly_goal_name) : null;

  return (
    <div style={{ background: "#0D1117", border: `1px solid ${t.running ? cc + "44" : "#1E293B"}`, borderLeft: `3px solid ${cc}`, borderRadius: 12, padding: "15px 17px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 9 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: pr.color, fontWeight: 700 }}>{pr.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{t.name}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: sty.bg, color: sty.c, border: `1px solid ${sty.b}`, textTransform: "uppercase" }}>{st}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: pr.bg, color: pr.color, border: `1px solid ${pr.color}44` }}>{t.priority}</span>
            {t.linked_to_weekly && t.weekly_goal_name && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e", color: "#A78BFA", border: "1px solid #A78BFA44" }}>↗ {t.weekly_goal_name} • {t.contribution_percent}%</span>}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: cc }}>● {t.category}</span><span>Exp: {t.expected_minutes}m</span>
            {t.started_at && <span>Started: {fmtClock(t.started_at)}</span>}
            <span>{ss.length} session{ss.length !== 1 ? "s" : ""}</span>
            {t.notes && <span style={{ color: "#334155" }}>{t.notes}</span>}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, minWidth: 75, textAlign: "right", color: over ? "#f87171" : "#00C896", fontVariantNumeric: "tabular-nums" }}>{fmt(sec)}</div>
      </div>

      {wi && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "6px 10px", background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B" }}>
          <span style={{ fontSize: 10, color: "#A78BFA", whiteSpace: "nowrap" }}>Weekly: {t.weekly_goal_name}</span>
          <div style={{ flex: 1, height: 3, background: "#1E293B", borderRadius: 4 }}><div style={{ height: "100%", borderRadius: 4, width: `${wi.pct}%`, background: wi.pct >= 100 ? "#4ade80" : "#A78BFA" }} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: wi.pct >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(wi.pct)}%</span>
        </div>
      )}

      <div style={{ height: 3, background: "#1E293B", borderRadius: 4, marginBottom: 11 }}><div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: over ? "#f87171" : cc, transition: "width .5s" }} /></div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {!t.running && <button onClick={() => onStart(t.id)} style={{ background: "#0A2818", border: "1px solid #00C896", borderRadius: 7, padding: "6px 14px", color: "#00C896", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>{sec > 0 ? "▶ Resume" : "▶ Start"}</button>}
        {t.running && <button onClick={() => onPause(t.id)} style={{ background: "#0A1A2A", border: "1px solid #4F9DFF", borderRadius: 7, padding: "6px 14px", color: "#4F9DFF", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>⏸ Pause</button>}
        <button onClick={() => onFinish(t.id)} style={{ background: "#0A1A0A", border: "1px solid #4ade80", borderRadius: 7, padding: "6px 14px", color: "#4ade80", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>✓ Finish</button>
        {ss.length > 0 && <button onClick={() => setShowS(!showS)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "6px 12px", color: "#475569", fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{showS ? "▲" : `▼ ${ss.length} session${ss.length !== 1 ? "s" : ""}`}</button>}
        <button onClick={() => onDel(t.id)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "6px 10px", color: "#475569", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✕</button>
      </div>

      {showS && ss.length > 0 && (
        <div style={{ marginTop: 10, background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B", overflow: "hidden" }}>
          {ss.map((s, i) => (
            <div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "auto auto auto auto 1fr", gap: 10, alignItems: "center", padding: "6px 12px", borderBottom: "1px solid #1E293B11", fontSize: 10 }}>
              <span style={{ color: "#475569", minWidth: 55 }}>{fmtClock(s.started_at)}</span>
              <span style={{ color: "#334155" }}>→</span>
              <span style={{ color: "#475569", minWidth: 55 }}>{fmtClock(s.stopped_at)}</span>
              <span style={{ color: "#64748B", minWidth: 50 }}>{fmt(s.duration_sec)}</span>
              <input value={s.note || ""} onChange={e => onNote(s.id, e.target.value)} placeholder="Note..." style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "3px 6px", color: "#E2E8F0", fontSize: 10, fontFamily: "inherit", outline: "none", width: "100%" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

