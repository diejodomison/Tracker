import { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ══════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://bkdfbouefcnkowrrcqgp.supabase.co";
const SUPABASE_KEY = "sb_publishable_UiHlPSHypA2_yg47wOmemg_udwAgoLx";
// ══════════════════════════════════════════════════════════════════

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
const u = (t, q = "") => `${SUPABASE_URL}/rest/v1/${t}${q ? "?" + q : ""}`;
const db = {
  get: async (t, q) => { try { const r = await fetch(u(t, q), { headers: H }); return r.ok ? r.json() : []; } catch { return []; } },
  add: async (t, d) => { try { const r = await fetch(u(t), { method: "POST", headers: H, body: JSON.stringify(d) }); return r.ok ? r.json() : []; } catch { return []; } },
  set: async (t, id, d) => { try { await fetch(u(t, `id=eq.${id}`), { method: "PATCH", headers: H, body: JSON.stringify(d) }); } catch {} },
  del: async (t, id) => { try { await fetch(u(t, `id=eq.${id}`), { method: "DELETE", headers: H }); } catch {} },
};
const live = () => SUPABASE_URL && !SUPABASE_URL.includes("YOUR_PROJECT") && SUPABASE_KEY && !SUPABASE_KEY.includes("YOUR_ANON");

// ─── Defaults ─────────────────────────────────────────────────────
const DEF_CATS = [
  { name: "Lead Gen & Data", color: "#00C896" }, { name: "Cold Email Campaigns", color: "#4F9DFF" },
  { name: "LinkedIn Outreach", color: "#A78BFA" }, { name: "Apollo / Clay Enrichment", color: "#F59E0B" },
  { name: "Instantly / Domains", color: "#F97316" }, { name: "Zoho CRM / Pipeline", color: "#38BDF8" },
  { name: "Webinar & Partnerships", color: "#FB7185" }, { name: "AI Agents / Automation", color: "#C084FC" },
  { name: "Recruiting", color: "#EC4899" }, { name: "Website / Product", color: "#2DD4BF" },
  { name: "Reporting / Dashboards", color: "#06B6D4" }, { name: "Process Docs / SOPs", color: "#FBBF24" },
  { name: "Admin / Misc", color: "#94A3B8" },
];
const PRIO = { High: { color: "#f87171", bg: "#3a1a1a", icon: "▲" }, Medium: { color: "#F59E0B", bg: "#2a2a1a", icon: "◆" }, Low: { color: "#4ade80", bg: "#1a3a1a", icon: "▽" } };
const COLORS = ["#00C896","#4F9DFF","#A78BFA","#F59E0B","#F97316","#EC4899","#06B6D4","#2DD4BF","#FBBF24","#94A3B8","#f87171","#C084FC","#38BDF8","#FB7185","#84CC16","#E879F9","#22D3EE","#FF6B6B","#34D399","#818CF8"];
const PROFILE_COLORS = ["#00C896","#4F9DFF","#A78BFA","#F59E0B","#EC4899","#06B6D4","#f87171","#C084FC"];
const ADD_CAT = "__ADD__";
const INP = { width: "100%", background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const LBL = { fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 };

// ─── Timer calc ───────────────────────────────────────────────────
function calcTime(t) {
  let s = t.actual_seconds || 0;
  if (t.running && t.session_start) s += Math.max(0, Math.round((Date.now() - new Date(t.session_start).getTime()) / 1000));
  return s;
}
function getStatus(t) {
  if (t.finished) return calcTime(t) <= t.expected_minutes * 60 ? "Finished Early" : "Finished Late";
  if (t.running) return "In Progress";
  if ((t.actual_seconds || 0) > 0) return "Paused";
  return "Pending";
}
function sStyle(s) { return { "In Progress": { bg: "#1a3a2a", c: "#00C896", b: "#00C896" }, Paused: { bg: "#1a2a3a", c: "#4F9DFF", b: "#4F9DFF" }, "Finished Early": { bg: "#1a3a1a", c: "#4ade80", b: "#4ade80" }, "Finished Late": { bg: "#3a1a1a", c: "#f87171", b: "#f87171" } }[s] || { bg: "#1a1a2a", c: "#94A3B8", b: "#334155" }; }
function fmt(sec) { const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60; return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`; }
function fClock(d) { return d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : ""; }
function fDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""; }

// ─── Week helpers ─────────────────────────────────────────────────
function getWeekKey(date) {
  const d = new Date(date); const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}
function getMonthKey(weekStart) { const d = new Date(weekStart); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function formatWeekRange(weekStart) {
  const s = new Date(weekStart); const e = new Date(s); e.setDate(s.getDate() + 6);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
function formatMonth(mk) { const [y, m] = mk.split("-"); return new Date(y, m - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); }

// ─── Small components ─────────────────────────────────────────────
function Toggle({ on, set, label }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => set(!on)}>
    <div style={{ width: 38, height: 20, borderRadius: 11, background: on ? "#00C896" : "#1E293B", border: `1px solid ${on ? "#00C896" : "#334155"}`, position: "relative", transition: "all .25s" }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: on ? "#fff" : "#475569", position: "absolute", top: 2, left: on ? 21 : 3, transition: "all .25s" }} /></div>
    {label && <span style={{ fontSize: 11, color: on ? "#00C896" : "#475569" }}>{label}</span>}
  </div>);
}
function Ring({ pct, size = 54, sw = 4, color = "#A78BFA" }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (<svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E293B" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c-(Math.min(pct,100)/100)*c} strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s" }}/></svg>);
}
function GoalInput({ value, onChange, list }) {
  const [open, setOpen] = useState(false); const ref = useRef(null);
  const fil = list.filter(s => s.toLowerCase().includes(value.toLowerCase()));
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (<div ref={ref} style={{ position: "relative" }}>
    <input value={value} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="e.g. Send 500 cold emails" style={INP} />
    {open && fil.length > 0 && (<div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
      {fil.map(s => (<div key={s} onMouseDown={() => { onChange(s); setOpen(false); }} style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#E2E8F0", borderBottom: "1px solid #1E293B11" }} onMouseEnter={e => e.currentTarget.style.background="#1a1a2e"} onMouseLeave={e => e.currentTarget.style.background="transparent"}><span style={{ color: "#A78BFA", marginRight: 8 }}>◎</span>{s}</div>))}
    </div>)}
    <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{list.length > 0 ? "Type or select existing" : "Type a goal name"}</div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE PICKER (Netflix-style)
// ═══════════════════════════════════════════════════════════════════
function ProfilePicker({ profiles, onSelect, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const doCreate = async () => {
    const n = name.trim();
    if (!n || profiles.find(p => p.name.toLowerCase() === n.toLowerCase())) return;
    await onCreate(n);
    setName(""); setAdding(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace" }}>
      <div style={{ marginBottom: 50, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00C896", boxShadow: "0 0 12px #00C896" }} />
          <span style={{ fontSize: 14, color: "#00C896", letterSpacing: 5, textTransform: "uppercase", fontWeight: 600 }}>Paraleagle</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>Who's working?</div>
        <div style={{ fontSize: 12, color: "#475569" }}>Select your profile to start tracking</div>
      </div>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
        {profiles.map(p => (
          <div key={p.id || p.name} onClick={() => onSelect(p)} style={{ cursor: "pointer", textAlign: "center", transition: "transform .2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{
              width: 100, height: 100, borderRadius: 16, background: `linear-gradient(135deg, ${p.color}88, ${p.color}44)`,
              border: `2px solid ${p.color}66`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 700, color: p.color, marginBottom: 12,
              boxShadow: `0 4px 20px ${p.color}22`,
            }}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 600 }}>{p.name}</div>
          </div>
        ))}

        {/* Add new */}
        {!adding && (
          <div onClick={() => setAdding(true)} style={{ cursor: "pointer", textAlign: "center", transition: "transform .2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{
              width: 100, height: 100, borderRadius: 16, background: "#0D1117",
              border: "2px dashed #1E293B", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, color: "#334155", marginBottom: 12,
            }}>+</div>
            <div style={{ fontSize: 14, color: "#475569" }}>Add New</div>
          </div>
        )}
      </div>

      {adding && (
        <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 14, padding: 24, width: 320 }}>
          <div style={{ ...LBL, marginBottom: 12 }}>Your Name</div>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && doCreate()}
            placeholder="e.g. Diejo" style={{ ...INP, marginBottom: 16 }} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={doCreate} style={{ background: "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Create Profile</button>
            <button onClick={() => { setAdding(false); setName(""); }} style={{ background: "#1E293B", border: "none", borderRadius: 8, padding: "10px 18px", color: "#94A3B8", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{margin:0;background:#080C14}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HISTORY SIDEBAR
// ═══════════════════════════════════════════════════════════════════
function HistorySidebar({ tasks, sess, cats, user, onSelectWeek, selectedWeek }) {
  const [openMonths, setOpenMonths] = useState({});

  // Build month > week > tasks tree from user's tasks
  const userTasks = tasks.filter(t => t.user_name === user);
  const weekMap = {};
  userTasks.forEach(t => {
    const wk = getWeekKey(t.created_at);
    if (!weekMap[wk]) weekMap[wk] = [];
    weekMap[wk].push(t);
  });

  const monthMap = {};
  Object.keys(weekMap).sort().reverse().forEach(wk => {
    const mk = getMonthKey(wk);
    if (!monthMap[mk]) monthMap[mk] = [];
    monthMap[mk].push(wk);
  });

  const months = Object.keys(monthMap).sort().reverse();

  const toggleMonth = mk => setOpenMonths(p => ({ ...p, [mk]: !p[mk] }));

  // Auto-open current month
  useEffect(() => {
    const cur = getMonthKey(getWeekKey(new Date().toISOString()));
    setOpenMonths(p => ({ ...p, [cur]: true }));
  }, []);

  const color = name => (cats.find(c => c.name === name) || {}).color || "#94A3B8";

  return (
    <div style={{ width: 240, background: "#0A0E17", borderRight: "1px solid #1E293B", padding: "16px 0", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "0 16px 16px", borderBottom: "1px solid #1E293B", marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>History</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>{user}'s work log</div>
      </div>

      {months.length === 0 && (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "#1E293B", fontSize: 11 }}>No history yet</div>
      )}

      {months.map(mk => {
        const weeks = monthMap[mk];
        const isOpen = openMonths[mk];
        const totalTasks = weeks.reduce((s, w) => s + weekMap[w].length, 0);
        return (
          <div key={mk}>
            <div onClick={() => toggleMonth(mk)} style={{
              padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: isOpen ? "#0D111A" : "transparent", borderBottom: "1px solid #1E293B11",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#0D111A"} onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{formatMonth(mk)}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{totalTasks} task{totalTasks !== 1 ? "s" : ""}</div>
              </div>
              <span style={{ fontSize: 10, color: "#475569" }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && weeks.map(wk => {
              const wTasks = weekMap[wk];
              const finished = wTasks.filter(t => t.finished).length;
              const totalSec = wTasks.reduce((s, t) => s + calcTime(t), 0);
              const isSelected = selectedWeek === wk;
              const isCurrent = wk === getWeekKey(new Date().toISOString());
              return (
                <div key={wk} onClick={() => onSelectWeek(wk)} style={{
                  padding: "8px 16px 8px 28px", cursor: "pointer",
                  background: isSelected ? "#1a1a2e" : "transparent",
                  borderLeft: isSelected ? "2px solid #A78BFA" : "2px solid transparent",
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#0D111A"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: isSelected ? "#A78BFA" : "#94A3B8", fontWeight: isSelected ? 600 : 400 }}>
                        {formatWeekRange(wk)}
                        {isCurrent && <span style={{ fontSize: 8, color: "#00C896", marginLeft: 6, padding: "1px 5px", borderRadius: 8, background: "#1a3a2a", border: "1px solid #00C89644" }}>NOW</span>}
                      </div>
                      <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>
                        {wTasks.length} tasks • {finished} done • {fmt(totalSec)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
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
  const [selWeek, setSelWeek] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [form, setForm] = useState({ name: "", cat: DEF_CATS[0].name, mins: 30, notes: "", prio: "Medium", link: false, goal: "", contrib: "" });
  const enabled = live();

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Load everything
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    (async () => {
      const [c, t, s, p] = await Promise.all([db.get("categories", "order=id.asc"), db.get("tasks", "order=id.asc"), db.get("sessions", "order=id.asc"), db.get("profiles", "order=id.asc")]);
      if (c.length) setCats(c.map(x => ({ id: x.id, name: x.name, color: x.color })));
      setTasks(t); setSess(s); setProfiles(p); setConnected(true); setLoading(false);
      // Auto-select last used profile
      const last = localStorage.getItem("pe_user");
      if (last && p.find(x => x.name === last)) setUser(last);
    })();
  }, []);

  // Poll
  useEffect(() => {
    if (!enabled || !connected) return;
    const i = setInterval(async () => {
      const [t, s] = await Promise.all([db.get("tasks", "order=id.asc"), db.get("sessions", "order=id.asc")]);
      setTasks(prev => t.map(remote => { const local = prev.find(l => l.id === remote.id); if (local && local.session_start && !remote.session_start) return local; return remote; }));
      setSess(s);
    }, 10000);
    return () => clearInterval(i);
  }, [enabled, connected]);

  // Profile handlers
  const selectProfile = p => { setUser(p.name); localStorage.setItem("pe_user", p.name); };
  const createProfile = async (name) => {
    const color = PROFILE_COLORS[profiles.length % PROFILE_COLORS.length];
    if (enabled) { const r = await db.add("profiles", { name, color }); if (r.length) { setProfiles(p => [...p, r[0]]); selectProfile(r[0]); } }
    else { const p = { id: Date.now(), name, color }; setProfiles(pr => [...pr, p]); selectProfile(p); }
  };

  const color = n => (cats.find(c => c.name === n) || {}).color || "#94A3B8";
  const tSess = id => sess.filter(s => s.task_id === id);

  // Filter tasks for current user
  const myTasks = tasks.filter(t => t.user_name === user);
  const curWeek = getWeekKey(new Date().toISOString());
  const weekTasks = selWeek ? myTasks.filter(t => getWeekKey(t.created_at) === selWeek) : myTasks.filter(t => getWeekKey(t.created_at) === curWeek);
  const isCurrentWeek = !selWeek || selWeek === curWeek;

  const goals = [...new Set(weekTasks.filter(t => t.linked_to_weekly && t.weekly_goal_name).map(t => t.weekly_goal_name))];
  const goalData = g => { const l = weekTasks.filter(t => t.weekly_goal_name === g); return { linked: l, pct: Math.min(l.filter(t => t.finished).reduce((s, t) => s + t.contribution_percent, 0), 100) }; };
  const totalTime = weekTasks.reduce((s, t) => s + calcTime(t), 0);
  const catTime = cats.map(c => ({ name: c.name, color: c.color, sec: weekTasks.filter(t => t.category === c.name).reduce((s, t) => s + calcTime(t), 0) })).filter(c => c.sec > 0).sort((a, b) => b.sec - a.sec);
  const pend = weekTasks.filter(t => !t.finished), done = weekTasks.filter(t => t.finished);

  // CRUD
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
    const d = { name: form.name, category: form.cat, expected_minutes: Number(form.mins) || 30, notes: form.notes, priority: form.prio, actual_seconds: 0, running: false, finished: false, started_at: null, finished_at: null, session_start: null, linked_to_weekly: form.link, weekly_goal_name: form.link ? form.goal.trim() : "", contribution_percent: form.link ? c : 0, user_name: user };
    if (enabled) { const r = await db.add("tasks", d); if (r.length) setTasks(p => [...p, r[0]]); }
    else setTasks(p => [...p, { ...d, id: Date.now(), created_at: new Date().toISOString() }]);
    setForm({ name: "", cat: cats[0]?.name || "", mins: 30, notes: "", prio: "Medium", link: false, goal: "", contrib: "" }); setShowForm(false); setAddCat(false);
  };

  const doStart = async id => {
    const n = new Date().toISOString();
    const running = weekTasks.find(t => t.running && t.id !== id);
    if (running) await doPause(running.id);
    if (enabled) { const t = tasks.find(t => t.id === id); await db.set("tasks", id, { running: true, started_at: t?.started_at || n, session_start: n }); }
    setTasks(p => p.map(t => t.id === id ? { ...t, running: true, started_at: t.started_at || n, session_start: n } : t));
  };

  const doPause = async id => {
    const t = tasks.find(t => t.id === id); if (!t) return;
    const n = new Date().toISOString();
    const el = t.session_start ? Math.max(0, Math.round((Date.now() - new Date(t.session_start).getTime()) / 1000)) : 0;
    const ns = (t.actual_seconds || 0) + el;
    if (enabled) { await db.set("tasks", id, { running: false, actual_seconds: ns, session_start: null }); if (t.session_start) { const r = await db.add("sessions", { task_id: id, started_at: t.session_start, stopped_at: n, duration_sec: el, note: "" }); if (r.length) setSess(p => [...p, r[0]]); } }
    setTasks(p => p.map(x => x.id === id ? { ...x, running: false, actual_seconds: ns, session_start: null } : x));
  };

  const doFinish = async id => {
    const t = tasks.find(t => t.id === id); if (!t) return;
    const n = new Date().toISOString();
    const el = t.session_start ? Math.max(0, Math.round((Date.now() - new Date(t.session_start).getTime()) / 1000)) : 0;
    const ns = (t.actual_seconds || 0) + el;
    if (enabled) { await db.set("tasks", id, { running: false, finished: true, finished_at: n, actual_seconds: ns, session_start: null }); if (t.session_start) { const r = await db.add("sessions", { task_id: id, started_at: t.session_start, stopped_at: n, duration_sec: el, note: "" }); if (r.length) setSess(p => [...p, r[0]]); } }
    setTasks(p => p.map(x => x.id === id ? { ...x, running: false, finished: true, finished_at: n, actual_seconds: ns, session_start: null } : x));
  };

  const doDel = async id => { setTasks(p => p.filter(t => t.id !== id)); setSess(p => p.filter(s => s.task_id !== id)); if (enabled) await db.del("tasks", id); };
  const doNote = async (sid, note) => { setSess(p => p.map(s => s.id === sid ? { ...s, note } : s)); if (enabled) await db.set("sessions", sid, { note }); };

  if (loading) return (<div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace" }}>
    <div style={{ textAlign: "center" }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00C896", boxShadow: "0 0 20px #00C896", margin: "0 auto 16px", animation: "pulse 1s infinite" }} /><div style={{ color: "#00C896", fontSize: 12, letterSpacing: 3 }}>LOADING PARALEAGLE...</div></div>
  </div>);

  // Show profile picker if no user selected
  if (!user) return <ProfilePicker profiles={profiles} onSelect={selectProfile} onCreate={createProfile} />;

  const userProfile = profiles.find(p => p.name === user);
  const userColor = userProfile?.color || "#00C896";

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", display: "flex" }}>

      {/* ═══ HISTORY SIDEBAR ═══ */}
      {showHistory && <HistorySidebar tasks={tasks} sess={sess} cats={cats} user={user} onSelectWeek={w => setSelWeek(w === selWeek ? null : w)} selectedWeek={selWeek || curWeek} />}

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg,#0D1117,#0F1923)", borderBottom: "1px solid #1E293B", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setShowHistory(!showHistory)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 6, padding: "5px 8px", color: "#475569", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>☰</button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#00C896" : "#F59E0B", boxShadow: `0 0 8px ${connected ? "#00C896" : "#F59E0B"}`, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#00C896", letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Paraleagle</span>
                {enabled && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: connected ? "#1a3a2a" : "#2a2a1a", color: connected ? "#00C896" : "#F59E0B" }}>{connected ? "SYNCED" : "OFFLINE"}</span>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: "#F1F5F9" }}>
                {isCurrentWeek ? "This Week" : formatWeekRange(selWeek)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
              {["daily", "weekly"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "7px 18px", background: view === v ? "linear-gradient(135deg,#00C89622,#4F9DFF22)" : "transparent", border: "none", color: view === v ? "#00C896" : "#475569", fontSize: 10, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: view === v ? "2px solid #00C896" : "2px solid transparent" }}>
                  {v === "daily" ? "◉ Daily" : "◎ Weekly"}
                </button>
              ))}
            </div>

            {/* User badge */}
            <div onClick={() => { setUser(null); localStorage.removeItem("pe_user"); }} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 12px", borderRadius: 8, border: `1px solid ${userColor}44`, background: `${userColor}11` }}
              title="Switch profile">
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${userColor}88,${userColor}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: userColor }}>{user.charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: 11, color: userColor, fontWeight: 600 }}>{user}</span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#00C896" }}>{new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>{new Date(now).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
            </div>
          </div>
        </div>

        {!enabled && <div style={{ background: "#2a2a1a", borderBottom: "1px solid #F59E0B44", padding: "8px 24px", fontSize: 11, color: "#F59E0B" }}>⚠ Supabase not configured — data resets on refresh.</div>}

        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "20px 20px" }}>

          {/* ═══ DAILY ═══ */}
          {view === "daily" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
              {[{ l: "Tasks", v: weekTasks.length, c: "#4F9DFF" }, { l: "Running", v: weekTasks.filter(t => t.running).length, c: "#00C896" }, { l: "Done", v: done.length, c: "#4ade80" }, { l: "Time", v: fmt(totalTime), c: "#F59E0B" }].map(s => (
                <div key={s.l} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ ...LBL, marginBottom: 4 }}>{s.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {catTime.length > 0 && (<div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "14px 18px", marginBottom: 22 }}>
              <div style={{ ...LBL, marginBottom: 10 }}>Time by Category</div>
              {catTime.map(({ name, color: cl, sec }) => { const p = totalTime > 0 ? Math.round((sec/totalTime)*100) : 0; return (<div key={name} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 11, color: cl }}>{name}</span><span style={{ fontSize: 11, color: "#64748B" }}>{fmt(sec)} ({p}%)</span></div>
                <div style={{ height: 3, background: "#1E293B", borderRadius: 4 }}><div style={{ height: "100%", borderRadius: 4, width: `${p}%`, background: cl }} /></div>
              </div>); })}
            </div>)}

            {isCurrentWeek && <div style={{ marginBottom: 18 }}>
              <button onClick={() => { setShowForm(!showForm); setAddCat(false); }} style={{ background: showForm ? "#1E293B" : "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 10, padding: "10px 20px", color: showForm ? "#94A3B8" : "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
                {showForm ? "✕ Cancel" : "+ Add Task"}
              </button>
            </div>}

            {showForm && isCurrentWeek && (<div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 14, padding: 20, marginBottom: 22 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={LBL}>Task</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => e.key === "Enter" && !addCat && doAdd()} placeholder="What are you working on?" style={INP} /></div>
                <div><label style={LBL}>Category</label><select value={addCat ? ADD_CAT : form.cat} onChange={e => { if (e.target.value === ADD_CAT) setAddCat(true); else { setForm(f => ({ ...f, cat: e.target.value })); setAddCat(false); } }} style={INP}>{cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}<option disabled>─────────</option><option value={ADD_CAT}>+ New Category</option></select></div>
                <div><label style={LBL}>Priority</label><select value={form.prio} onChange={e => setForm({ ...form, prio: e.target.value })} style={INP}>{Object.keys(PRIO).map(p => <option key={p}>{p}</option>)}</select></div>
              </div>
              {addCat && (<div style={{ background: "#0A0F1A", border: "1px solid #00C89644", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 10, color: "#00C896", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>New Category</span><button onClick={() => setAddCat(false)} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer" }}>✕</button></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}><div><label style={LBL}>Name</label><input value={catName} onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && doAddCat()} placeholder="e.g. Client Calls" style={INP} autoFocus /></div><div><label style={LBL}>Hex</label><input value={catHex} onChange={e => setCatHex(e.target.value)} placeholder="#FF5733" style={{ ...INP, width: 100 }} /></div></div>
                <div style={{ marginBottom: 10 }}><label style={LBL}>Color</label><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{COLORS.map(c => <div key={c} onClick={() => { setCatColor(c); setCatHex(""); }} style={{ width: 22, height: 22, borderRadius: 4, background: c, cursor: "pointer", border: catColor === c && !catHex ? "2px solid #fff" : "2px solid transparent" }} />)}</div></div>
                <button onClick={doAddCat} style={{ background: "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 7, padding: "7px 18px", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Create</button>
              </div>)}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
                <div><label style={LBL}>Expected (min)</label><input type="number" value={form.mins} onChange={e => setForm({ ...form, mins: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Context..." style={INP} /></div>
              </div>
              <div style={{ background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <Toggle on={form.link} set={v => setForm({ ...form, link: v })} label="Link to Weekly Goal" />
                {form.link && (<div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div><label style={LBL}>Goal</label><GoalInput value={form.goal} onChange={v => setForm({ ...form, goal: v })} list={goals} /></div>
                  <div><label style={LBL}>Contrib %</label><input type="number" min="0" max="100" value={form.contrib} onChange={e => setForm({ ...form, contrib: e.target.value })} placeholder="20" style={INP} /></div>
                </div>)}
              </div>
              <button onClick={doAdd} style={{ background: "linear-gradient(135deg,#00C896,#4F9DFF)", border: "none", borderRadius: 8, padding: "9px 24px", color: "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Add Task</button>
            </div>)}

            {pend.length > 0 && (<div style={{ marginBottom: 24 }}>
              <div style={{ ...LBL, letterSpacing: 3, marginBottom: 12 }}>To Do — {pend.length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{pend.map(t => <Card key={t.id} t={t} cc={color(t.category)} onStart={doStart} onPause={doPause} onFinish={doFinish} onDel={doDel} gd={goalData} ss={tSess(t.id)} onNote={doNote} now={now} isCurrent={isCurrentWeek} />)}</div>
            </div>)}

            {done.length > 0 && (<div>
              <div style={{ ...LBL, letterSpacing: 3, marginBottom: 12 }}>Completed — {done.length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{done.map(t => { const st = getStatus(t), ss = sStyle(st), cc = color(t.category), pr = PRIO[t.priority] || PRIO.Medium, d = calcTime(t) - t.expected_minutes * 60, ts = tSess(t.id); return (
                <div key={t.id} style={{ background: "#090D14", border: "1px solid #1E293B", borderLeft: `3px solid ${cc}44`, borderRadius: 12, padding: "12px 16px", opacity: .75 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: pr.color }}>{pr.icon}</span>
                      <span style={{ fontSize: 13, color: "#94A3B8", textDecoration: "line-through" }}>{t.name}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: ss.bg, color: ss.c, border: `1px solid ${ss.b}`, textTransform: "uppercase" }}>{st}</span>
                      {t.linked_to_weekly && t.weekly_goal_name && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#1a1a2e44", color: "#A78BFA88" }}>✓ {t.weekly_goal_name} +{t.contribution_percent}%</span>}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#334155" }}>
                      <span style={{ color: cc+"88" }}>● {t.category}</span><span>Exp: {t.expected_minutes}m</span><span>Actual: {fmt(calcTime(t))}</span>
                      <span style={{ color: d > 0 ? "#f87171" : "#4ade80" }}>{d > 0 ? `+${fmt(d)} over` : `${fmt(Math.abs(d))} under`}</span><span>{ts.length} sess</span>
                    </div></div>
                    {isCurrentWeek && <button onClick={() => doDel(t.id)} style={{ background: "transparent", border: "none", color: "#334155", fontSize: 14, cursor: "pointer" }}>✕</button>}
                  </div>
                </div>
              ); })}</div>
            </div>)}

            {weekTasks.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#1E293B" }}><div style={{ fontSize: 40, marginBottom: 12 }}>◈</div><div style={{ fontSize: 13, letterSpacing: 2 }}>{isCurrentWeek ? "NO TASKS YET" : "NO TASKS THIS WEEK"}</div></div>}
          </>)}

          {/* ═══ WEEKLY ═══ */}
          {view === "weekly" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
              {[{ l: "Goals", v: goals.length, c: "#A78BFA" }, { l: "Linked", v: weekTasks.filter(t => t.linked_to_weekly).length, c: "#4F9DFF" }, { l: "Avg %", v: goals.length ? Math.round(goals.reduce((s, g) => s + goalData(g).pct, 0)/goals.length)+"%" : "—", c: "#00C896" }].map(s => (
                <div key={s.l} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 14px" }}><div style={{ ...LBL, marginBottom: 4 }}>{s.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div></div>
              ))}
            </div>

            {goals.length > 0 ? (<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {goals.map(g => { const { linked, pct } = goalData(g), fin = linked.filter(t => t.finished), gc = [...new Set(linked.map(t => t.category))], exp = expGoal === g;
                const allS = linked.flatMap(t => tSess(t.id).map(s => ({ ...s, tn: t.name }))).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
                return (<div key={g} style={{ background: "#0D1117", border: `1px solid ${pct >= 100 ? "#4ade8044" : "#1E293B"}`, borderLeft: `3px solid ${pct >= 100 ? "#4ade80" : "#A78BFA"}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 700, color: pct >= 100 ? "#4ade80" : "#F1F5F9" }}>{pct >= 100 ? "✓ " : ""}{g}</span><span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: pct >= 100 ? "#1a3a1a" : "#1a1a2e", color: pct >= 100 ? "#4ade80" : "#A78BFA", textTransform: "uppercase" }}>{pct >= 100 ? "Done" : "Active"}</span></div>
                      <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>{gc.map(c => <span key={c} style={{ color: color(c) }}>● {c}</span>)}<span>{linked.length} tasks</span><span>{fin.length} done</span><span>{allS.length} sess</span></div>
                    </div>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}><Ring pct={pct} color={pct >= 100 ? "#4ade80" : "#A78BFA"} /><span style={{ position: "absolute", fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(pct)}%</span></div>
                  </div>
                  <div style={{ height: 4, background: "#1E293B", borderRadius: 6, marginBottom: 12 }}><div style={{ height: "100%", borderRadius: 6, width: `${pct}%`, background: pct >= 100 ? "linear-gradient(90deg,#4ade80,#00C896)" : "linear-gradient(90deg,#A78BFA,#4F9DFF)" }} /></div>

                  <div style={{ background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr .7fr .7fr 1fr .7fr", padding: "8px 12px", borderBottom: "1px solid #1E293B" }}>{["Task","Prio","Contrib","Status","Time"].map(h => <span key={h} style={{ ...LBL, marginBottom: 0, textAlign: h === "Task" ? "left" : "center", fontSize: 9 }}>{h}</span>)}</div>
                    {linked.map(t => { const st = getStatus(t), ss = sStyle(st), pr = PRIO[t.priority] || PRIO.Medium; return (
                      <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr .7fr .7fr 1fr .7fr", padding: "8px 12px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: t.finished ? "#64748B" : "#E2E8F0", textDecoration: t.finished ? "line-through" : "none" }}>{t.name}</span>
                        <div style={{ textAlign: "center" }}><span style={{ fontSize: 9, color: pr.color }}>{pr.icon}</span></div>
                        <div style={{ textAlign: "center" }}><span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA" }}>{t.contribution_percent}%</span></div>
                        <div style={{ textAlign: "center" }}><span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 20, background: ss.bg, color: ss.c, border: `1px solid ${ss.b}`, textTransform: "uppercase" }}>{st}</span></div>
                        <div style={{ textAlign: "center", fontSize: 10, color: "#64748B" }}>{fmt(calcTime(t))}</div>
                      </div>); })}
                  </div>

                  <button onClick={() => setExpGoal(exp ? null : g)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "5px 12px", color: "#475569", fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{exp ? "▲ Hide" : `▼ Sessions (${allS.length})`}</button>
                  {exp && allS.length > 0 && (<div style={{ marginTop: 10, background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .7fr 2fr", padding: "7px 12px", borderBottom: "1px solid #1E293B" }}>{["Task","Start","Stop","Dur","Note"].map(h => <span key={h} style={{ ...LBL, marginBottom: 0, fontSize: 8 }}>{h}</span>)}</div>
                    {allS.map((s, i) => (<div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .7fr 2fr", padding: "6px 12px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>{s.tn}</span>
                      <span style={{ fontSize: 9, color: "#475569" }}>{fDate(s.started_at)} {fClock(s.started_at)}</span>
                      <span style={{ fontSize: 9, color: "#475569" }}>{fClock(s.stopped_at)}</span>
                      <span style={{ fontSize: 9, color: "#64748B" }}>{fmt(s.duration_sec)}</span>
                      <input value={s.note || ""} onChange={e => doNote(s.id, e.target.value)} placeholder="Note..." style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "2px 5px", color: "#E2E8F0", fontSize: 9, fontFamily: "inherit", outline: "none", width: "100%" }} />
                    </div>))}
                  </div>)}
                </div>); })}
            </div>) : <div style={{ textAlign: "center", padding: "60px 0", color: "#1E293B" }}><div style={{ fontSize: 40, marginBottom: 12 }}>◎</div><div style={{ fontSize: 13, letterSpacing: 2 }}>NO WEEKLY GOALS</div></div>}
          </>)}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{margin:0;background:#080C14}input::placeholder{color:#334155}input:focus,select:focus{border-color:#334155!important}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080C14}::-webkit-scrollbar-thumb{background:#1E293B;border-radius:4px}`}</style>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────
function Card({ t, cc, onStart, onPause, onFinish, onDel, gd, ss, onNote, now, isCurrent }) {
  const sec = calcTime(t), st = getStatus(t), sty = sStyle(st);
  const exp = t.expected_minutes * 60, pct = exp > 0 ? Math.min((sec/exp)*100, 100) : 0, over = sec > exp;
  const pr = PRIO[t.priority] || PRIO.Medium;
  const [showS, setShowS] = useState(false);
  const wi = t.linked_to_weekly && t.weekly_goal_name ? gd(t.weekly_goal_name) : null;

  return (<div style={{ background: "#0D1117", border: `1px solid ${t.running ? cc+"44" : "#1E293B"}`, borderLeft: `3px solid ${cc}`, borderRadius: 12, padding: "14px 16px" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: pr.color, fontWeight: 700 }}>{pr.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{t.name}</span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: sty.bg, color: sty.c, border: `1px solid ${sty.b}`, textTransform: "uppercase" }}>{st}</span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: pr.bg, color: pr.color, border: `1px solid ${pr.color}44` }}>{t.priority}</span>
          {t.linked_to_weekly && t.weekly_goal_name && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#1a1a2e", color: "#A78BFA", border: "1px solid #A78BFA44" }}>↗ {t.weekly_goal_name} • {t.contribution_percent}%</span>}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
          <span style={{ color: cc }}>● {t.category}</span><span>Exp: {t.expected_minutes}m</span>
          {t.started_at && <span>Started: {fClock(t.started_at)}</span>}<span>{ss.length} sess</span>
          {t.notes && <span style={{ color: "#334155" }}>{t.notes}</span>}
        </div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, minWidth: 70, textAlign: "right", color: over ? "#f87171" : "#00C896", fontVariantNumeric: "tabular-nums" }}>{fmt(sec)}</div>
    </div>

    {wi && (<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "5px 9px", background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B" }}>
      <span style={{ fontSize: 10, color: "#A78BFA", whiteSpace: "nowrap" }}>Weekly: {t.weekly_goal_name}</span>
      <div style={{ flex: 1, height: 3, background: "#1E293B", borderRadius: 4 }}><div style={{ height: "100%", borderRadius: 4, width: `${wi.pct}%`, background: wi.pct >= 100 ? "#4ade80" : "#A78BFA" }} /></div>
      <span style={{ fontSize: 10, fontWeight: 700, color: wi.pct >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(wi.pct)}%</span>
    </div>)}

    <div style={{ height: 3, background: "#1E293B", borderRadius: 4, marginBottom: 10 }}><div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: over ? "#f87171" : cc }} /></div>

    {isCurrent && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {!t.running && <button onClick={() => onStart(t.id)} style={{ background: "#0A2818", border: "1px solid #00C896", borderRadius: 7, padding: "5px 13px", color: "#00C896", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>{sec > 0 ? "▶ Resume" : "▶ Start"}</button>}
      {t.running && <button onClick={() => onPause(t.id)} style={{ background: "#0A1A2A", border: "1px solid #4F9DFF", borderRadius: 7, padding: "5px 13px", color: "#4F9DFF", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>⏸ Pause</button>}
      <button onClick={() => onFinish(t.id)} style={{ background: "#0A1A0A", border: "1px solid #4ade80", borderRadius: 7, padding: "5px 13px", color: "#4ade80", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>✓ Finish</button>
      {ss.length > 0 && <button onClick={() => setShowS(!showS)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "5px 10px", color: "#475569", fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{showS ? "▲" : `▼ ${ss.length}`}</button>}
      <button onClick={() => onDel(t.id)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "5px 9px", color: "#475569", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✕</button>
    </div>}

    {showS && ss.length > 0 && (<div style={{ marginTop: 8, background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B", overflow: "hidden" }}>
      {ss.map((s, i) => (<div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "auto auto auto auto 1fr", gap: 8, alignItems: "center", padding: "5px 10px", borderBottom: "1px solid #1E293B11", fontSize: 10 }}>
        <span style={{ color: "#475569", minWidth: 50 }}>{fClock(s.started_at)}</span><span style={{ color: "#334155" }}>→</span><span style={{ color: "#475569", minWidth: 50 }}>{fClock(s.stopped_at)}</span><span style={{ color: "#64748B", minWidth: 45 }}>{fmt(s.duration_sec)}</span>
        <input value={s.note || ""} onChange={e => onNote(s.id, e.target.value)} placeholder="Note..." style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "2px 5px", color: "#E2E8F0", fontSize: 10, fontFamily: "inherit", outline: "none", width: "100%" }} />
      </div>))}
    </div>)}
  </div>);
}

