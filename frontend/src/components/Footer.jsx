import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span>
            Pharma<span className="footer-highlight">Guard</span>
          </span>
        </div>
        <p className="footer-tagline">Pharmacogenomic Risk Prediction System</p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/analyze">Analyze</Link>
          <a
            href="https://cpicpgx.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            CPIC Guidelines
          </a>
          <a
            href="https://www.pharmgkb.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            PharmGKB
          </a>
        </div>
        <p className="footer-copy">
          © 2026 PharmaGuard — RIFT 2026 Hackathon. Precision Medicine for
          Everyone.
        </p>
      </div>
    </footer>
  );
}
