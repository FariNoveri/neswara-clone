import { getAuth, sendEmailVerification } from "firebase/auth";
export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    console.log("Verification email sent to:", user.email);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Gagal mengirim email verifikasi. Silakan coba lagi.");
  }
};
