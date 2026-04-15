"use client";

import { useState } from "react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const uploadIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const PHONE_REGEX = /^\+639\d{9}$/;

function normalizePhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly || digitsOnly === "6" || digitsOnly === "63") {
    return "+63";
  }

  let local = digitsOnly;
  if (local.startsWith("63")) {
    local = local.slice(2);
  } else if (local.startsWith("0")) {
    local = local.slice(1);
  }

  local = local.slice(0, 10);
  return `+63${local}`;
}

export function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "+63",
    email: "",
    idType: "driver-license",
    idNumber: "",
    address: "",
  });
  const [phoneError, setPhoneError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const normalizedPhone = normalizePhoneNumber(value);
      if (!normalizedPhone || PHONE_REGEX.test(normalizedPhone)) {
        setPhoneError("");
      } else {
        setPhoneError("Use format +639XXXXXXXXX");
      }

      setFormData((prev) => ({
        ...prev,
        phoneNumber: normalizedPhone,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = formData.phoneNumber.trim();

    if (!trimmedPhone || trimmedPhone === "+63") {
      setPhoneError("Phone number is required.");
      return;
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Use format +639XXXXXXXXX");
      return;
    }

    console.log("Customer data:", formData);
    // TODO: Submit to API
    onClose();
    setFormData({
      fullName: "",
      phoneNumber: "+63",
      email: "",
      idType: "driver-license",
      idNumber: "",
      address: "",
    });
    setPhoneError("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full border-4 border-blue-400">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Add Customer</h2>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  maxLength={13}
                  aria-invalid={phoneError ? "true" : "false"}
                  className={`w-full px-3 py-2 border rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    phoneError ? "border-red-400" : "border-gray-200"
                  }`}
                  required
                />
                {phoneError ? (
                  <p className="mt-1 text-xs font-medium text-red-500">{phoneError}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Format: +639XXXXXXXXX</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* ID Type and ID Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="driver-license">Driver&apos;s License</option>
                    <option value="national-id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="sss">SSS</option>
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    name="idNumber"
                    placeholder="ID Number"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex gap-3 justify-end">
              {/* Upload ID Button */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Handle file upload
                  console.log("Upload ID");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                {uploadIcon}
                Upload Id
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>

              {/* Save Customer Button */}
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
