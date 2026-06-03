import { useState, useMemo, useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = ["#0ea5e9","#f59e0b","#10b981","#f43f5e","#8b5cf6","#ec4899"];
const STORAGE_KEY = "policypilot_saved_quotes";

const INIT_VENDORS = [
  { id:1, name:"State Farm",  color:COLORS[0], autoPIF6:"880",  autoMo1:"195", autoMo2_6:"141", home:"2150" },
  { id:2, name:"Allstate",    color:COLORS[1], autoPIF6:"845",  autoMo1:"185", autoMo2_6:"136", home:"2080" },
  { id:3, name:"Progressive", color:COLORS[2], autoPIF6:"810",  autoMo1:"178", autoMo2_6:"128", home:"1990" },
  { id:4, name:"GEICO",       color:COLORS[3], autoPIF6:"775",  autoMo1:"168", autoMo2_6:"122", home:"2220" },
];
const INIT_CURRENT = { autoAnnual:"1950", home:"2300" };
const BLANK_NEW    = { name:"", autoPIF6:"", autoMo1:"", autoMo2_6:"", home:"" };

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:      { minHeight:"100vh", background:"#050d1a", color:"#e2e8f0", fontFamily:"'DM Mono','Fira Mono',monospace", padding:"0 0 80px" },
  header:    { background:"linear-gradient(135deg,#0f1f3d 0%,#080f1e 100%)", borderBottom:"1px solid #1e3a5f", padding:"26px 36px 22px" },
  logo:      { fontSize:20, fontWeight:700, letterSpacing:4, color:"#7dd3fc", textTransform:"uppercase" },
  sub:       { fontSize:11, color:"#334155", letterSpacing:3, marginTop:3 },
  badge:     { display:"inline-block", background:"#0c2645", border:"1px solid #1d4ed8", borderRadius:999, padding:"3px 14px", fontSize:11, color:"#93c5fd", marginTop:8 },
  tabs:      { display:"flex", gap:4, padding:"18px 36px 0", borderBottom:"1px solid #1e293b" },
  tabBtn:    (a) => ({ padding:"9px 20px", borderRadius:"8px 8px 0 0", cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:1, border:"none", background:a?"#1e3a5f":"transparent", color:a?"#7dd3fc":"#475569", transition:"all .2s" }),
  body:      { padding:"28px 36px" },
  sec:       { fontSize:10, letterSpacing:3, color:"#475569", textTransform:"uppercase", marginBottom:14, fontWeight:700 },
  card:      { background:"#0b1628", border:"1px solid #1e293b", borderRadius:12, padding:"18px 22px", marginBottom:14 },
  tbl:       { width:"100%", borderCollapse:"collapse" },
  th:        { fontSize:10, letterSpacing:2, color:"#475569", textTransform:"uppercase", padding:"8px 10px", textAlign:"left", borderBottom:"1px solid #1e293b", whiteSpace:"nowrap" },
  td:        (hi) => ({ padding:"12px 10px", borderBottom:"1px solid #080f1a", background:hi?"#0a1524":"transparent", verticalAlign:"middle" }),
  dot:       (c)  => ({ width:9, height:9, borderRadius:"50%", background:c, display:"inline-block", marginRight:7, flexShrink:0 }),
  bestBadge: { background:"#052e16", border:"1px solid #166534", color:"#4ade80", borderRadius:6, padding:"1px 7px", fontSize:10, fontWeight:700, marginLeft:7 },
  toggle:    (a)  => ({ padding:"6px 16px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:700, letterSpacing:1, transition:"all .2s", background:a?"#1d4ed8":"#1e293b", color:a?"#fff":"#64748b", borderRadius:6 }),
  btn:       (c)  => ({ padding:"9px 20px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, letterSpacing:1, background:c==="blue"?"#1d4ed8":c==="green"?"#166534":c==="red"?"#7f1d1d":"#1e293b", color:c==="red"?"#fca5a5":c==="green"?"#4ade80":"#e2e8f0" }),
  sumGrid:   { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 },
  sumCard:   (c)  => ({ background:"#0b1628", border:`1px solid ${c}33`, borderRadius:12, padding:"16px 18px", borderLeft:`3px solid ${c}` }),
  discBox:   { background:"#0d1f0d", border:"1px solid #166534", borderRadius:10, padding:"14px 16px", marginTop:10 },
  expandBtn: (c)  => ({ background:"transparent", border:`1px solid ${c}55`, borderRadius:6, color:c, cursor:"pointer", fontSize:10, fontWeight:700, padding:"3px 10px", letterSpacing:1, fontFamily:"inherit" }),
  vendorBox: { background:"#0b1628", border:"1px solid #1e293b", borderRadius:12, padding:"18px 20px", marginBottom:12 },
  calcRow:   { display:"flex", gap:16, flexWrap:"wrap", padding:"10px 0 2px" },
  inpBase:   { width:"100%", background:"#1e293b", borderRadius:8, padding:"9px 11px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
  lbl:       { fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, color:"#64748b", marginBottom:5, display:"block" },
  errTxt:    { fontSize:10, color:"#ef4444", marginTop:3, display:"block" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function pct(savings, base) {
  if (!base || savings == null || savings === 0) return null;
  return ((savings / base) * 100).toFixed(1);
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function sanitizeAmt(val) {
  let s = String(val).replace(/[^0-9.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  if (parts[1] !== undefined && parts[1].length > 2) s = parts[0] + "." + parts[1].slice(0,2);
  return s;
}
function validateVendor(v) {
  const e = {};
  if (!v.name || !v.name.trim())            e.name     = "Company name is required";
  if (!v.autoPIF6 || num(v.autoPIF6) <= 0)  e.autoPIF6 = num(v.autoPIF6)<=0 && v.autoPIF6!=="" ? "Must be > 0":"Required";
  if (!v.autoMo1  || num(v.autoMo1)  <= 0)  e.autoMo1  = num(v.autoMo1)<=0  && v.autoMo1!==""  ? "Must be > 0":"Required";
  if (!v.autoMo2_6|| num(v.autoMo2_6)<= 0)  e.autoMo2_6= num(v.autoMo2_6)<=0&& v.autoMo2_6!==""? "Must be > 0":"Required";
  if (!v.home     || num(v.home)     <= 0)  e.home     = num(v.home)<=0     && v.home!==""      ? "Must be > 0":"Required";
  return e;
}

// ── Primitive UI ──────────────────────────────────────────────────────────────
function Bar({ value, max, color }) {
  const w = max > 0 ? Math.round((value/max)*100) : 0;
  return (
    <div style={{ background:"#1e293b", borderRadius:6, height:8, overflow:"hidden", width:"100%", minWidth:80 }}>
      <div style={{ width:`${w}%`, background:color, height:"100%", borderRadius:6, transition:"width .5s ease" }} />
    </div>
  );
}
function Pill({ savings }) {
  if (savings == null || savings === 0) return <span style={{ color:"#64748b", fontSize:11 }}>—</span>;
  const pos = savings > 0;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:pos?"#052e16":"#450a0a",
      color:pos?"#4ade80":"#f87171", border:`1px solid ${pos?"#166534":"#991b1b"}`,
      borderRadius:999, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
      {pos?"▼":"▲"} {Math.abs(savings).toLocaleString("en-US",{minimumFractionDigits:2})}
    </span>
  );
}
function Tag({ label, color="#4ade80", bg="#052e16", border="#166534" }) {
  return (
    <span style={{ display:"inline-block", background:bg, border:`1px solid ${border}`,
      borderRadius:999, padding:"1px 8px", fontSize:10, fontWeight:700, color, letterSpacing:1 }}>
      {label}
    </span>
  );
}
function AmountInput({ label, value, onChange, error, accentColor, labelColor }) {
  const borderClr = error ? "#ef4444" : accentColor ? accentColor+"66" : "#334155";
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <label style={{ ...S.lbl, color:labelColor||(error?"#ef4444":"#64748b") }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ color:error?"#ef4444":accentColor||"#475569", fontSize:13, fontWeight:700, flexShrink:0 }}>$</span>
        <input type="text" inputMode="numeric" value={value}
          onChange={e => onChange(sanitizeAmt(e.target.value))}
          placeholder="0.00" autoComplete="off"
          style={{ ...S.inpBase, border:`1px solid ${borderClr}`, color:error?"#fca5a5":"#e2e8f0" }} />
      </div>
      {error && <span style={S.errTxt}>⚠ {error}</span>}
    </div>
  );
}
function TextInput({ label, value, onChange, placeholder, error }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <label style={{ ...S.lbl, color:error?"#ef4444":"#64748b" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder||""} autoComplete="off"
        style={{ ...S.inpBase, border:`1px solid ${error?"#ef4444":"#334155"}`, color:error?"#fca5a5":"#e2e8f0" }} />
      {error && <span style={S.errTxt}>⚠ {error}</span>}
    </div>
  );
}

// ── PaySchedule ───────────────────────────────────────────────────────────────
function PaySchedule({ vendor, color }) {
  const pif6=num(vendor.autoPIF6), mo1=num(vendor.autoMo1), mo2_6=num(vendor.autoMo2_6);
  const moTotal6=mo1+mo2_6*5, pifDisc=moTotal6-pif6;
  const pmts=[mo1,mo2_6,mo2_6,mo2_6,mo2_6,mo2_6];
  return (
    <div style={{ background:"#050d1a", border:`1px solid ${color}44`, borderRadius:10, padding:"14px 16px", marginTop:8 }}>
      <div style={{ fontSize:10, letterSpacing:2, color:"#475569", textTransform:"uppercase", marginBottom:10, fontWeight:700 }}>
        Monthly Payment Schedule — 6-Month Term
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
        {pmts.map((amt,i) => (
          <div key={i} style={{ background:i===0?"#1a1000":"#0b1628", border:`1px solid ${i===0?"#92400e":"#1e293b"}`,
            borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:i===0?"#f59e0b":"#475569", fontWeight:700, marginBottom:4, letterSpacing:1 }}>
              {i===0?"DOWN PMT":`PMT ${i+1}`}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:i===0?"#fbbf24":"#e2e8f0" }}>{fmt(amt)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:20, marginTop:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:9, color:"#475569", letterSpacing:1, textTransform:"uppercase" }}>Monthly Total (6-mo)</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#f87171" }}>{fmt(moTotal6)}</div>
          <div style={{ fontSize:10, color:"#64748b" }}>{fmt(mo1)} + 5×{fmt(mo2_6)}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:"#475569", letterSpacing:1, textTransform:"uppercase" }}>PIF Total (6-mo)</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#7dd3fc" }}>{fmt(pif6)}</div>
          <div style={{ fontSize:10, color:"#64748b" }}>single payment</div>
        </div>
        {pifDisc>0&&<>
          <div>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:1, textTransform:"uppercase" }}>PIF Savings / term</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#4ade80" }}>▼ {fmt(pifDisc)}</div>
            <div style={{ fontSize:10, color:"#4b7a4b" }}>{pct(pifDisc,moTotal6)}% discount</div>
          </div>
          <div>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:1, textTransform:"uppercase" }}>PIF Savings / year</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#86efac" }}>▼ {fmt(pifDisc*2)}</div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── SavedQuotesTab ────────────────────────────────────────────────────────────
function SavedQuotesTab({ savedQuotes, onLoad, onDelete, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDel, setConfirmDel]     = useState(null);

  if (savedQuotes.length === 0) {
    return (
      <div>
        <p style={S.sec}>Saved Quotes</p>
        <div style={{ ...S.card, textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:15, color:"#475569", marginBottom:8 }}>No saved quotes yet</div>
          <div style={{ fontSize:12, color:"#334155" }}>
            Go to the <strong style={{ color:"#7dd3fc" }}>Comparison</strong> or{" "}
            <strong style={{ color:"#7dd3fc" }}>Manage Vendors</strong> tab and click{" "}
            <strong style={{ color:"#4ade80" }}>💾 Save Quote</strong> to snapshot your current data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <p style={{ ...S.sec, marginBottom:0 }}>Saved Quotes ({savedQuotes.length})</p>
        {confirmClear
          ? <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#f87171" }}>Delete all saved quotes?</span>
              <button style={S.btn("red")} onClick={() => { onClearAll(); setConfirmClear(false); }}>Yes, delete all</button>
              <button style={S.btn("")}    onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          : <button style={S.btn("red")} onClick={() => setConfirmClear(true)}>🗑 Clear All</button>
        }
      </div>

      {savedQuotes.map(q => {
        const curT = num(q.current.autoAnnual) + num(q.current.home);
        const vendorCount = q.vendors.length;
        const lowestVendor = q.vendors.length
          ? q.vendors.reduce((a,b) => {
              const at = (num(b.autoPIF6)*2)+num(b.home);
              const bt = (num(a.autoPIF6)*2)+num(a.home);
              return at < bt ? b : a;
            }, q.vendors[0])
          : null;
        const lowestTotal = lowestVendor ? (num(lowestVendor.autoPIF6)*2)+num(lowestVendor.home) : 0;
        const topSaving   = curT - lowestTotal;

        return (
          <div key={q.id} style={{ background:"#0b1628", border:"1px solid #1e293b", borderRadius:12, padding:"20px 22px", marginBottom:14 }}>
            {/* Header row */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#f8fafc", marginBottom:4 }}>{q.label}</div>
                <div style={{ fontSize:11, color:"#475569" }}>
                  Saved on {new Date(q.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                </div>
                <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>
                  Renewal: <span style={{ color:"#93c5fd" }}>{new Date(q.renewal+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
                  {" · "}{vendorCount} vendor{vendorCount!==1?"s":""}
                </div>
              </div>
              <div style={{ display:"flex", gap:8", flexShrink:0 }}>
                {confirmDel===q.id
                  ? <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:11, color:"#f87171" }}>Remove this quote?</span>
                      <button style={{ ...S.btn("red"), padding:"6px 12px" }} onClick={() => { onDelete(q.id); setConfirmDel(null); }}>Yes</button>
                      <button style={{ ...S.btn(""), padding:"6px 12px" }}    onClick={() => setConfirmDel(null)}>No</button>
                    </div>
                  : <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...S.btn("blue"), padding:"7px 16px" }} onClick={() => onLoad(q)}>⬆ Load</button>
                      <button style={{ ...S.btn("red"),  padding:"7px 12px" }} onClick={() => setConfirmDel(q.id)}>✕</button>
                    </div>
                }
              </div>
            </div>

            {/* Summary strips */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10, marginTop:16 }}>
              <div style={{ background:"#070f1e", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Current Auto / yr</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#94a3b8" }}>{fmt(num(q.current.autoAnnual))}</div>
              </div>
              <div style={{ background:"#070f1e", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Current Home / yr</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#94a3b8" }}>{fmt(num(q.current.home))}</div>
              </div>
              <div style={{ background:"#070f1e", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Current Total / yr</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#f8fafc" }}>{fmt(curT)}</div>
              </div>
              {lowestVendor && (
                <div style={{ background:"#071507", border:"1px solid #166534", borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, color:"#4b7a4b", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Best Vendor (PIF)</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#4ade80" }}>{lowestVendor.name}</div>
                  <div style={{ fontSize:11, color:"#166534" }}>{fmt(lowestTotal)}/yr</div>
                </div>
              )}
              {topSaving > 0 && (
                <div style={{ background:"#071507", border:"1px solid #166534", borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, color:"#4b7a4b", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Top Potential Saving</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#4ade80" }}>▼ {fmt(topSaving)}</div>
                  <div style={{ fontSize:10, color:"#4b7a4b" }}>/year vs current</div>
                </div>
              )}
            </div>

            {/* Vendor chips */}
            <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap" }}>
              {q.vendors.map(v => (
                <span key={v.id} style={{ display:"inline-flex", alignItems:"center", gap:5,
                  background:"#0f1f3d", border:"1px solid #1e3a5f", borderRadius:999, padding:"3px 10px", fontSize:11, color:"#93c5fd" }}>
                  <span style={{ ...S.dot(v.color), width:6, height:6 }} />{v.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SaveQuoteModal ────────────────────────────────────────────────────────────
function SaveQuoteModal({ onSave, onCancel, defaultLabel }) {
  const [label, setLabel] = useState(defaultLabel);
  const [err, setErr]     = useState("");

  function handleSave() {
    if (!label.trim()) { setErr("Please enter a name for this quote"); return; }
    onSave(label.trim());
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#0b1628", border:"1px solid #1e3a5f", borderRadius:16, padding:"28px 32px", width:"100%", maxWidth:420 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#f8fafc", marginBottom:6 }}>💾 Save Quote</div>
        <div style={{ fontSize:11, color:"#475569", marginBottom:20 }}>
          Give this snapshot a name so you can find it later.
        </div>
        <label style={S.lbl}>Quote Name</label>
        <input type="text" value={label} onChange={e => { setLabel(e.target.value); setErr(""); }}
          placeholder="e.g. Renewal 2025 — Q3 comparison"
          autoFocus autoComplete="off"
          style={{ ...S.inpBase, border:`1px solid ${err?"#ef4444":"#334155"}`, marginBottom:err?4:20 }} />
        {err && <div style={{ ...S.errTxt, marginBottom:12 }}>⚠ {err}</div>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button style={S.btn("")}       onClick={onCancel}>Cancel</button>
          <button style={S.btn("green")}  onClick={handleSave}>💾 Save</button>
        </div>
      </div>
    </div>
  );
}

// ── CompareTab ────────────────────────────────────────────────────────────────
function CompareTab({ rows, current, currentErrs, curAutoAnn, curHome, curTotal, maxTotal, best,
                      autoView, setAutoView, expandedId, setExpandedId, renewal, setRenewal,
                      onCurrentAmount, onSaveQuote }) {
  return (
    <div>
      {/* Current Policy */}
      <p style={S.sec}>Your Current Policy</p>
      <div style={S.card}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
          <AmountInput label="Current Auto Premium (Annual)" value={current.autoAnnual}
            onChange={v => onCurrentAmount("autoAnnual",v)} error={currentErrs.autoAnnual} accentColor="#94a3b8" />
          <AmountInput label="Current Home Premium (Annual)" value={current.home}
            onChange={v => onCurrentAmount("home",v)} error={currentErrs.home} accentColor="#94a3b8" />
          <div>
            <label style={S.lbl}>Combined Total (Annual)</label>
            <div style={{ fontSize:26, fontWeight:700, color:"#f8fafc" }}>{fmt(curTotal)}</div>
          </div>
        </div>
        <div style={{ marginTop:16, display:"flex", alignItems:"flex-end", gap:20, flexWrap:"wrap" }}>
          <div style={{ maxWidth:220 }}>
            <label style={S.lbl}>Next Renewal Date</label>
            <input type="date" value={renewal} onChange={e => setRenewal(e.target.value)}
              style={{ ...S.inpBase, border:"1px solid #334155" }} />
          </div>
          <button style={{ ...S.btn("green"), display:"flex", alignItems:"center", gap:8 }} onClick={onSaveQuote}>
            💾 Save Quote
          </button>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, flexWrap:"wrap" }}>
        <p style={{ ...S.sec, marginBottom:0 }}>Compare Vendors — Auto payment mode:</p>
        <div style={{ display:"flex", gap:4, background:"#1e293b", borderRadius:8, padding:3 }}>
          <button style={S.toggle(autoView==="pif")}     onClick={() => setAutoView("pif")}>Pay in Full (6-mo)</button>
          <button style={S.toggle(autoView==="monthly")} onClick={() => setAutoView("monthly")}>Monthly (6-mo × 2)</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, padding:0, overflowX:"auto" }}>
        <table style={S.tbl}>
          <thead>
            <tr>
              {["Vendor","PIF (6-mo)","1st Payment","Pmts 2–6","Monthly 6-mo Total",
                "PIF Disc / term","PIF Disc / yr",
                autoView==="pif"?"Auto Annual (PIF×2)":"Auto Annual (Mo×2)",
                "Home (Annual)","Combined Annual","Auto Savings","Home Savings","Total Savings","Visual"
              ].map((h,i) => (
                <th key={i} style={{ ...S.th,
                  ...(i===7?{borderLeft:"2px solid #1e3a5f"}:{}),
                  ...(i===1?{color:"#7dd3fc"}:{}),
                  ...(i===2?{color:"#fbbf24"}:{}),
                  ...(i===5||i===6?{color:"#4ade80"}:{}),
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td(true)}>
                <div style={{ display:"flex", alignItems:"center" }}>
                  <span style={S.dot("#94a3b8")} /><strong style={{ color:"#94a3b8" }}>Current Policy</strong>
                </div>
              </td>
              <td style={S.td(true)} colSpan={6}><span style={{ color:"#334155", fontSize:11 }}>N/A — Annual billing</span></td>
              <td style={{ ...S.td(true), borderLeft:"2px solid #1e3a5f" }}><span style={{ color:"#94a3b8" }}>{fmt(curAutoAnn)}</span></td>
              <td style={S.td(true)}><span style={{ color:"#94a3b8" }}>{fmt(curHome)}</span></td>
              <td style={S.td(true)}><strong style={{ color:"#f8fafc" }}>{fmt(curTotal)}</strong></td>
              <td style={S.td(true)}>—</td><td style={S.td(true)}>—</td><td style={S.td(true)}>—</td>
              <td style={{ ...S.td(true), minWidth:100 }}><Bar value={curTotal} max={maxTotal} color="#475569" /></td>
            </tr>
            {rows.map(row => {
              const expanded = expandedId === row.id;
              return (
                <>
                  <tr key={row.id}>
                    <td style={S.td(false)}>
                      <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:4 }}>
                        <span style={S.dot(row.color)} /><span>{row.name}</span>
                        {best&&row.id===best.id&&<span style={S.bestBadge}>BEST</span>}
                      </div>
                      <div style={{ marginTop:5 }}>
                        <button style={S.expandBtn(row.color)} onClick={() => setExpandedId(expanded?null:row.id)}>
                          {expanded?"▲ Hide":"▼ Schedule"}
                        </button>
                      </div>
                    </td>
                    <td style={S.td(false)}><div style={{ fontWeight:700 }}>{fmt(row.pif6)}</div><div style={{ fontSize:10, color:"#475569" }}>per 6-mo term</div></td>
                    <td style={S.td(false)}><div style={{ fontWeight:700, color:"#fbbf24" }}>{fmt(row.mo1)}</div><div style={{ fontSize:10, color:"#92400e" }}>down payment</div></td>
                    <td style={S.td(false)}><div style={{ fontWeight:700 }}>{fmt(row.mo2_6)}</div><div style={{ fontSize:10, color:"#475569" }}>× 5 payments</div></td>
                    <td style={S.td(false)}><div style={{ fontWeight:700 }}>{fmt(row.moTotal6)}</div><div style={{ fontSize:10, color:"#475569" }}>{fmt(row.mo1)} + 5×{fmt(row.mo2_6)}</div></td>
                    <td style={S.td(false)}>
                      {row.pifDisc>0?<><span style={{ color:"#4ade80", fontWeight:700 }}>▼ {fmt(row.pifDisc)}</span><div style={{ fontSize:10, color:"#166534" }}>{pct(row.pifDisc,row.moTotal6)}% savings</div></>:<span style={{ color:"#475569" }}>—</span>}
                    </td>
                    <td style={S.td(false)}>
                      {row.pifDiscAnn>0?<><span style={{ color:"#4ade80", fontWeight:700 }}>▼ {fmt(row.pifDiscAnn)}</span><div style={{ fontSize:10, color:"#166534" }}>annually</div></>:<span style={{ color:"#475569" }}>—</span>}
                    </td>
                    <td style={{ ...S.td(false), borderLeft:"2px solid #1e3a5f" }}>
                      <div style={{ fontWeight:700 }}>{fmt(row.autoChosenAnn)}</div>
                      <div style={{ fontSize:10, color:"#475569" }}>{autoView==="pif"?`${fmt(row.pif6)} × 2`:`${fmt(row.moTotal6)} × 2`}</div>
                    </td>
                    <td style={S.td(false)}>{fmt(row.homeAnn)}</td>
                    <td style={S.td(false)}><strong style={{ color:row.total<curTotal?"#4ade80":"#f87171", fontSize:15 }}>{fmt(row.total)}</strong></td>
                    <td style={S.td(false)}><Pill savings={row.savAuto} /></td>
                    <td style={S.td(false)}><Pill savings={row.savHome} /></td>
                    <td style={S.td(false)}>
                      <Pill savings={row.savTotal} />
                      {row.savTotal!=null&&curTotal?<div style={{ fontSize:10, color:"#475569", marginTop:3 }}>{pct(row.savTotal,curTotal)}%</div>:null}
                    </td>
                    <td style={{ ...S.td(false), minWidth:100 }}><Bar value={row.total} max={maxTotal} color={row.color} /></td>
                  </tr>
                  {expanded&&(
                    <tr key={`s-${row.id}`}>
                      <td colSpan={14} style={{ padding:"0 16px 16px", background:"#060e1c", borderBottom:"1px solid #080f1a" }}>
                        <PaySchedule vendor={row} color={row.color} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PIF callout */}
      {rows.length>0&&(
        <div style={S.discBox}>
          <p style={{ ...S.sec, color:"#4ade80", marginBottom:10 }}>💰 Pay-In-Full Discount Summary</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {rows.map(r=>(
              <div key={r.id} style={{ background:"#071507", border:"1px solid #166534", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                  <span style={S.dot(r.color)} /><span style={{ fontSize:12, fontWeight:700 }}>{r.name}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <div style={{ fontSize:9, color:"#4b7a4b", marginBottom:2, textTransform:"uppercase", letterSpacing:1 }}>Save / term</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#4ade80" }}>{r.pifDisc>0?fmt(r.pifDisc):"—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"#4b7a4b", marginBottom:2, textTransform:"uppercase", letterSpacing:1 }}>Save / year</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#86efac" }}>{r.pifDiscAnn>0?fmt(r.pifDiscAnn):"—"}</div>
                  </div>
                </div>
                {r.pifDisc>0&&r.moTotal6>0&&<div style={{ marginTop:8 }}><Tag label={`${pct(r.pifDisc,r.moTotal6)}% off vs monthly`} /></div>}
                <div style={{ marginTop:8, fontSize:10, color:"#334155" }}>
                  Down: <span style={{ color:"#fbbf24" }}>{fmt(r.mo1)}</span>{" · "}Remaining: <span style={{ color:"#94a3b8" }}>{fmt(r.mo2_6)} ×5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      {rows.length>0&&(
        <>
          <p style={{ ...S.sec, marginTop:28 }}>
            Overall Savings vs Current Policy
            <span style={{ color:"#334155", fontWeight:400, fontSize:10, marginLeft:8 }}>(Auto: {autoView==="pif"?"Pay-in-Full":"Monthly"})</span>
          </p>
          <div style={S.sumGrid}>
            {rows.map(r=>(
              <div key={r.id} style={S.sumCard(r.color)}>
                <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
                  <span style={S.dot(r.color)} /><span style={{ fontWeight:700, fontSize:13 }}>{r.name}</span>
                  {best&&r.id===best.id&&<span style={{ ...S.bestBadge, marginLeft:"auto" }}>★ BEST</span>}
                </div>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>Annual savings vs current</div>
                <div style={{ fontSize:22, fontWeight:700, color:r.savTotal>0?"#4ade80":r.savTotal<0?"#f87171":"#94a3b8" }}>
                  {r.savTotal!=null?(r.savTotal>=0?"+":"")+fmt(Math.abs(r.savTotal)):"—"}
                </div>
                {r.savTotal&&curTotal?<div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{pct(r.savTotal,curTotal)}% {r.savTotal>=0?"cheaper":"more expensive"}</div>:null}
                <div style={{ marginTop:8, display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  <div style={{ background:"#0a1524", borderRadius:6, padding:"6px 8px" }}>
                    <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>Down pmt</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fbbf24" }}>{fmt(r.mo1)}</div>
                  </div>
                  <div style={{ background:"#0a1524", borderRadius:6, padding:"6px 8px" }}>
                    <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>Pmts 2–6</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8" }}>{fmt(r.mo2_6)}</div>
                  </div>
                </div>
                {r.pifDiscAnn>0&&autoView==="monthly"&&<div style={{ marginTop:8, fontSize:11, color:"#4ade80" }}>+ save {fmt(r.pifDiscAnn)}/yr switching to PIF</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── EntryTab ──────────────────────────────────────────────────────────────────
function EntryTab({ vendors, vendorErrs, newV, newErrs, newSubmitted,
                    onVName, onVField, onDeleteVendor,
                    onNewName, onNewAmount, onAddVendor, onSaveQuote }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <p style={{ ...S.sec, marginBottom:0 }}>Manage Insurance Vendors</p>
        <button style={{ ...S.btn("green"), display:"flex", alignItems:"center", gap:8 }} onClick={onSaveQuote}>
          💾 Save Quote
        </button>
      </div>
      <div style={{ fontSize:11, color:"#475569", marginBottom:20, lineHeight:1.9 }}>
        For <strong style={{ color:"#7dd3fc" }}>Auto</strong>: enter 6-mo Pay-in-Full, the{" "}
        <strong style={{ color:"#fbbf24" }}>1st (down) payment</strong>, and{" "}
        <strong style={{ color:"#94a3b8" }}>remaining 5 monthly payments</strong>.{" "}
        <strong style={{ color:"#10b981" }}>Home</strong> is an annual premium.
      </div>

      {vendors.map(v => {
        const errs=vendorErrs[v.id]||{};
        const moTotal6=num(v.autoMo1)+num(v.autoMo2_6)*5;
        const pifDisc=moTotal6-num(v.autoPIF6);
        return (
          <div key={v.id} style={S.vendorBox}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, marginRight:12 }}>
                <span style={{ ...S.dot(v.color), width:12, height:12 }} />
                <div style={{ flex:1 }}>
                  <TextInput label="Company Name" value={v.name} onChange={val=>onVName(v.id,val)} error={errs.name} placeholder="Enter company name" />
                </div>
              </div>
              <button style={{ ...S.btn("red"), padding:"7px 14px", flexShrink:0, alignSelf:"flex-end" }} onClick={()=>onDeleteVendor(v.id)}>✕ Remove</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14 }}>
              <AmountInput label="Auto PIF (6-mo)"          value={v.autoPIF6}  onChange={val=>onVField(v.id,"autoPIF6",val)}  error={errs.autoPIF6}  accentColor="#0ea5e9" />
              <AmountInput label="Auto 1st Payment (Down)"  value={v.autoMo1}   onChange={val=>onVField(v.id,"autoMo1",val)}   error={errs.autoMo1}   accentColor="#f59e0b" labelColor="#fbbf24" />
              <AmountInput label="Auto Pmts 2–6 (each)"     value={v.autoMo2_6} onChange={val=>onVField(v.id,"autoMo2_6",val)} error={errs.autoMo2_6} />
              <AmountInput label="Home Premium (Annual)"    value={v.home}      onChange={val=>onVField(v.id,"home",val)}      error={errs.home}      accentColor="#10b981" labelColor="#34d399" />
            </div>
            <div style={S.calcRow}>
              <span style={{ fontSize:11, color:"#475569" }}>6-mo Monthly Total:</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}><strong>{fmt(moTotal6)}</strong> = {fmt(num(v.autoMo1))} + 5×{fmt(num(v.autoMo2_6))}</span>
              {pifDisc>0&&<><span style={{ fontSize:11, color:"#475569" }}>|</span><span style={{ fontSize:11, color:"#4ade80" }}>PIF saves <strong>{fmt(pifDisc)}</strong>/term · <strong>{fmt(pifDisc*2)}</strong>/yr</span></>}
            </div>
          </div>
        );
      })}

      <div style={{ background:"#0b1628", border:"2px dashed #1e3a5f", borderRadius:12, padding:"20px 22px", marginTop:8 }}>
        <p style={{ ...S.sec, color:"#3b82f6", marginBottom:16 }}>+ Add New Vendor</p>
        <div style={{ marginBottom:14, maxWidth:340 }}>
          <TextInput label="Company Name" value={newV.name} onChange={onNewName} error={newErrs.name} placeholder="e.g. Liberty Mutual" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:16 }}>
          <AmountInput label="Auto PIF (6-mo)"         value={newV.autoPIF6}  onChange={v=>onNewAmount("autoPIF6",v)}  error={newErrs.autoPIF6}  accentColor="#0ea5e9" />
          <AmountInput label="Auto 1st Payment (Down)" value={newV.autoMo1}   onChange={v=>onNewAmount("autoMo1",v)}   error={newErrs.autoMo1}   accentColor="#f59e0b" labelColor="#fbbf24" />
          <AmountInput label="Auto Pmts 2–6 (each)"    value={newV.autoMo2_6} onChange={v=>onNewAmount("autoMo2_6",v)} error={newErrs.autoMo2_6} />
          <AmountInput label="Home Premium (Annual)"   value={newV.home}      onChange={v=>onNewAmount("home",v)}      error={newErrs.home}      accentColor="#10b981" labelColor="#34d399" />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <button style={S.btn("blue")} onClick={onAddVendor}>+ ADD VENDOR</button>
          {(newV.autoMo1||newV.autoMo2_6)&&(
            <span style={{ fontSize:11, color:"#475569" }}>
              Preview 6-mo total: <strong style={{ color:"#94a3b8" }}>{fmt(num(newV.autoMo1)+num(newV.autoMo2_6)*5)}</strong>
              {num(newV.autoPIF6)>0&&num(newV.autoMo1)+num(newV.autoMo2_6)*5>num(newV.autoPIF6)&&(
                <span style={{ color:"#4ade80", marginLeft:8 }}>PIF saves {fmt((num(newV.autoMo1)+num(newV.autoMo2_6)*5)-num(newV.autoPIF6))}/term</span>
              )}
            </span>
          )}
        </div>
      </div>
      <p style={{ fontSize:11, color:"#334155", marginTop:14 }}>
        💡 In the Comparison tab, click <strong style={{ color:"#7dd3fc" }}>▼ Schedule</strong> on any vendor to see the full 6-payment breakdown.
      </p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [vendors, setVendors]           = useState(INIT_VENDORS);
  const [current, setCurrent]           = useState(INIT_CURRENT);
  const [currentErrs, setCurrentErrs]   = useState({});
  const [tab, setTab]                   = useState("compare");
  const [autoView, setAutoView]         = useState("pif");
  const [expandedId, setExpandedId]     = useState(null);
  const [vendorErrs, setVendorErrs]     = useState({});
  const [newV, setNewV]                 = useState(BLANK_NEW);
  const [newErrs, setNewErrs]           = useState({});
  const [newSubmitted, setNewSubmitted] = useState(false);
  const [savedQuotes, setSavedQuotes]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toastMsg, setToastMsg]           = useState("");
  const [renewal, setRenewal]             = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth()+1);
    return d.toISOString().slice(0,10);
  });

  // Persist saved quotes to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQuotes)); } catch {}
  }, [savedQuotes]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(""), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const rows = useMemo(() => vendors.map(v => {
    const pif6=num(v.autoPIF6), mo1=num(v.autoMo1), mo2_6=num(v.autoMo2_6);
    const moTotal6=mo1+mo2_6*5, pifDisc=moTotal6-pif6;
    const pifAnn=pif6*2, moAnn=moTotal6*2, pifDiscAnn=moAnn-pifAnn;
    const autoChosenAnn=autoView==="pif"?pifAnn:moAnn;
    const homeAnn=num(v.home), total=autoChosenAnn+homeAnn;
    const curAutoAnn=num(current.autoAnnual), curHome=num(current.home), curTotal=curAutoAnn+curHome;
    return { ...v, pif6, mo1, mo2_6, moTotal6, pifDisc, pifAnn, moAnn, pifDiscAnn,
             autoChosenAnn, homeAnn, total,
             savAuto:  curAutoAnn?curAutoAnn-autoChosenAnn:null,
             savHome:  curHome?curHome-homeAnn:null,
             savTotal: curTotal?curTotal-total:null };
  }), [vendors, current, autoView]);

  const curAutoAnn = num(current.autoAnnual);
  const curHome    = num(current.home);
  const curTotal   = curAutoAnn + curHome;
  const maxTotal   = Math.max(...rows.map(r=>r.total), curTotal, 1);
  const best       = rows.length ? rows.reduce((a,b)=>b.total<a.total?b:a, rows[0]) : null;

  // ── Save / Load / Delete ──────────────────────────────────────────────────
  function handleSaveQuote(label) {
    const quote = {
      id:      Date.now(),
      label,
      savedAt: new Date().toISOString(),
      renewal,
      current: { ...current },
      vendors: vendors.map(v => ({ ...v })),
      autoView,
    };
    setSavedQuotes(prev => [quote, ...prev]);
    setShowSaveModal(false);
    setToastMsg(`✅ Quote "${label}" saved!`);
  }

  function handleLoadQuote(q) {
    setVendors(q.vendors.map(v => ({ ...v })));
    setCurrent({ ...q.current });
    setRenewal(q.renewal);
    setAutoView(q.autoView || "pif");
    setCurrentErrs({});
    setVendorErrs({});
    setTab("compare");
    setToastMsg(`⬆ Loaded: "${q.label}"`);
  }

  function handleDeleteQuote(id) {
    setSavedQuotes(prev => prev.filter(q => q.id !== id));
  }

  function handleClearAll() {
    setSavedQuotes([]);
  }

  // ── Vendor CRUD ───────────────────────────────────────────────────────────
  function handleCurrentAmount(field, val) {
    setCurrent(c => ({...c, [field]:val}));
    setCurrentErrs(prev => {
      const e={...prev};
      if (!val||val==="") e[field]="Required"; else if (num(val)<=0) e[field]="Must be > 0"; else delete e[field];
      return e;
    });
  }
  function handleVField(id, field, val) {
    setVendors(vs => vs.map(v => v.id===id?{...v,[field]:val}:v));
    setVendorErrs(prev => {
      const vE={...(prev[id]||{})};
      if (!val||val==="") vE[field]="Required"; else if (num(val)<=0) vE[field]="Must be > 0"; else delete vE[field];
      return {...prev,[id]:vE};
    });
  }
  function handleVName(id, val) {
    setVendors(vs => vs.map(v => v.id===id?{...v,name:val}:v));
    setVendorErrs(prev => {
      const vE={...(prev[id]||{})};
      if (!val.trim()) vE.name="Required"; else delete vE.name;
      return {...prev,[id]:vE};
    });
  }
  function handleDeleteVendor(id) {
    setVendors(vs => vs.filter(v=>v.id!==id));
    setVendorErrs(prev => { const n={...prev}; delete n[id]; return n; });
  }
  function handleNewName(val) {
    setNewV(n => ({...n,name:val}));
    if (newSubmitted) setNewErrs(prev => { const e={...prev}; if (!val.trim()) e.name="Required"; else delete e.name; return e; });
  }
  function handleNewAmount(field, val) {
    setNewV(n => ({...n,[field]:val}));
    if (newSubmitted) setNewErrs(prev => {
      const e={...prev};
      if (!val||val==="") e[field]="Required"; else if (num(val)<=0) e[field]="Must be > 0"; else delete e[field];
      return e;
    });
  }
  function handleAddVendor() {
    setNewSubmitted(true);
    const errs=validateVendor(newV);
    setNewErrs(errs);
    if (Object.keys(errs).length>0) return;
    const usedColors=vendors.map(v=>v.color);
    const color=COLORS.find(c=>!usedColors.includes(c))||COLORS[vendors.length%COLORS.length];
    setVendors(vs=>[...vs,{id:Date.now(),name:newV.name.trim(),color,
      autoPIF6:newV.autoPIF6,autoMo1:newV.autoMo1,autoMo2_6:newV.autoMo2_6,home:newV.home}]);
    setNewV(BLANK_NEW); setNewErrs({}); setNewSubmitted(false);
  }

  // Default label for save modal
  const defaultLabel = `Renewal ${new Date(renewal+"T12:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})} — ${vendors.length} vendor${vendors.length!==1?"s":""}`;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>✈ Policy Pilot</div>
        <div style={S.sub}>Compare Insurance. Discover Savings.</div>
        <div style={S.badge}>
          📅 Renewal: {new Date(renewal+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[["compare","📊  Comparison"],["entry","⚙️  Manage Vendors"],["saved",`📋  Saved Quotes${savedQuotes.length>0?` (${savedQuotes.length})`:""}`]].map(([k,l]) => (
          <button key={k} style={S.tabBtn(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={S.body}>
        {tab==="compare" && (
          <CompareTab rows={rows} current={current} currentErrs={currentErrs}
            curAutoAnn={curAutoAnn} curHome={curHome} curTotal={curTotal}
            maxTotal={maxTotal} best={best}
            autoView={autoView} setAutoView={setAutoView}
            expandedId={expandedId} setExpandedId={setExpandedId}
            renewal={renewal} setRenewal={setRenewal}
            onCurrentAmount={handleCurrentAmount}
            onSaveQuote={()=>setShowSaveModal(true)} />
        )}
        {tab==="entry" && (
          <EntryTab vendors={vendors} vendorErrs={vendorErrs}
            newV={newV} newErrs={newErrs} newSubmitted={newSubmitted}
            onVName={handleVName} onVField={handleVField} onDeleteVendor={handleDeleteVendor}
            onNewName={handleNewName} onNewAmount={handleNewAmount}
            onAddVendor={handleAddVendor}
            onSaveQuote={()=>setShowSaveModal(true)} />
        )}
        {tab==="saved" && (
          <SavedQuotesTab savedQuotes={savedQuotes}
            onLoad={handleLoadQuote} onDelete={handleDeleteQuote} onClearAll={handleClearAll} />
        )}
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <SaveQuoteModal defaultLabel={defaultLabel}
          onSave={handleSaveQuote} onCancel={()=>setShowSaveModal(false)} />
      )}

      {/* Toast notification */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
          background:"#0f2d1f", border:"1px solid #166534", borderRadius:10,
          padding:"12px 24px", fontSize:13, fontWeight:700, color:"#4ade80",
          boxShadow:"0 8px 32px rgba(0,0,0,.5)", zIndex:2000, whiteSpace:"nowrap" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
