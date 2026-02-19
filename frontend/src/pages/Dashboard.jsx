import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  FiActivity,
  FiClock,
  FiTrendingUp,
  FiShield,
  FiArrowRight,
  FiFileText,
  FiHeart,
} from "react-icons/fi";
import "./Dashboard.css";

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [stats, setStats] = useState({ total: 0, safe: 0, risky: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  async function loadDashboardData() {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(5),
      );
      const snapshot = await getDocs(q);
      const analyses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentAnalyses(analyses);

      // Calculate stats
      const allQ = query(
        collection(db, "analyses"),
        where("userId", "==", currentUser.uid),
      );
      const allSnapshot = await getDocs(allQ);
      const allAnalyses = allSnapshot.docs.map((doc) => doc.data());
      const safe = allAnalyses.filter((a) => a.riskLabel === "Safe").length;
      const risky = allAnalyses.filter((a) =>
        ["Toxic", "Ineffective"].includes(a.riskLabel),
      ).length;
      setStats({ total: allAnalyses.length, safe, risky });
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getRiskColor = (label) => {
    const colors = {
      Safe: "var(--risk-safe)",
      "Adjust Dosage": "var(--risk-warn)",
      Toxic: "var(--risk-danger)",
      Ineffective: "var(--risk-warn)",
      Unknown: "var(--text-muted)",
    };
    return colors[label] || "#888";
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>
              {greeting()},{" "}
              <span className="accent-text">
                {currentUser?.displayName || "User"}
              </span>
            </h1>
            <p>Your personalized pharmacogenomic dashboard</p>
          </div>
          <Link to="/analyze" className="btn-primary">
            <FiActivity /> New Analysis
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiFileText />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-name">Total Analyses</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiShield />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.safe}</span>
              <span className="stat-name">Safe Results</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.risky}</span>
              <span className="stat-name">Risk Alerts</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiHeart />
            </div>
            <div className="stat-info">
              <span className="stat-number">6</span>
              <span className="stat-name">Genes Covered</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-header">
          <h2>
            <FiActivity /> Quick Actions
          </h2>
        </div>
        <div className="actions-grid">
          <Link to="/analyze" className="action-card">
            <FiActivity className="action-icon" />
            <h3>New Analysis</h3>
            <p>Upload a VCF file and analyze drug risks</p>
            <FiArrowRight className="action-arrow" />
          </Link>
          <Link to="/history" className="action-card">
            <FiClock className="action-icon" />
            <h3>View History</h3>
            <p>Browse your past analyses and results</p>
            <FiArrowRight className="action-arrow" />
          </Link>
        </div>

        {/* Recent Analyses */}
        <div className="section-header">
          <h2>
            <FiClock /> Recent Analyses
          </h2>
          {recentAnalyses.length > 0 && (
            <Link to="/history" className="view-all">
              View All <FiArrowRight />
            </Link>
          )}
        </div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading your data...</p>
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <h3>No analyses yet</h3>
            <p>
              Upload a VCF file to get started with your first pharmacogenomic
              analysis.
            </p>
            <Link to="/analyze" className="btn-primary">
              <FiActivity /> Start First Analysis
            </Link>
          </div>
        ) : (
          <div className="recent-list">
            {recentAnalyses.map((analysis) => (
              <div className="recent-card" key={analysis.id}>
                <div
                  className="recent-risk"
                  style={{
                    background: getRiskColor(analysis.riskLabel) + "18",
                    color: getRiskColor(analysis.riskLabel),
                    borderColor: getRiskColor(analysis.riskLabel) + "40",
                  }}
                >
                  {analysis.riskLabel}
                </div>
                <div className="recent-info">
                  <strong>{analysis.drug}</strong>
                  <span className="recent-gene">
                    {analysis.primaryGene} — {analysis.diplotype}
                  </span>
                </div>
                <span className="recent-date">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
