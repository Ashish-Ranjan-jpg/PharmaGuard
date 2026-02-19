import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  FiClock,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import ResultsDisplay from "../components/ResultsDisplay";
import "./History.css";

const RISK_COLORS = {
  Safe: "var(--risk-safe)",
  "Adjust Dosage": "var(--risk-warn)",
  Toxic: "var(--risk-danger)",
  Ineffective: "var(--risk-warn)",
  Unknown: "var(--text-muted)",
};

export default function History() {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  async function loadHistory() {
    if (!currentUser) return;
    try {
      // Removed orderBy to avoid common Firestore index requirement for simple implementation
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", currentUser.uid),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort in-memory instead
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnalyses(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = analyses.filter((a) => {
    if (filter !== "all" && a.riskLabel !== filter) return false;
    if (
      search &&
      !a.drug?.toLowerCase().includes(search.toLowerCase()) &&
      !a.primaryGene?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function copyJSON(fullResult) {
    try {
      const parsed = JSON.parse(fullResult);
      navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
      toast.success("JSON copied!");
    } catch {
      navigator.clipboard.writeText(fullResult);
      toast.success("Copied!");
    }
  }

  function downloadJSON(analysis) {
    try {
      const blob = new Blob([analysis.fullResult], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pharmaguard_${analysis.drug}_${analysis.createdAt}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  return (
    <div className="history-page">
      <Toaster position="top-center" />
      <div className="history-container">
        <div className="history-header">
          <h1>
            <FiClock /> Analysis <span className="accent-text">History</span>
          </h1>
          <p>{analyses.length} total analyses</p>
        </div>

        {/* Filters */}
        <div className="history-filters">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by drug or gene..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <FiFilter />
            {["all", "Safe", "Adjust Dosage", "Toxic", "Ineffective"].map(
              (f) => (
                <button
                  key={f}
                  className={`filter-chip ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                  style={f !== "all" ? { "--chip-color": RISK_COLORS[f] } : {}}
                >
                  {f === "all" ? "All" : f}
                </button>
              ),
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <h3>
              {analyses.length === 0
                ? "No analyses yet"
                : "No matching results"}
            </h3>
            <p>
              {analyses.length === 0
                ? "Run your first analysis to see it here."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="history-list">
            {filtered.map((a) => (
              <div className="history-card" key={a.id}>
                <div
                  className="history-card-main"
                  onClick={() =>
                    setExpandedId(expandedId === a.id ? null : a.id)
                  }
                >
                  <div
                    className="history-risk"
                    style={{
                      background: (RISK_COLORS[a.riskLabel] || "#888") + "18",
                      color: RISK_COLORS[a.riskLabel] || "#888",
                      borderColor: (RISK_COLORS[a.riskLabel] || "#888") + "40",
                    }}
                  >
                    {a.riskLabel}
                  </div>
                  <div className="history-info">
                    <strong>{a.drug}</strong>
                    <span>
                      {a.primaryGene} — {a.diplotype} — {a.phenotype}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="history-confidence">
                      {((a.confidence || 0) * 100).toFixed(0)}%
                    </span>
                    <span className="history-date">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {expandedId === a.id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {expandedId === a.id && a.fullResult && (
                  <div className="history-expanded">
                    {/* Render ResultsDisplay with parsed JSON */}
                    <div style={{ marginTop: "1rem" }}>
                      <ResultsDisplay data={JSON.parse(a.fullResult)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
