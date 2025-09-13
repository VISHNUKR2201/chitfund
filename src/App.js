/*
Chit Fund Application with Calendar Dates

How to use:
1. Create a React app:
   npx create-react-app chitfund
2. Replace src/App.js with this file.
3. Keep src/App.css (or customize).
4. Run:
   npm install
   npm start
*/

import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

const MEMBER_COUNT = 30;
const STORAGE_KEY = "chitfund_data_v2";

function makeInitialMembers() {
  const members = [];
  for (let i = 1; i <= MEMBER_COUNT; i++) {
    members.push({ id: i, name: `Member ${i}` });
  }
  return members;
}

function makeEmptyRecords() {
  return {}; // map date -> { memberId: amount }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse storage:", e);
    return null;
  }
}

function saveToStorage(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export default function App() {
  const [members, setMembers] = useState(() => {
    const saved = loadFromStorage();
    return saved?.members ?? makeInitialMembers();
  });

  const [records, setRecords] = useState(() => {
    const saved = loadFromStorage();
    return saved?.records ?? makeEmptyRecords();
  });

  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  });

  const [editingAmounts, setEditingAmounts] = useState(() => {
    const saved = loadFromStorage();
    const today = new Date().toISOString().slice(0, 10);
    return saved?.records?.[today] ? { ...saved.records[today] } : {};
  });

  // persist changes
  useEffect(() => {
    saveToStorage({ members, records });
  }, [members, records]);

  // when date changes, load that day's amounts
  useEffect(() => {
    setEditingAmounts({ ...(records[currentDate] || {}) });
  }, [currentDate, records]);

  const totalCollectedForDay = useMemo(() => {
    return Object.values(editingAmounts).reduce((s, v) => s + Number(v || 0), 0);
  }, [editingAmounts]);

  const grandTotal = useMemo(() => {
    let s = 0;
    for (const rec of Object.values(records)) {
      s += Object.values(rec).reduce((a, b) => a + Number(b || 0), 0);
    }
    return s;
  }, [records]);

  function handleAmountChange(memberId, value) {
    const v = value === "" ? "" : Number(value);
    setEditingAmounts((prev) => ({ ...prev, [memberId]: v }));
  }

  function submitDay() {
    setRecords((prev) => ({ ...prev, [currentDate]: { ...editingAmounts } }));
    alert(`Saved for ${currentDate}. Collected: ${totalCollectedForDay}`);
  }

  function resetDay() {
    if (!window.confirm(`Clear data for ${currentDate}?`)) return;
    setEditingAmounts({});
    setRecords((prev) => {
      const copy = { ...prev };
      delete copy[currentDate];
      return copy;
    });
  }

  function resetAll() {
    if (!window.confirm("This will erase ALL data. Continue?")) return;
    const m = makeInitialMembers();
    const r = makeEmptyRecords();
    setMembers(m);
    setRecords(r);
    setEditingAmounts({});
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateMemberName(id, newName) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name: newName } : m)));
  }

  function exportData() {
    const payload = { members, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chitfund-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (!obj.members || !obj.records) throw new Error("Invalid file");
        setMembers(obj.members);
        setRecords(obj.records);
        alert("Data imported successfully.");
      } catch (err) {
        alert("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>YUVAMITHRA ONAM CHIT FUND</h1>
        <div style={styles.headerRight}>
          <button style={styles.smallBtn} onClick={exportData}>Export</button>
          <label style={styles.importLabel}>
            Import
            <input type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
          </label>
          <button style={styles.dangerBtn} onClick={resetAll}>Reset All</button>
        </div>
      </header>

      <section style={styles.controls}>
        <div>
          <label>Select Date: </label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
          />
        </div>

        <div>
          <strong>Date Total:</strong> {totalCollectedForDay} &nbsp; | &nbsp; 
          <strong>Grand Total:</strong> {grandTotal}
        </div>
      </section>

      <main style={styles.main}>
        <div style={styles.left}>
          <h2>Members</h2>
          <div style={styles.tableHeader}>
            <div>#</div>
            <div>Name</div>
            <div>Amount</div>
          </div>
          <div style={styles.scrollArea}>
            {members.map((m) => (
              <div key={m.id} style={styles.row}>
                <div style={{ width: 30 }}>{m.id}</div>
                <div style={{ flex: 1 }}>
                  <input
                    style={styles.input}
                    value={m.name}
                    onChange={(e) => updateMemberName(m.id, e.target.value)}
                  />
                </div>
                <div style={{ width: 120 }}>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={editingAmounts[m.id] ?? ""}
                    onChange={(e) => handleAmountChange(m.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={styles.buttonsRow}>
            <button style={styles.primaryBtn} onClick={submitDay}>Submit</button>
            <button style={styles.secondaryBtn} onClick={resetDay}>Reset</button>
            <button
              style={styles.secondaryBtn}
              onClick={() => {
                const val = prompt("Enter amount to quick-fill all members (leave empty to cancel)");
                if (!val) return;
                const num = Number(val);
                if (isNaN(num)) return alert("Invalid number");
                const newAmounts = {};
                members.forEach((m) => (newAmounts[m.id] = num));
                setEditingAmounts(newAmounts);
              }}
            >
              Quick Fill
            </button>
          </div>
        </div>

        <div style={styles.right}>
          <h2>Saved Records</h2>
          <RecordsViewer records={records} members={members} setCurrentDate={setCurrentDate} />
        </div>
      </main>

      <footer style={styles.footer}>
        <small>Data saved in your browser (localStorage). Use Export to backup.</small>
      </footer>
    </div>
  );
}

function RecordsViewer({ records, members, setCurrentDate }) {
  const dates = Object.keys(records).sort();

  return (
    <div style={{ border: "1px solid #ddd", padding: 10, borderRadius: 6, maxHeight: 500, overflow: "auto" }}>
      <h3>All Dates</h3>
      {dates.length === 0 ? <p>No data yet.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={cellStyle}>Date</th>
              <th style={cellStyle}>Total</th>
              <th style={cellStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => {
              const total = Object.values(records[d]).reduce((s, v) => s + Number(v || 0), 0);
              return (
                <tr key={d}>
                  <td style={cellStyle}>{d}</td>
                  <td style={cellStyle}>{total}</td>
                  <td style={cellStyle}>
                    <button style={styles.smallBtn} onClick={() => setCurrentDate(d)}>View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// inline styles
const styles = {
  container: { fontFamily: "Segoe UI, Roboto, Arial", padding: 16, maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  controls: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 },
  main: { display: "flex", gap: 16 },
  left: { flex: 1, border: "1px solid #eee", padding: 12, borderRadius: 8, minHeight: 500 },
  right: { width: 420 },
  tableHeader: { display: "flex", gap: 10, fontWeight: "bold", marginBottom: 6, alignItems: "center" },
  row: { display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #fafafa" },
  input: { width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ccc" },
  scrollArea: { maxHeight: 420, overflow: "auto" },
  buttonsRow: { marginTop: 10, display: "flex", gap: 8 },
  primaryBtn: { padding: "8px 12px", borderRadius: 6, border: "none", background: "#2b7cff", color: "white", cursor: "pointer" },
  secondaryBtn: { padding: "8px 12px", borderRadius: 6, border: "1px solid #888", background: "white", cursor: "pointer" },
  dangerBtn: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#d9534f", color: "white", cursor: "pointer" },
  smallBtn: { padding: "4px 6px", borderRadius: 6, border: "1px solid #888", background: "white", cursor: "pointer" },
  importLabel: { padding: "6px 8px", border: "1px solid #888", borderRadius: 6, cursor: "pointer" },
  footer: { marginTop: 12, textAlign: "center", color: "#666" },
};

const cellStyle = { border: "1px solid #f1f1f1", padding: 6, textAlign: "left" };
