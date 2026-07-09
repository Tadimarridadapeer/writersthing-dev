import bcrypt from "bcryptjs";

export const otpService = {
  /**
   * Generates a random 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Hashes the OTP using bcrypt
   */
  async hashOTP(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  },

  /**
   * Compares a raw OTP with a hashed OTP
   */
  async verifyOTP(rawOtp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(rawOtp, hashedOtp);
  }
};
