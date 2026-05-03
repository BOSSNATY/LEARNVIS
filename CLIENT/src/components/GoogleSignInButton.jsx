import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, decodeJwtPayload, setSession } from "../services/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const GoogleSignInButton = ({ setUser, mode = "login" }) => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [fallbackReady, setFallbackReady] = useState(false);

  const finishAuth = (data) => {
    setSession(data);
    setCurrentUser(data.user);
    setUser?.(data.user);
    navigate(
      data.user?.role === "admin" ? "/admin/dashboard" : "/student/dashboard",
    );
  };

  const handleCredential = async (credential) => {
    try {
      const data = await api.googleLogin(credential);
      finishAuth(data);
    } catch (_error) {
      const profile = decodeJwtPayload(credential);
      if (!profile?.email) {
        alert(
          "Google sign-in could not read your profile. Check GIS configuration.",
        );
        return;
      }
      finishAuth({
        token: credential,
        refreshToken: credential,
        user: {
          id: profile.sub,
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          profile_image: profile.picture,
          role: "student",
        },
      });
    }
  };

  useEffect(() => {
    let timeout;
    const render = () => {
      if (
        !window.google?.accounts?.id ||
        !buttonRef.current ||
        !GOOGLE_CLIENT_ID
      ) {
        setFallbackReady(true);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => handleCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current.offsetWidth || 360,
        text: mode === "signup" ? "signup_with" : "signin_with",
      });
    };

    timeout = window.setTimeout(render, 500);
    return () => window.clearTimeout(timeout);
  }, []);

  const promptGoogle = () => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.prompt();
    } else {
      alert("Add VITE_GOOGLE_CLIENT_ID to enable Google Identity Services.");
    }
  };

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full min-h-11 flex justify-center" />
      {fallbackReady && (
        <button
          type="button"
          onClick={promptGoogle}
          className="w-full bg-[#1f2937]/60 py-3 rounded-xl border border-white/5 flex items-center justify-center gap-3 hover:bg-gray-700 transition-all"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="w-4 h-4"
            alt="Google"
          />
          <span className="text-sm font-semibold text-white">
            Continue with Google
          </span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
