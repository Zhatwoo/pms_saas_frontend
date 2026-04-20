export const PHONE_REGEX = /^\+639\d{9}$/;

export function normalizePhoneNumber(value: string) {
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
