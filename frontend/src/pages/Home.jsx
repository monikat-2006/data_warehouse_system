import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Warehouse, 
  Shield, 
  BarChart3, 
  Users,
  LogIn,
  UserPlus,
  HelpCircle,
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Globe,
  Headphones
} from 'lucide-react';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/staff-dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  const features = [
    { icon: <Zap size={24} />, title: 'Real-time Tracking', description: 'Monitor inventory levels in real-time with instant updates' },
    { icon: <Shield size={24} />, title: 'Role-Based Access', description: 'Secure access control for staff and admin users' },
    { icon: <BarChart3 size={24} />, title: 'Advanced Analytics', description: 'Detailed insights and reports for better decision making' },
    { icon: <Clock size={24} />, title: 'Transaction History', description: 'Complete history of all stock movements and activities' },
    { icon: <Globe size={24} />, title: 'Multi-Branch Support', description: 'Manage multiple warehouse branches from one platform' },
    { icon: <TrendingUp size={24} />, title: 'Performance Metrics', description: 'Track KPIs and optimize warehouse operations' }
  ];

  const stats = [
    { number: '99.9%', label: 'Uptime', icon: <CheckCircle size={20} /> },
    { number: '24/7', label: 'Support', icon: <Headphones size={20} /> },
    { number: '1000+', label: 'Products Managed', icon: <Package size={20} /> },
    { number: '50+', label: 'Warehouses', icon: <Warehouse size={20} /> }
  ];

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="home-nav">
        <div className="nav-container">
          <div className="logo-section">
            <Warehouse size={28} className="logo-icon" />
            <span className="logo-text">Dark Warehouse</span>
          </div>
          
          <div className="nav-buttons">
            {!isLoggedIn ? (
              <>
                <button className="nav-btn login-btn" onClick={() => navigate('/login')}>
                  <LogIn size={18} /> Login
                </button>
                <button className="nav-btn register-btn" onClick={() => navigate('/register')}>
                  <UserPlus size={18} /> Register
                </button>
              </>
            ) : (
              <>
                <button className="nav-btn dashboard-btn" onClick={handleGetStarted}>
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              </>
            )}
            <button className="nav-btn help-btn" onClick={() => document.getElementById('help-section').scrollIntoView({ behavior: 'smooth' })}>
              <HelpCircle size={18} /> Help
            </button>
            <button className="nav-btn settings-btn" onClick={() => navigate('/settings')}>
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Truck size={16} />
            <span>Smart Warehouse Management System</span>
          </div>
          <h1 className="hero-title">
            Manage Your Warehouse
            <span className="gradient-text"> Smarter & Faster</span>
          </h1>
          <p className="hero-description">
            Complete role-based warehouse and e-commerce management system with 
            real-time inventory tracking, analytics, and centralized admin oversight.
          </p>
          <div className="hero-buttons">
            <button className="hero-primary-btn" onClick={handleGetStarted}>
              Get Started <ArrowRight size={20} />
            </button>
            <button className="hero-secondary-btn" onClick={() => document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
          
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                {stat.icon}
                <div>
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="hero-image">
          <div className="floating-card card-1">
            <Package size={32} />
            <div>
              <p>Total Products</p>
              <h4>1,284</h4>
            </div>
          </div>
          <div className="floating-card card-2">
            <Users size={32} />
            <div>
              <p>Active Users</p>
              <h4>156</h4>
            </div>
          </div>
          <div className="floating-card card-3">
            <TrendingUp size={32} />
            <div>
              <p>Stock Value</p>
              <h4>$2.5M</h4>
            </div>
          </div>
          <div className="hero-graphic">
            <div className="graphic-circle"></div>
            <div className="graphic-circle-2"></div>
            <Package className="graphic-icon" size={64} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage your warehouse efficiently</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section id="help-section" className="help-section">
        <div className="section-container">
          <div className="help-header">
            <HelpCircle size={40} />
            <h2>How Can We Help You?</h2>
            <p>Get started with Dark Warehouse Management System</p>
          </div>
          
          <div className="help-grid">
            <div className="help-card">
              <h3>📚 Getting Started Guide</h3>
              <p>Learn how to set up your warehouse, add products, and manage inventory</p>
              <button className="help-link">Read Guide →</button>
            </div>
            
            <div className="help-card">
              <h3>👥 User Roles Explained</h3>
              <p>Understand the difference between Staff and Admin privileges</p>
              <button className="help-link">Learn More →</button>
            </div>
            
            <div className="help-card">
              <h3>📊 Analytics & Reports</h3>
              <p>How to generate reports and analyze warehouse performance</p>
              <button className="help-link">View Tutorial →</button>
            </div>
            
            <div className="help-card">
              <h3>💡 FAQ</h3>
              <p>Frequently asked questions about the system</p>
              <button className="help-link">Read FAQ →</button>
            </div>
            
            <div className="help-card">
              <h3>🎥 Video Tutorials</h3>
              <p>Watch step-by-step video guides for all features</p>
              <button className="help-link">Watch Now →</button>
            </div>
            
            <div className="help-card">
              <h3>📞 Contact Support</h3>
              <p>24/7 support available via email and chat</p>
              <button className="help-link">Contact Us →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Settings Section Preview */}
      <section id="settings-section" className="settings-preview">
        <div className="section-container">
          <div className="settings-header">
            <Settings size={40} />
            <h2>System Settings</h2>
            <p>Customize your warehouse management experience</p>
          </div>
          
          <div className="settings-grid">
            <div className="setting-option">
              <div className="setting-icon">🌙</div>
              <div>
                <h4>Theme Preferences</h4>
                <p>Light/Dark mode, color schemes</p>
              </div>
            </div>
            <div className="setting-option">
              <div className="setting-icon">🔔</div>
              <div>
                <h4>Notifications</h4>
                <p>Configure alert settings</p>
              </div>
            </div>
            <div className="setting-option">
              <div className="setting-icon">🌐</div>
              <div>
                <h4>Language</h4>
                <p>Choose your preferred language</p>
              </div>
            </div>
            <div className="setting-option">
              <div className="setting-icon">🔒</div>
              <div>
                <h4>Privacy & Security</h4>
                <p>Manage your security preferences</p>
              </div>
            </div>
          </div>
          
          <div className="settings-note">
            <p>⚙️ Full settings panel coming soon. Click the settings button in the navigation bar to access detailed settings.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Optimize Your Warehouse?</h2>
          <p>Join thousands of businesses using Dark Warehouse Management System</p>
          {!isLoggedIn ? (
            <div className="cta-buttons">
              <button className="cta-primary" onClick={() => navigate('/register')}>
                Create Free Account
              </button>
              <button className="cta-secondary" onClick={() => navigate('/login')}>
                Login to Existing Account
              </button>
            </div>
          ) : (
            <button className="cta-primary" onClick={handleGetStarted}>
              Go to Dashboard
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-logo">
              <Warehouse size={24} />
              <span>Dark Warehouse</span>
            </div>
            <p>Smart warehouse management solution for modern businesses.</p>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features-section">Features</a>
            <a href="#help-section">Help</a>
            <a href="#settings-section">Settings</a>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Dark Warehouse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;