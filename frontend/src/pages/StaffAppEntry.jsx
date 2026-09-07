import React from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

const roles = [
  {
    id: "admin",
    title: "Admin",
    subtitle: "Full control panel",
    path: "/admin",
    gradient: "linear-gradient(135deg, #EAB308 0%, #d97706 100%)",
    shadow: "rgba(234,179,8,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    textColor: "text-black",
  },
  {
    id: "captain",
    title: "Captain",
    subtitle: "Table & dine-in orders",
    path: "/captain",
    gradient: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
    shadow: "rgba(13,148,136,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    textColor: "text-white",
  },
  {
    id: "delivery",
    title: "Delivery",
    subtitle: "Delivery partner panel",
    path: "/delivery",
    gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    shadow: "rgba(37,99,235,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    textColor: "text-white",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    subtitle: "Kitchen staff panel",
    path: "/kitchen",
    gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    shadow: "rgba(220,38,38,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    textColor: "text-white",
  },
];

const StaffAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: "linear-gradient(160deg, #0a1f28 0%, #0f2933 50%, #1a4855 100%)",
      }}
    >
      {/* Logo */}
      <div className="mb-2">
        <img
          src={logoImg}
          alt="Persian Darbar"
          className="h-48 w-auto object-contain mx-auto"
          style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 24px rgba(234,179,8,0.3))" }}
        />
      </div>

      {/* Tagline */}
      <p
        className="text-[#EAB308]/60 text-xs uppercase tracking-[0.3em] mb-10 text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Staff Portal
      </p>

      {/* Role grid */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => navigate(role.path)}
            className="flex flex-col items-center justify-center gap-3 rounded-3xl p-5 active:scale-95 transition-transform duration-150 select-none"
            style={{
              background: role.gradient,
              boxShadow: `0 8px 32px ${role.shadow}`,
              minHeight: "140px",
            }}
          >
            <div className={role.textColor}>{role.icon}</div>
            <div className="text-center">
              <p className={`font-bold text-base leading-tight ${role.textColor}`}>
                {role.title}
              </p>
              <p
                className={`text-xs mt-0.5 leading-snug ${
                  role.textColor === "text-black" ? "text-black/60" : "text-white/60"
                }`}
              >
                {role.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-gray-600 text-[10px] mt-10 text-center uppercase tracking-widest">
        Persian Darbar — Staff Access Only
      </p>
    </div>
  );
};

export default StaffAppEntry;
