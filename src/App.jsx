import { useState, useEffect, useRef } from "react";

const DEFAULT_CATEGORIES = [
  { name: "Lead Gen & Data", color: "#00C896" },
  { name: "Cold Email Campaigns", color: "#4F9DFF" },
  { name: "LinkedIn Outreach", color: "#A78BFA" },
  { name: "Apollo / Clay Enrichment", color: "#F59E0B" },
  { name: "Instantly / Domains", color: "#F97316" },
  { name: "Zoho CRM / Pipeline", color: "#38BDF8" },
  { name: "Webinar & Partnerships", color: "#FB7185" },
  { name: "AI Agents / Automation", color: "#C084FC" },
  { name: "Recruiting", color: "#EC4899" },
  { name: "Website / Product", color: "#2DD4BF" },
  { name: "Reporting / Dashboards", color: "#06B6D4" },
  { name: "Process Docs / SOPs", color: "#FBBF24" },
  { name: "Admin / Misc", color: "#94A3B8" },
];

const PRIORITY_CONFIG = {
  High: { color: "#f87171", bg: "#3a1a1a", icon: "▲" },
  Medium: { color: "#F59E0B", bg: "#2a2a1a", icon: "◆" },
  Low: { color: "#4ade80", bg: "#1a3a1a", icon: "▽" },
};

const PRESET_COLORS = [
  "#00C896", "#4F9DFF", "#A78BFA", "#F59E0B", "#F97316",
  "#EC4899", "#06B6D4", "#2DD4BF", "#FBBF24", "#94A3B8",
  "#f87171", "#C084FC", "#38BDF8", "#FB7185", "#84CC16",
  "#E879F9", "#22D3EE", "#FF6B6B", "#34D399", "#818CF8",
];

const ADD_NEW_CAT = "__ADD_NEW__";

function getStatus(task) {
  if (task.finished) return task.actualSeconds <= task.expectedMinutes * 60 ? "Finished Early" : "Finished Late";
  if (task.running) return "In Progress";
  if (task.actualSeconds > 0) return "Paused";
  return "Pending";
}

function getStatusStyle(status) {
  const m = {
    "In Progress": { bg: "#1a3a2a", color: "#00C896", border: "#00C896" },
    Paused: { bg: "#1a2a3a", color: "#4F9DFF", border: "#4F9DFF" },
    "Finished Early": { bg: "#1a3a1a", color: "#4ade80", border: "#4ade80" },
    "Finished Late": { bg: "#3a1a1a", color: "#f87171", border: "#f87171" },
  };
  return m[status] || { bg: "#1a1a2a", color: "#94A3B8", border: "#334155" };
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatClock(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

let taskId = 1;

function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onChange(!checked)}>
      <div style={{ width: 38, height: 20, borderRadius: 11, background: checked ? "#00C896" : "#1E293B", border: `1px solid ${checked ? "#00C896" : "#334155"}`, position: "relative", transition: "all 0.25s" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: checked ? "#fff" : "#475569", position: "absolute", top: 2, left: checked ? 21 : 3, transition: "all 0.25s" }} />
      </div>
      {label && <span style={{ fontSize: 11, color: checked ? "#00C896" : "#475569", letterSpacing: 0.5 }}>{label}</span>}
    </div>
  );
}

function Ring({ percent, size = 54, sw = 4, color = "#A78BFA" }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={c} strokeDashoffset={c - (Math.min(percent, 100) / 100) * c}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

// ─── Weekly Goal Suggestion Dropdown ──────────────────────────────
function WeeklyGoalInput({ value, onChange, suggestions }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));
  const showDropdown = focused && filtered.length > 0;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="e.g. Send 500 cold emails this week"
        style={{
          width: "100%", background: "#0A0F1A", border: "1px solid #1E293B",
          borderRadius: 8, padding: "10px 14px", color: "#E2E8F0",
          fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
        }}
      />
      {showDropdown && open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8,
          marginTop: 4, maxHeight: 180, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "6px 10px", fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase", borderBottom: "1px solid #1E293B" }}>
            Existing Weekly Goals
          </div>
          {filtered.map(s => (
            <div key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              style={{
                padding: "9px 14px", cursor: "pointer", fontSize: 12, color: "#E2E8F0",
                borderBottom: "1px solid #1E293B11",
                background: value === s ? "#1a1a2e" : "transparent",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1a1a2e"}
              onMouseLeave={e => e.currentTarget.style.background = value === s ? "#1a1a2e" : "transparent"}
            >
              <span style={{ color: "#A78BFA", marginRight: 8 }}>◎</span>{s}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>
        {suggestions.length > 0 ? "Type or select an existing weekly goal" : "Type a weekly goal name — it'll auto-create in the Weekly dashboard"}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState("daily");
  const [now, setNow] = useState(new Date());

  // Inline new category state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [customHex, setCustomHex] = useState("");

  const [newTask, setNewTask] = useState({
    name: "", category: DEFAULT_CATEGORIES[0].name, expectedMinutes: 30,
    notes: "", priority: "Medium", linkedToWeekly: false,
    weeklyGoalName: "", contributionPercent: "",
  });

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(new Date());
      setTasks(prev => prev.map(t => t.running ? { ...t, actualSeconds: t.actualSeconds + 1 } : t));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const getCatColor = (name) => (categories.find(c => c.name === name) || {}).color || "#94A3B8";

  const addCategory = () => {
    const n = newCatName.trim();
    if (!n || categories.find(c => c.name === n)) return;
    const col = customHex.match(/^#[0-9a-fA-F]{6}$/) ? customHex : newCatColor;
    setCategories(prev => [...prev, { name: n, color: col }]);
    setNewTask(t => ({ ...t, category: n }));
    setNewCatName(""); setCustomHex(""); setAddingCategory(false);
  };

  const handleCategoryChange = (val) => {
    if (val === ADD_NEW_CAT) {
      setAddingCategory(true);
    } else {
      setNewTask(t => ({ ...t, category: val }));
      setAddingCategory(false);
    }
  };

  const addTask = () => {
    if (!newTask.name.trim()) return;
    const rawContrib = newTask.contributionPercent;
    const contrib = rawContrib === "" || rawContrib === undefined ? 0 : Math.min(100, Math.max(0, Number(rawContrib) || 0));
    const task = {
      id: taskId++, name: newTask.name, category: newTask.category,
      expectedMinutes: Number(newTask.expectedMinutes) || 30, notes: newTask.notes,
      priority: newTask.priority, actualSeconds: 0, running: false, finished: false,
      startedAt: null, finishedAt: null, createdAt: new Date().toISOString(),
      linkedToWeekly: newTask.linkedToWeekly,
      weeklyGoalName: newTask.linkedToWeekly ? newTask.weeklyGoalName.trim() : "",
      contributionPercent: newTask.linkedToWeekly ? contrib : 0,
      sessions: [], _sessionStart: null,
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ name: "", category: categories[0]?.name || "", expectedMinutes: 30, notes: "", priority: "Medium", linkedToWeekly: false, weeklyGoalName: "", contributionPercent: "" });
    setShowForm(false); setAddingCategory(false);
  };

  const startTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, running: true, startedAt: t.startedAt || new Date().toISOString(), _sessionStart: new Date().toISOString() };
      if (t.running) {
        const dur = t._sessionStart ? Math.round((Date.now() - new Date(t._sessionStart).getTime()) / 1000) : 0;
        const sess = t._sessionStart ? [...t.sessions, { startedAt: t._sessionStart, stoppedAt: new Date().toISOString(), durationSec: dur, note: "" }] : t.sessions;
        return { ...t, running: false, sessions: sess, _sessionStart: null };
      }
      return t;
    }));
  };

  const pauseTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const dur = t._sessionStart ? Math.round((Date.now() - new Date(t._sessionStart).getTime()) / 1000) : 0;
      const sess = t._sessionStart ? [...t.sessions, { startedAt: t._sessionStart, stoppedAt: new Date().toISOString(), durationSec: dur, note: "" }] : t.sessions;
      return { ...t, running: false, sessions: sess, _sessionStart: null };
    }));
  };

  const finishTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const dur = t._sessionStart ? Math.round((Date.now() - new Date(t._sessionStart).getTime()) / 1000) : 0;
      const sess = t._sessionStart ? [...t.sessions, { startedAt: t._sessionStart, stoppedAt: new Date().toISOString(), durationSec: dur, note: "" }] : t.sessions;
      return { ...t, running: false, finished: true, finishedAt: new Date().toISOString(), sessions: sess, _sessionStart: null };
    }));
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const updateSessionNote = (tid, sidx, note) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== tid) return t;
      const sess = [...t.sessions]; sess[sidx] = { ...sess[sidx], note };
      return { ...t, sessions: sess };
    }));
  };

  const weeklyGoalNames = [...new Set(tasks.filter(t => t.linkedToWeekly && t.weeklyGoalName).map(t => t.weeklyGoalName))];
  function getWeeklyData(goalName) {
    const linked = tasks.filter(t => t.weeklyGoalName === goalName);
    const percent = linked.filter(t => t.finished).reduce((s, t) => s + t.contributionPercent, 0);
    return { linked, percent: Math.min(percent, 100) };
  }

  const totalWorked = tasks.reduce((s, t) => s + t.actualSeconds, 0);
  const catBreakdown = categories.map(c => ({
    cat: c.name, color: c.color,
    seconds: tasks.filter(t => t.category === c.name).reduce((s, t) => s + t.actualSeconds, 0),
  })).filter(c => c.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  const pending = tasks.filter(t => !t.finished);
  const finished = tasks.filter(t => t.finished);

  const inputS = { width: "100%", background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const labelS = { fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 };

  const [expandedGoal, setExpandedGoal] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#E2E8F0", fontFamily: "'JetBrains Mono','Fira Code',monospace", padding: 0 }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #0D1117 0%, #0F1923 100%)",
        borderBottom: "1px solid #1E293B", padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C896", boxShadow: "0 0 8px #00C896", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#00C896", letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Paraleagle</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 3, color: "#F1F5F9", letterSpacing: -0.5 }}>Work Tracker</div>
        </div>
        <div style={{ display: "flex", background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
          {["daily", "weekly"].map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              padding: "8px 20px", background: activeView === v ? "linear-gradient(135deg, #00C89622, #4F9DFF22)" : "transparent",
              border: "none", color: activeView === v ? "#00C896" : "#475569",
              fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
              letterSpacing: 1.5, textTransform: "uppercase",
              borderBottom: activeView === v ? "2px solid #00C896" : "2px solid transparent",
            }}>
              {v === "daily" ? "◉ Daily" : "◎ Weekly"}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#00C896", letterSpacing: -1 }}>{formatClock(now)}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "24px 20px" }}>

        {/* ═══════════ DAILY VIEW ═══════════ */}
        {activeView === "daily" && (<>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Tasks", value: tasks.length, color: "#4F9DFF" },
              { label: "In Progress", value: tasks.filter(t => t.running).length, color: "#00C896" },
              { label: "Completed", value: finished.length, color: "#4ade80" },
              { label: "Time Logged", value: formatTime(totalWorked), color: "#F59E0B" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "13px 16px" }}>
                <div style={{ ...labelS, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {catBreakdown.length > 0 && (
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ ...labelS, marginBottom: 12 }}>Time by Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {catBreakdown.map(({ cat, color, seconds }) => {
                  const pct = Math.round((seconds / totalWorked) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color }}>{cat}</span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>{formatTime(seconds)} ({pct}%)</span>
                      </div>
                      <div style={{ height: 3, background: "#1E293B", borderRadius: 4 }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Task Button */}
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => { setShowForm(!showForm); setAddingCategory(false); }} style={{
              background: showForm ? "#1E293B" : "linear-gradient(135deg, #00C896, #4F9DFF)",
              border: "none", borderRadius: 10, padding: "11px 22px",
              color: showForm ? "#94A3B8" : "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
            }}>
              {showForm ? "✕ Cancel" : "+ Add Daily Task"}
            </button>
          </div>

          {/* ── Add Task Form ── */}
          {showForm && (
            <div style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 14, padding: "22px", marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>Task Name</label>
                  <input value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && !addingCategory && addTask()} placeholder="What are you working on?" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Category</label>
                  <select
                    value={addingCategory ? ADD_NEW_CAT : newTask.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    style={inputS}
                  >
                    {categories.map(c => (
                      <option key={c.name} value={c.name} style={{ color: "#E2E8F0" }}>
                        {c.name}
                      </option>
                    ))}
                    <option disabled style={{ color: "#1E293B" }}>───────────────</option>
                    <option value={ADD_NEW_CAT} style={{ color: "#00C896" }}>+ Add New Category</option>
                  </select>
                </div>
                <div>
                  <label style={labelS}>Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={inputS}>
                    {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Inline New Category Creator ── */}
              {addingCategory && (
                <div style={{ background: "#0A0F1A", border: "1px solid #00C89644", borderRadius: 10, padding: "16px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, color: "#00C896", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>New Category</span>
                    <button onClick={() => setAddingCategory(false)} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>✕ Cancel</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12, alignItems: "end" }}>
                    <div>
                      <label style={labelS}>Name</label>
                      <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addCategory()}
                        placeholder="e.g. Client Calls" style={inputS} autoFocus />
                    </div>
                    <div>
                      <label style={labelS}>Custom Hex</label>
                      <input value={customHex} onChange={e => setCustomHex(e.target.value)}
                        placeholder="#FF5733" style={{ ...inputS, width: 110 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelS}>Pick a Color</label>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {PRESET_COLORS.map(c => (
                        <div key={c} onClick={() => { setNewCatColor(c); setCustomHex(""); }}
                          style={{
                            width: 24, height: 24, borderRadius: 5, background: c, cursor: "pointer",
                            border: newCatColor === c && !customHex ? "2px solid #fff" : "2px solid transparent",
                            transition: "border 0.15s",
                          }} />
                      ))}
                    </div>
                  </div>
                  {newCatName.trim() && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#475569" }}>Preview:</span>
                      <span style={{ fontSize: 12, color: customHex.match(/^#[0-9a-fA-F]{6}$/) ? customHex : newCatColor }}>● {newCatName.trim()}</span>
                    </div>
                  )}
                  <button onClick={addCategory} style={{
                    background: "linear-gradient(135deg, #00C896, #4F9DFF)",
                    border: "none", borderRadius: 7, padding: "8px 20px",
                    color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
                  }}>Create Category</button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>Expected Time (mins)</label>
                  <input type="number" value={newTask.expectedMinutes}
                    onChange={e => setNewTask({ ...newTask, expectedMinutes: e.target.value })} style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Notes (optional)</label>
                  <input value={newTask.notes} onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                    placeholder="Any context..." style={inputS} />
                </div>
              </div>

              {/* Weekly Link */}
              <div style={{ background: "#0A0F1A", border: "1px solid #1E293B", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <Toggle checked={newTask.linkedToWeekly}
                  onChange={val => setNewTask({ ...newTask, linkedToWeekly: val })}
                  label="Link to a Weekly To-Do" />
                {newTask.linkedToWeekly && (
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelS}>Weekly Goal Name</label>
                      <WeeklyGoalInput
                        value={newTask.weeklyGoalName}
                        onChange={v => setNewTask({ ...newTask, weeklyGoalName: v })}
                        suggestions={weeklyGoalNames}
                      />
                    </div>
                    <div>
                      <label style={labelS}>Contribution %</label>
                      <input type="number" min="0" max="100"
                        value={newTask.contributionPercent}
                        onChange={e => setNewTask({ ...newTask, contributionPercent: e.target.value })}
                        placeholder="e.g. 20" style={inputS} />
                    </div>
                  </div>
                )}
              </div>

              <button onClick={addTask} style={{
                background: "linear-gradient(135deg, #00C896, #4F9DFF)",
                border: "none", borderRadius: 8, padding: "10px 26px",
                color: "#fff", fontSize: 13, fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
              }}>Add Task</button>
            </div>
          )}

          {/* ── Pending Tasks ── */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ ...labelS, letterSpacing: 3, marginBottom: 14 }}>To Do & In Progress — {pending.length} tasks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.map(task => <TaskCard key={task.id} task={task} catColor={getCatColor(task.category)}
                  onStart={startTask} onPause={pauseTask} onFinish={finishTask} onDelete={deleteTask}
                  getWeeklyData={getWeeklyData} updateSessionNote={updateSessionNote} />)}
              </div>
            </div>
          )}

          {/* ── Finished Tasks ── */}
          {finished.length > 0 && (
            <div>
              <div style={{ ...labelS, letterSpacing: 3, marginBottom: 14 }}>Completed — {finished.length} tasks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {finished.map(task => {
                  const status = getStatus(task); const ss = getStatusStyle(status);
                  const catColor = getCatColor(task.category);
                  const diff = task.actualSeconds - task.expectedMinutes * 60;
                  const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                  return (
                    <div key={task.id} style={{ background: "#090D14", border: "1px solid #1E293B", borderLeft: `3px solid ${catColor}44`, borderRadius: 12, padding: "13px 18px", opacity: 0.75 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: pr.color }}>{pr.icon}</span>
                            <span style={{ fontSize: 13, color: "#94A3B8", textDecoration: "line-through" }}>{task.name}</span>
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, letterSpacing: 0.5, textTransform: "uppercase" }}>{status}</span>
                            {task.linkedToWeekly && task.weeklyGoalName && (
                              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e44", color: "#A78BFA88", border: "1px solid #A78BFA22" }}>
                                ✓ {task.weeklyGoalName} +{task.contributionPercent}%
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#334155" }}>
                            <span style={{ color: catColor + "88" }}>● {task.category}</span>
                            <span>Exp: {task.expectedMinutes}m</span>
                            <span>Actual: {formatTime(task.actualSeconds)}</span>
                            <span style={{ color: diff > 0 ? "#f87171" : "#4ade80" }}>
                              {diff > 0 ? `+${formatTime(diff)} over` : `${formatTime(Math.abs(diff))} under`}
                            </span>
                            <span>{task.sessions.length} session{task.sessions.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ background: "transparent", border: "none", color: "#334155", fontSize: 14, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div style={{ textAlign: "center", padding: "70px 0", color: "#1E293B" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>◈</div>
              <div style={{ fontSize: 13, letterSpacing: 2 }}>NO TASKS YET</div>
              <div style={{ fontSize: 11, marginTop: 8 }}>Hit + Add Daily Task to get started</div>
            </div>
          )}
        </>)}

        {/* ═══════════ WEEKLY VIEW (Dashboard Only) ═══════════ */}
        {activeView === "weekly" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Weekly Goals", value: weeklyGoalNames.length, color: "#A78BFA" },
              { label: "Linked Tasks", value: tasks.filter(t => t.linkedToWeekly).length, color: "#4F9DFF" },
              { label: "Avg Completion", value: weeklyGoalNames.length > 0 ? Math.round(weeklyGoalNames.reduce((s, g) => s + getWeeklyData(g).percent, 0) / weeklyGoalNames.length) + "%" : "—", color: "#00C896" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 12, padding: "13px 16px" }}>
                <div style={{ ...labelS, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ ...labelS, letterSpacing: 3, marginBottom: 8, color: "#334155" }}>
            Weekly goals auto-appear here when you link daily tasks — read-only dashboard
          </div>

          {weeklyGoalNames.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {weeklyGoalNames.map(goalName => {
                const { linked, percent } = getWeeklyData(goalName);
                const finishedLinked = linked.filter(t => t.finished);
                const goalCats = [...new Set(linked.map(t => t.category))];
                const isExpanded = expandedGoal === goalName;
                const allSessions = linked.flatMap(t => t.sessions.map(s => ({ ...s, taskName: t.name, taskId: t.id, taskCategory: t.category })));
                allSessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

                return (
                  <div key={goalName} style={{
                    background: "#0D1117", border: `1px solid ${percent >= 100 ? "#4ade8044" : "#1E293B"}`,
                    borderLeft: `3px solid ${percent >= 100 ? "#4ade80" : "#A78BFA"}`,
                    borderRadius: 14, padding: "20px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: percent >= 100 ? "#4ade80" : "#F1F5F9" }}>
                            {percent >= 100 ? "✓ " : ""}{goalName}
                          </span>
                          <span style={{ fontSize: 9, padding: "2px 9px", borderRadius: 20, background: percent >= 100 ? "#1a3a1a" : "#1a1a2e", color: percent >= 100 ? "#4ade80" : "#A78BFA", border: `1px solid ${percent >= 100 ? "#4ade8044" : "#A78BFA44"}`, letterSpacing: 1, textTransform: "uppercase" }}>
                            {percent >= 100 ? "Complete" : "In Progress"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
                          {goalCats.map(c => <span key={c} style={{ color: getCatColor(c) }}>● {c}</span>)}
                          <span>{linked.length} task{linked.length !== 1 ? "s" : ""}</span>
                          <span>{finishedLinked.length} done</span>
                          <span>{allSessions.length} session{allSessions.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ring percent={percent} color={percent >= 100 ? "#4ade80" : "#A78BFA"} />
                        <span style={{ position: "absolute", fontSize: 12, fontWeight: 700, color: percent >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(percent)}%</span>
                      </div>
                    </div>

                    <div style={{ height: 5, background: "#1E293B", borderRadius: 6, marginBottom: 14 }}>
                      <div style={{ height: "100%", borderRadius: 6, width: `${percent}%`, background: percent >= 100 ? "linear-gradient(90deg, #4ade80, #00C896)" : "linear-gradient(90deg, #A78BFA, #4F9DFF)", transition: "width 0.5s ease" }} />
                    </div>

                    {/* Task Table */}
                    <div style={{ background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 1fr 0.8fr", padding: "9px 14px", borderBottom: "1px solid #1E293B" }}>
                        {["Daily Task", "Priority", "Contrib %", "Status", "Time"].map(h => (
                          <span key={h} style={{ ...labelS, marginBottom: 0, textAlign: h === "Daily Task" ? "left" : "center" }}>{h}</span>
                        ))}
                      </div>
                      {linked.map(t => {
                        const st = getStatus(t); const stS = getStatusStyle(st);
                        const pr = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.Medium;
                        return (
                          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 1fr 0.8fr", padding: "9px 14px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: t.finished ? "#64748B" : "#E2E8F0", textDecoration: t.finished ? "line-through" : "none" }}>{t.name}</span>
                            <div style={{ textAlign: "center" }}><span style={{ fontSize: 10, color: pr.color }}>{pr.icon} {t.priority}</span></div>
                            <div style={{ textAlign: "center" }}><span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{t.contributionPercent}%</span></div>
                            <div style={{ textAlign: "center" }}><span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: stS.bg, color: stS.color, border: `1px solid ${stS.border}`, letterSpacing: 0.5, textTransform: "uppercase" }}>{st}</span></div>
                            <div style={{ textAlign: "center", fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{formatTime(t.actualSeconds)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <button onClick={() => setExpandedGoal(isExpanded ? null : goalName)} style={{
                      background: "transparent", border: "1px solid #1E293B", borderRadius: 7,
                      padding: "6px 14px", color: "#475569", fontSize: 11, fontFamily: "inherit", cursor: "pointer",
                    }}>
                      {isExpanded ? "▲ Hide Sessions" : `▼ Show All Sessions (${allSessions.length})`}
                    </button>

                    {isExpanded && allSessions.length > 0 && (
                      <div style={{ marginTop: 12, background: "#0A0F1A", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 2fr", padding: "8px 14px", borderBottom: "1px solid #1E293B" }}>
                          {["Task", "Started", "Stopped", "Duration", "Session Note"].map(h => (
                            <span key={h} style={{ ...labelS, marginBottom: 0, fontSize: 9 }}>{h}</span>
                          ))}
                        </div>
                        {allSessions.map((s, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 2fr", padding: "7px 14px", borderBottom: "1px solid #1E293B11", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.taskName}</span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatDate(s.startedAt)} {formatClock(s.startedAt)}</span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatClock(s.stoppedAt)}</span>
                            <span style={{ fontSize: 10, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{formatTime(s.durationSec)}</span>
                            <input value={s.note}
                              onChange={e => {
                                const t = tasks.find(t => t.id === s.taskId);
                                if (!t) return;
                                const idx = t.sessions.findIndex(ss => ss.startedAt === s.startedAt && ss.stoppedAt === s.stoppedAt);
                                if (idx >= 0) updateSessionNote(s.taskId, idx, e.target.value);
                              }}
                              placeholder="Add note..."
                              style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "3px 6px", color: "#E2E8F0", fontSize: 10, fontFamily: "inherit", outline: "none", width: "100%" }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "70px 0", color: "#1E293B", marginTop: 16 }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>◎</div>
              <div style={{ fontSize: 13, letterSpacing: 2 }}>NO WEEKLY GOALS YET</div>
              <div style={{ fontSize: 11, marginTop: 8 }}>Go to Daily view → toggle "Link to Weekly" when adding a task</div>
            </div>
          )}
        </>)}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        input:focus, select:focus { border-color: #334155 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080C14; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────
function TaskCard({ task, catColor, onStart, onPause, onFinish, onDelete, getWeeklyData, updateSessionNote }) {
  const status = getStatus(task); const ss = getStatusStyle(status);
  const expectedSec = task.expectedMinutes * 60;
  const pct = expectedSec > 0 ? Math.min((task.actualSeconds / expectedSec) * 100, 100) : 0;
  const overTime = task.actualSeconds > expectedSec;
  const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const [showSessions, setShowSessions] = useState(false);
  const weeklyInfo = task.linkedToWeekly && task.weeklyGoalName ? getWeeklyData(task.weeklyGoalName) : null;

  return (
    <div style={{ background: "#0D1117", border: `1px solid ${task.running ? catColor + "44" : "#1E293B"}`, borderLeft: `3px solid ${catColor}`, borderRadius: 12, padding: "15px 17px", transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 9 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: pr.color, fontWeight: 700 }}>{pr.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{task.name}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, letterSpacing: 0.5, textTransform: "uppercase" }}>{status}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: pr.bg, color: pr.color, border: `1px solid ${pr.color}44`, letterSpacing: 0.5 }}>{task.priority}</span>
            {task.linkedToWeekly && task.weeklyGoalName && (
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e", color: "#A78BFA", border: "1px solid #A78BFA44" }}>
                ↗ {task.weeklyGoalName} • {task.contributionPercent}%
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
            <span style={{ color: catColor }}>● {task.category}</span>
            <span>Exp: {task.expectedMinutes}m</span>
            {task.startedAt && <span>Started: {formatClock(task.startedAt)}</span>}
            <span>{task.sessions.length} session{task.sessions.length !== 1 ? "s" : ""}</span>
            {task.notes && <span style={{ color: "#334155" }}>{task.notes}</span>}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, minWidth: 75, textAlign: "right", color: overTime ? "#f87171" : "#00C896", fontVariantNumeric: "tabular-nums" }}>
          {formatTime(task.actualSeconds)}
        </div>
      </div>

      {weeklyInfo && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "6px 10px", background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B" }}>
          <span style={{ fontSize: 10, color: "#A78BFA", whiteSpace: "nowrap" }}>Weekly: {task.weeklyGoalName}</span>
          <div style={{ flex: 1, height: 3, background: "#1E293B", borderRadius: 4 }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${weeklyInfo.percent}%`, background: weeklyInfo.percent >= 100 ? "#4ade80" : "#A78BFA", transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: weeklyInfo.percent >= 100 ? "#4ade80" : "#A78BFA" }}>{Math.round(weeklyInfo.percent)}%</span>
        </div>
      )}

      <div style={{ height: 3, background: "#1E293B", borderRadius: 4, marginBottom: 11 }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: overTime ? "#f87171" : catColor, transition: "width 0.5s" }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {!task.running && (
          <button onClick={() => onStart(task.id)} style={{ background: "#0A2818", border: "1px solid #00C896", borderRadius: 7, padding: "6px 14px", color: "#00C896", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
            {task.actualSeconds > 0 ? "▶ Resume" : "▶ Start"}
          </button>
        )}
        {task.running && (
          <button onClick={() => onPause(task.id)} style={{ background: "#0A1A2A", border: "1px solid #4F9DFF", borderRadius: 7, padding: "6px 14px", color: "#4F9DFF", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>⏸ Pause</button>
        )}
        <button onClick={() => onFinish(task.id)} style={{ background: "#0A1A0A", border: "1px solid #4ade80", borderRadius: 7, padding: "6px 14px", color: "#4ade80", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>✓ Finish</button>
        {task.sessions.length > 0 && (
          <button onClick={() => setShowSessions(!showSessions)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "6px 12px", color: "#475569", fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>
            {showSessions ? "▲ Hide" : `▼ ${task.sessions.length} session${task.sessions.length !== 1 ? "s" : ""}`}
          </button>
        )}
        <button onClick={() => onDelete(task.id)} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 7, padding: "6px 10px", color: "#475569", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✕</button>
      </div>

      {showSessions && task.sessions.length > 0 && (
        <div style={{ marginTop: 10, background: "#0A0F1A", borderRadius: 8, border: "1px solid #1E293B", overflow: "hidden" }}>
          {task.sessions.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto auto auto 1fr", gap: 10, alignItems: "center", padding: "6px 12px", borderBottom: "1px solid #1E293B11", fontSize: 10 }}>
              <span style={{ color: "#475569", minWidth: 55 }}>{formatClock(s.startedAt)}</span>
              <span style={{ color: "#334155" }}>→</span>
              <span style={{ color: "#475569", minWidth: 55 }}>{formatClock(s.stoppedAt)}</span>
              <span style={{ color: "#64748B", fontVariantNumeric: "tabular-nums", minWidth: 50 }}>{formatTime(s.durationSec)}</span>
              <input value={s.note} onChange={e => updateSessionNote(task.id, i, e.target.value)}
                placeholder="Add session note..."
                style={{ background: "transparent", border: "1px solid #1E293B22", borderRadius: 4, padding: "3px 6px", color: "#E2E8F0", fontSize: 10, fontFamily: "inherit", outline: "none", width: "100%" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
