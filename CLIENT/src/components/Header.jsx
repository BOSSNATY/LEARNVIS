import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, Search, Shield } from "lucide-react";

const Brand = ({ admin = false, compact = false }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="app-brand"
      aria-label="Go to LEARNVIS home"
    >
      <span
        className={`app-brand__mark ${admin ? "app-brand__mark--admin" : ""}`}
      >
        {admin ? (
          <Shield size={20} className="text-white" />
        ) : (
          <span className="app-brand__orbit" />
        )}
      </span>
      {!compact && (
        <span className="app-brand__text-wrap">
          <span className="app-brand__text">LEARNVIS</span>
          {admin && <span className="app-brand__subtext">Admin Panel</span>}
        </span>
      )}
    </button>
  );
};

const Header = ({
  variant = "public",
  admin = false,
  onMenuClick,
  searchPlaceholder = "Search...",
  showSearch = true,
  avatarLabel = "S",
}) => {
  const navigate = useNavigate();

  if (variant === "auth") {
    return (
      <header className="auth-header">
        <Brand />
      </header>
    );
  }

  if (variant === "app") {
    return (
      <header className="app-header">
        <div className="app-header__left">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="app-header__menu"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          {showSearch && (
            <div className="app-header__search">
              <Search size={18} />
              <input type="text" placeholder={searchPlaceholder} />
            </div>
          )}
        </div>

        <div className="app-header__actions">
          <button
            type="button"
            className="app-header__bell"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span />
          </button>
          <div
            className={`app-header__avatar ${admin ? "app-header__avatar--admin" : ""}`}
          >
            {avatarLabel}
          </div>
        </div>
      </header>
    );
  }

  return (
    <nav className="landing-nav relative z-10 px-6 py-4">
      <div className="landing-container landing-nav-row max-w-7xl mx-auto flex items-center justify-between">
        <Brand />
        <div className="landing-nav-actions flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="header-link-button"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="header-primary-button"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
