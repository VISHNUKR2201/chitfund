import React, { useState, useEffect, useMemo } from "react";
import Login from "./Login";
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
  return {};
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
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
}

function Dashboard({ onLogout }) {
  const [members, setMembers] = useState(() => {
    const saved = loadFromStorage();
    return saved?.members ?? makeInitialMembers();
  });

  const [records, setRecords] = useState(() => {
    const saved = loadFromStorage();
    return saved?.records ?? makeEmptyRecords();
  });

  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

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
    return Object.values(editingAmounts).reduce(
      (s, v) => s + Number(v || 0),
      0
    );
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
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );
  }

  function exportData() {
    const payload = { members, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
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
    <div className="container">
      <header className="header">
        <h1>YUVAMITHRA ONAM CHIT FUND</h1>
        <div className="headerRight">
          <button className="smallBtn" onClick={exportData}>
            Export
          </button>
          <label className="importLabel">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={importData}
              style={{ display: "none" }}
            />
          </label>
          <button className="dangerBtn" onClick={resetAll}>
            Reset All
          </button>
          <button
            className="dangerBtn"
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="controls">
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

      <main className="main">
        <div className="left">
          <h2>Members</h2>
          <div className="tableHeader">
            <div>#</div>
            <div>Name</div>
            <div>Amount</div>
          </div>
          <div className="scrollArea">
            {members.map((m) => (
              <div key={m.id} className="row">
                <div style={{ width: 30 }}>{m.id}</div>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    value={m.name}
                    onChange={(e) => updateMemberName(m.id, e.target.value)}
                  />
                </div>
                <div style={{ width: 120 }}>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={editingAmounts[m.id] ?? ""}
                    onChange={(e) => handleAmountChange(m.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="buttonsRow">
            <button className="primaryBtn" onClick={submitDay}>
              Submit
            </button>
            <button className="secondaryBtn" onClick={resetDay}>
              Reset
            </button>
            <button
              className="secondaryBtn"
              onClick={() => {
                const val = prompt(
                  "Enter amount to quick-fill all members (leave empty to cancel)"
                );
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

        <div className="right">
          <h2>Saved Records</h2>
          <RecordsViewer
            records={records}
            members={members}
            setCurrentDate={setCurrentDate}
          />
        </div>
      </main>

      <footer className="footer">
        <small>
          Data saved in your browser (localStorage). Use Export to backup.
        </small>
      </footer>
    </div>
  );
}

function RecordsViewer({ records, members, setCurrentDate }) {
  const dates = Object.keys(records).sort();

  return (
    <div className="recordsBox">
      <h3>All Dates</h3>
      {dates.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <table className="recordsTable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => {
              const total = Object.values(records[d]).reduce(
                (s, v) => s + Number(v || 0),
                0
              );
              return (
                <tr key={d}>
                  <td>{d}</td>
                  <td>{total}</td>
                  <td>
                    <button
                      className="smallBtn"
                      onClick={() => setCurrentDate(d)}
                    >
                      View
                    </button>
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
