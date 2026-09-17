import React from "react";

export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={`saas-card p-6 ${hover ? "saas-card-hover" : ""} ${
        glow ? "border-glow" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
