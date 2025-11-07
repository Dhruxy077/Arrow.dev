import React from "react";

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:scale-100 focus:ring-blue-500",
    secondary:
      "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 focus:ring-gray-500",
    outline:
      "border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 focus:ring-gray-500",
    danger:
      "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
