"use client";

import { forwardRef } from "react";

type PasswordInputProps = {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;

  value?: string;
  onChange?: (value: string) => void;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      id = "password",
      name = "password",
      label = "Şifre",
      placeholder = "••••••••",
      autoComplete = "current-password",
      showPassword,
      onToggleShowPassword,
      value,
      onChange,
    },
    ref
  ) {
    const isControlled = typeof value === "string";

    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? "text" : "password"}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-24 text-gray-900 outline-none transition focus:border-gray-500"
            {...(isControlled ? { value } : {})}
            onChange={(e) => {
              if (onChange) {
                onChange(e.target.value);
              }
            }}
          />

          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>
    );
  }
);

export default PasswordInput;