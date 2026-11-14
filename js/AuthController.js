import { authService } from "./auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-init.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class AuthController {
  constructor(debug = false) {
    this.debugMode = debug;
    this.loginModal = new bootstrap.Modal("#loginModal");
    this.mapInitialized = false;
    this.map = null;
    this.markers = [];
    this.dialog = document.querySelector(".popup");

    this.log("Inicializando AuthController");
    this.initElements();
    this.setupEventListeners();
    this.initAuthState();

    if (this.debugMode) {
      this.debugAuthSetup();
    }
  }
  unlockPage() {
    try {
      document.body.style.overflow = "auto";
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
      document.querySelectorAll("button, input, select").forEach((el) => {
        el.disabled = false;
      });
      console.log("Página desbloqueada");
    } catch (error) {
      console.error("Error al desbloquear página:", error);
    }
  }

  initElements() {
    this.elements = {
      loginForm: document.getElementById("loginForm"),
      registerForm: document.getElementById("registerForm"),
      loginBtn: document.getElementById("loginBtn"),
      logoutBtn: document.getElementById("logoutBtn"),
      userGreeting: document.getElementById("userGreeting"),
      mapContainer: document.getElementById("map-container"),
      loginError: document.getElementById("login-error"),
      registerError: document.getElementById("register-error"),
      loginEmail: document.getElementById("loginEmail"),
      loginPassword: document.getElementById("loginPassword"),
      registerEmail: document.getElementById("registerEmail"),
      registerPassword: document.getElementById("registerPassword"),
      registerUsername: document.getElementById("registerUsername"),
      popupLatitude: document.querySelector("#popup_latitude"),
      popupLongitude: document.querySelector("#popup_longitude"),
      popupButton: document.querySelector("#popupButton"),
      inputPlace: document.querySelector("#inputPlace"),
      smallWarning: document.getElementById("warning"),
      cancelButton: document.getElementById("cancelButton"),
      locationSelect: document.getElementById("locationSelect"),
      iconSelect: document.getElementById("iconSelect"),
      latitude: document.getElementById("latitude"),
      longitude: document.getElementById("longitude"),
      buttonSet: document.getElementById("buttonSet"),
    };

    this.log("Elementos inicializados:", this.elements);
  }

  setupEventListeners() {
    this.addListener(this.elements.loginBtn, "click", (e) => {
      e.preventDefault();
      this.resetForms();
      this.loginModal.show();
      this.log("Modal de login mostrado");
    });

    this.addListener(this.elements.loginForm, "submit", async (e) => {
      e.preventDefault();
      this.log("Intento de login iniciado");
      await this.handleLogin();
    });

    this.addListener(this.elements.registerForm, "submit", async (e) => {
      e.preventDefault();
      this.log("Intento de registro iniciado");
      await this.handleRegister();
    });

    this.addListener(this.elements.logoutBtn, "click", async (e) => {
      e.preventDefault();
      this.log("Intento de logout iniciado");
      await this.handleLogout();
    });

    this.addListener(this.elements.cancelButton, "click", () => {
      this.dialog.close();
    });

    this.addListener(
      this.elements.buttonSet,
      "click",
      this.setCoordinates.bind(this)
    );
    this.addListener(
      this.elements.locationSelect,
      "change",
      this.setLocations.bind(this)
    );
    this.addListener(
      this.elements.popupButton,
      "click",
      this.handlePopupButton.bind(this)
    );
  }

  async handleLogin() {
    this.hideErrors();
    const { loginEmail, loginPassword } = this.elements;
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!this.validateEmail(email)) {
      return this.showError("login-error", "Ingresa un email válido");
    }

    if (password.length < 6) {
      return this.showError(
        "login-error",
        "La contraseña debe tener al menos 6 caracteres"
      );
    }

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        this.log("Login exitoso:", result.user);
        this.showFeedback(
          `Bienvenido ${result.user.displayName || result.user.email}`
        );
        this.loginModal.hide();
        this.updateUI(true, result.user);
      } else {
        this.log("Error en login:", result.error);
        this.showError("login-error", result.error);
      }
    } catch (error) {
      this.log("Excepción en login:", error, true);
      this.showError("login-error", "Error al iniciar sesión");
    }
  }

  async handleRegister() {
    this.hideErrors();
    const { registerEmail, registerPassword, registerUsername } = this.elements;
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const username = registerUsername.value.trim();

    if (!username) {
      return this.showError("register-error", "Ingresa un nombre de usuario");
    }

    if (!this.validateEmail(email)) {
      return this.showError("register-error", "Ingresa un email válido");
    }

    if (password.length < 6) {
      return this.showError(
        "register-error",
        "La contraseña debe tener al menos 6 caracteres"
      );
    }

    try {
      const result = await authService.register(email, password, username);

      if (result.success) {
        this.log("Registro exitoso:", result.user);
        this.showFeedback(`¡Bienvenido ${username}! Registro exitoso`);
        this.loginModal.hide();
        this.updateUI(true, result.user);
      } else {
        this.log("Error en registro:", result.error);
        this.showError("register-error", result.error);
      }
    } catch (error) {
      this.log("Excepción en registro:", error, true);
      this.showError("register-error", "Error al registrar usuario");
    }
  }

  async handleLogout() {
    try {
      const result = await authService.logout();
      if (result.success) {
        this.log("Logout exitoso");
        this.showFeedback("Sesión cerrada correctamente");
        this.updateUI(false);
      }
    } catch (error) {
      this.log("Error en logout:", error, true);
      this.showFeedback("Error al cerrar sesión", true);
    }
  }

  initAuthState() {
    authService.onAuthStateChanged((user) => {
      if (user) {
        this.log("Cambio de estado: usuario autenticado", user);
        this.updateUI(true, user);
      } else {
        this.log("Cambio de estado: usuario no autenticado");
        this.updateUI(false);
      }
    });
  }

  updateUI(isAuthenticated, user = null) {
    try {
      this.toggleElement(this.elements.loginBtn, !isAuthenticated);
      this.toggleElement(this.elements.logoutBtn, isAuthenticated);

      if (isAuthenticated && user) {
        const greeting = user.displayName || user.email.split("@")[0];
        this.elements.userGreeting.textContent = `Hi, ${greeting}`;
        this.toggleElement(this.elements.userGreeting, true);
      } else {
        this.toggleElement(this.elements.userGreeting, false);
      }

      this.handleMapSection(isAuthenticated);
      console.log("UI actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar UI:", error);
    }
  }

  async handleMapSection(isAuthenticated) {
    if (isAuthenticated) {
      if (this.elements.mapContainer) {
        this.elements.mapContainer.classList.remove("d-none");

        if (!this.mapInitialized) {
          await this.initializeMap();
          this.mapInitialized = true;
        }
      }
    } else {
      if (this.elements.mapContainer) {
        this.elements.mapContainer.classList.add("d-none");
      }
    }
  }

  async initializeMap() {
    return new Promise(async (resolve) => {
      try {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary(
          "marker"
        );

        this.map = new Map(document.getElementById("map"), {
          center: { lat: 25.501, lng: -103.55129 },
          zoom: 16,
        });

        this.map.addListener("click", (e) => {
          console.log("Click en el mapa:", e.latLng);
          this.showPopup(e.latLng);
          this.addInfo(e.latLng);
        });

        await this.loadMarkersFromFirestore();
        await this.loadLocationOptions();

        resolve(true);
      } catch (error) {
        console.error("Error al inicializar el mapa:", error);
        resolve(false);
      }
    });
  }

  async loadMarkersFromFirestore() {
    try {
      const markersSnapshot = await getDocs(collection(db, "coordenadas"));
      markersSnapshot.forEach((doc) => {
        const data = doc.data();
        this.addMarkerToMap(data);
      });
    } catch (error) {
      console.error("Error al cargar markers:", error);
    }
  }
  async loadLocationOptions() {
    const locations = [
      { place: "SELECT PLACE", lat: "", lng: "" },
      { place: "UTLD", lat: "25.501196449986924", lng: "-103.55144262313843" },
      { place: "Cancun", lat: "21.125813175089082", lng: "-86.8685557427019" },
      { place: "UNI POLI", lat: "15", lng: "15" },
    ];

    locations.forEach((loc, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = loc.place;
      this.elements.locationSelect.appendChild(option);
    });
  }

  addMarkerToMap(location) {
    if (!this.map) return;

    const icons = {
      0: "./assets/img/herta.gif",
      1: "./assets/img/elysiasax.gif",
      2: "./assets/img/beachflag.png",
    };
    const selectedValue = this.elements.iconSelect?.value || "0";
    const iconUrl = icons[selectedValue] || icons[0];

    const marker = new google.maps.Marker({
      position: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng),
      },
      map: this.map,
      title: location.inputplace || "Nueva ubicación",
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(50, 50),
      },
    });

    if (location.inputplace) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<strong>${location.inputplace}</strong>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(this.map, marker);
      });
    }

    this.markers.push(marker);
    return marker;
  }

  addInfo(location) {
    this.elements.latitude.value = location.lat();
    this.elements.longitude.value = location.lng();
  }

  showPopup(location) {
    try {
      this.elements.popupLatitude.value = location.lat();
      this.elements.popupLongitude.value = location.lng();

      if (this.dialog && typeof this.dialog.showModal === "function") {
        this.dialog.showModal();
      } else {
        console.error(
          "Elemento dialog no encontrado o showModal no disponible"
        );
      }
    } catch (error) {
      console.error("Error en showPopup:", error);
    }
  }

  async handlePopupButton(e) {
    e.preventDefault();
    if (this.elements.inputPlace.value.length === 0) {
      this.elements.smallWarning.textContent = "⚠ Empty data!!";
      this.elements.smallWarning.style.color = "red";
      this.elements.smallWarning.style.display = "block";
    } else {
      const data = {
        lat: parseFloat(this.elements.popupLatitude.value),
        lng: parseFloat(this.elements.popupLongitude.value),
        placename: this.elements.inputPlace.value,
      };

      await this.addDB(data);
      this.dialog.close();
      this.elements.smallWarning.textContent = "";
      this.addMarkerToMap(data);
    }
  }

  async addDB(location) {
    try {
      const coords = {
        lat: location.lat,
        lng: location.lng,
        inputplace: location.placename,
      };
      await addDoc(collection(db, "coordenadas"), coords);
      console.log("Coordinates stored in Firestore");
    } catch (error) {
      console.error("Error storing coordinates in Firestore:", error);
    }
  }

  setCoordinates() {
    const latValue = parseFloat(this.elements.latitude.value);
    const lngValue = parseFloat(this.elements.longitude.value);

    if (!isNaN(latValue) && !isNaN(lngValue) && this.map) {
      const newLocation = { lat: latValue, lng: lngValue };
      this.map.setCenter(newLocation);
      this.map.setZoom(15);
    } else {
      alert("Please enter valid latitude and longitude.");
    }
  }

  setLocations() {
    const locations = [
      { place: "SELECT PLACE", lat: "", lng: "" },
      { place: "UTLD", lat: "25.501196449986924", lng: "-103.55144262313843" },
      { place: "Cancun", lat: "21.125813175089082", lng: "-86.8685557427019" },
      { place: "UNI POLI", lat: "15", lng: "15" },
    ];

    const selectedIndex = this.elements.locationSelect.value;
    if (selectedIndex > 0 && selectedIndex < locations.length) {
      const selectedLocation = locations[selectedIndex];
      this.elements.latitude.value = selectedLocation.lat;
      this.elements.longitude.value = selectedLocation.lng;

      if (this.map) {
        this.map.setCenter({
          lat: parseFloat(selectedLocation.lat),
          lng: parseFloat(selectedLocation.lng),
        });
      }
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  resetForms() {
    if (this.elements.loginForm) this.elements.loginForm.reset();
    if (this.elements.registerForm) this.elements.registerForm.reset();
    this.hideErrors();
  }

  hideErrors() {
    this.toggleElement(this.elements.loginError, false);
    this.toggleElement(this.elements.registerError, false);
  }

  showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove("d-none");
    }
  }

  showFeedback(message, isError = false) {
    console.log(`Feedback: ${message}`, isError ? "error" : "info");
  }

  toggleElement(element, show) {
    if (element) {
      show
        ? element.classList.remove("d-none")
        : element.classList.add("d-none");
    }
  }

  log(message, ...args) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      const type = typeof args[0] === "string" ? args.shift() : "debug";

      const styles = {
        info: "color: blue;",
        error: "color: red; font-weight: bold;",
        warn: "color: orange;",
        debug: "color: gray;",
      };

      console.log(
        `%c[Auth][${timestamp}] ${message}`,
        styles[type] || "",
        ...args
      );
    }
  }

  addListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
      this.log(
        `Listener añadido a ${element.id || "elemento"} para evento ${event}`
      );

      if (this.debugMode) {
        element.dataset.debugListeners =
          (element.dataset.debugListeners || "") + `${event},`;
      }
    } else {
      this.log(`No se pudo añadir listener - elemento no encontrado`, "warn");
    }
  }

  debugAuthSetup() {
    console.groupCollapsed("AuthController Debug Info");
    console.log("=== Elementos ===");
    Object.entries(this.elements).forEach(([key, element]) => {
      console.log(`${key}:`, element ? "ENCONTRADO" : "NO ENCONTRADO");
    });

    console.log("=== Listeners ===");
    ["loginForm", "registerForm", "loginBtn", "logoutBtn"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        console.log(
          `${id}:`,
          el.dataset.debugListeners || "Sin listeners registrados"
        );
      }
    });

    console.log("=== Estado Inicial ===");
    console.log("Modal:", this.loginModal);
    console.log("Mapa inicializado:", this.mapInitialized);
    console.groupEnd();
  }
}

// Inicialización global
document.addEventListener("DOMContentLoaded", () => {
  const authController = new AuthController(true);
  if (process.env.NODE_ENV === "development") {
    window.authController = authController;
  }
});
