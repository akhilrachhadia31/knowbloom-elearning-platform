const otpStore = new Map(); // In-memory store

export const saveOtp = (email, otp, data) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
  otpStore.set(email, { otp, data, expiresAt });
};

export const getOtpData = (email) => {
  const record = otpStore.get(email);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return null;
  }
  return record;
};

export const deleteOtp = (email) => {
  otpStore.delete(email);
};
