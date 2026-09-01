import { Link } from 'react-router-dom';
import {
  Package, BarChart3, Shield, Zap, TrendingUp, Users,
  Database, Download, Bell, Search, ChevronRight, Star
} from 'lucide-react';

const features = [
  { icon: <Package size={24} />, color: 'rgba(108,99,255,0.15)', iconColor: 'var(--accent-primary)', title: 'Smart Inventory', desc: 'Real-time product tracking with low-stock alerts, reorder level management, and SKU-based search.' },
  { icon: <BarChart3 size={24} />, color: 'rgba(79,172,254,0.15)', iconColor: 'var(--accent-blue)', title: 'Analytics Dashboard', desc: 'Visual insights with interactive charts — stock trends, category breakdown, and transaction volume.' },
  { icon: <Shield size={24} />, color: 'rgba(67,233,123,0.15)', iconColor: 'var(--accent-green)', title: 'Role-Based Access', desc: 'Separate admin and staff portals with fine-grained permissions and complete audit trails.' },
  { icon: <Download size={24} />, color: 'rgba(250,130,49,0.15)', iconColor: 'var(--accent-orange)', title: 'CSV Export & Print', desc: 'Generate detailed reports for inventory, transactions, and users. Export to CSV or print instantly.' },
  { icon: <Bell size={24} />, color: 'rgba(255,71,87,0.15)', iconColor: 'var(--accent-red)', title: 'Smart Alerts', desc: 'Automatic notifications for low stock, unusual activity, and reorder suggestions.' },
  { icon: <Database size={24} />, color: 'rgba(162,155,254,0.15)', iconColor: 'var(--accent-purple)', title: 'PostgreSQL Backend', desc: 'Enterprise-grade database with Flask REST APIs, session authentication, and full transaction history.' },
];

const stats = [
  { value: '6+', label: 'Core Modules' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Real-time', label: 'Data Sync' },
  { value: '2-Role', label: 'Access Control' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <div className="home-nav-logo-icon">
            <Package size={20} color="#fff" />
          </div>
          <span className="home-nav-logo-text">WarehouseIQ</span>
        </div>
        <div className="home-nav-links">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-tag">
          <Star size={14} />
          Smart E-Commerce Data Warehouse
        </div>
        <h1>
          Intelligent Inventory<br />
          <span className="gradient-text">Management System</span>
        </h1>
        <p>
          A full-stack warehouse management platform built with React, Flask & PostgreSQL.
          Track products, manage stock, analyze trends — all in one place.
        </p>
        <div className="home-hero-buttons">
          <Link to="/login" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
            <Zap size={18} /> Get Started
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
            Create Account <ChevronRight size={18} />
          </Link>
        </div>

        {/* Hero Dashboard Preview */}
        <div style={{
          marginTop: 60, maxWidth: 900, margin: '60px auto 0',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '24px',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Products', value: '1,248', color: 'var(--accent-primary)', icon: '📦' },
              { label: 'Inventory Value', value: '$84,320', color: 'var(--accent-green)', icon: '💰' },
              { label: 'Low Stock Items', value: '12', color: 'var(--accent-red)', icon: '⚠️' },
              { label: 'Transactions', value: '3,891', color: 'var(--accent-blue)', icon: '🔄' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
            padding: '16px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Search products, transactions, reports...</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <h2>Everything You Need to<br /><span style={{ color: 'var(--accent-primary)' }}>Run Your Warehouse</span></h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" style={{ background: f.color, color: f.iconColor }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats-section">
        <h2 style={{ marginBottom: 40 }}>Built for <span style={{ color: 'var(--accent-primary)' }}>Scale</span></h2>
        <div className="home-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="home-stat">
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
            <Zap size={16} /> Start Now — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--grad-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>WarehouseIQ</span>
        </div>
        <p>Smart E-Commerce Data Warehouse & Inventory Management System</p>
        <p style={{ marginTop: 4 }}>Built with React · Flask · PostgreSQL</p>
      </footer>
    </div>
  );
}
