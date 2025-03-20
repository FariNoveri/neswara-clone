import { auth } from "../firebaseconfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

const registerUser = async (email, password) => {
  try {
    // Validasi input
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    if (!email.includes("@")) {
      throw new Error("Invalid email format.");
    }

    // Registrasi pengguna
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User Registered:", userCredential.user);
  } catch (error) {
    console.error("Error:", error.message);
    alert(error.message); // Tampilkan pesan error ke pengguna
  }
};

export default registerUser;