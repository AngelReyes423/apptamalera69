import { app } from "./firebase-init.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const auth = getAuth(app);

// Manejo centralizado de errores
const firebaseErrorMessages = {
  "auth/invalid-email": "Email inválido",
  "auth/user-disabled": "Cuenta deshabilitada",
  "auth/user-not-found": "Usuario no encontrado",
  "auth/wrong-password": "Contraseña incorrecta",
  "auth/email-already-in-use": "Email ya registrado",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
  "auth/operation-not-allowed": "Operación no permitida",
  "auth/too-many-requests": "Demasiados intentos. Intente más tarde",
};

function handleFirebaseError(error) {
  return firebaseErrorMessages[error.code] || error.message;
}

export const authService = {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return {
        success: true,
        user: userCredential.user,
        message: `Bienvenido ${userCredential.user.displayName || ""}`,
      };
    } catch (error) {
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  },

  async register(email, password, username) {
    try {
      // Validación adicional
      if (password.length < 6) {
        return {
          success: false,
          error: "La contraseña debe tener al menos 6 caracteres",
        };
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: username });

      return {
        success: true,
        user: userCredential.user,
        message: `¡Bienvenido ${username}!`,
      };
    } catch (error) {
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  },

  async logout() {
    try {
      await signOut(auth);
      return { success: true, message: "Sesión cerrada correctamente" };
    } catch (error) {
      return { success: false, error: handleFirebaseError(error) };
    }
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },
};
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: handleFirebaseError(error) };
  }
}

export async function registerUser(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: handleFirebaseError(error) };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleFirebaseError(error) };
  }
}

export function setupAuthStateListener(callback) {
  return onAuthStateChanged(auth, callback);
}
