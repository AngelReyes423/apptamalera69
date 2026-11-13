/*!
 * Start Bootstrap - Grayscale v7.0.6 (https://startbootstrap.com/theme/grayscale)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
 */

// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-init.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DOM Elements
const waifuWindow = document.getElementById("waifu-window");
const waifuImg = document.getElementById("waifu-img");
const closeBtn = document.getElementById("close-btn");
const hiddenBtn = document.getElementById("hidden-btn");

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  // Asegurarse de que el mapa esté oculto inicialmente
  const mapContainer = document.getElementById("map-container");
  if (mapContainer) {
    mapContainer.classList.add("d-none");
  }

  // Navbar shrink function
  var navbarShrink = function () {
    const navbarCollapsible = document.body.querySelector("#mainNav");
    if (!navbarCollapsible) return;
    if (window.scrollY === 0) {
      navbarCollapsible.classList.remove("navbar-shrink");
    } else {
      navbarCollapsible.classList.add("navbar-shrink");
    }
  };

  function showForm(formId) {
    document.querySelectorAll(".form").forEach((form) => {
      form.classList.remove("active");
    });
    document.getElementById(formId).classList.add("active");
  }

  navbarShrink();
  document.addEventListener("scroll", navbarShrink);

  const mainNav = document.body.querySelector("#mainNav");
  if (mainNav) {
    new bootstrap.ScrollSpy(document.body, {
      target: "#mainNav",
      rootMargin: "0px 0px -40%",
    });
  }

  const navbarToggler = document.body.querySelector(".navbar-toggler");
  const responsiveNavItems = [].slice.call(
    document.querySelectorAll("#navbarResponsive .nav-link")
  );
  responsiveNavItems.map(function (responsiveNavItem) {
    responsiveNavItem.addEventListener("click", () => {
      if (window.getComputedStyle(navbarToggler).display !== "none") {
        navbarToggler.click();
      }
    });
  });

  // Waifu API
  async function loadWaifu() {
    try {
      const response = await fetch("https://api.waifu.pics/sfw/waifu");
      const data = await response.json();
      waifuImg.src = data.url;
    } catch (error) {
      console.error("Error al obtener waifu:", error);
    }
  }

  // Weather API
  window.addEventListener("DOMContentLoaded", function () {
    document
      .getElementById("searchButton")
      .addEventListener("click", function () {
        const city = document.getElementById("cityInput").value;
        getWeatherByCity(city);
      });
    async function getWeatherByCity(city) {
      const API_KEY = "b1d9fc27dc854d99a1b6c399286551ac";
      const url = `https://api.weatherbit.io/v2.0/current?city=${city}&key=${API_KEY}&lang=en`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const weather = data.data[0];
          displayWeather(weather);
          getWeatherAlerts(weather.lat, weather.lon);
        } else {
          document.getElementById("weatherInfo").innerHTML =
            "<p>City ​​not found.</p>";
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        document.getElementById("weatherInfo").innerHTML =
          "<p>Error searching for city.</p>";
      }
    }

    async function getWeatherAlerts(lat, lon) {
      const API_KEY = "b1d9fc27dc854d99a1b6c399286551ac";
      const url = `https://api.weatherbit.io/v2.0/alerts?lat=${lat}&lon=${lon}&key=${API_KEY}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        const alertsDiv = document.getElementById("weatherAlerts");
        if (data.alerts && data.alerts.length > 0) {
          let alertsHTML = "<h3>⚠️ Weather Alerts</h3>";
          data.alerts.forEach((alert) => {
            alertsHTML += `
                    <div class="alert">
                        <p><strong>${alert.title}</strong> (${
              alert.severity
            })</p>
                        <p>${alert.description}</p>
                        <small>${new Date(
                          alert.effective_local
                        ).toLocaleString()}</small>
                    </div>
                `;
          });
          alertsDiv.innerHTML = alertsHTML;
        } else {
          alertsDiv.innerHTML = "<p>No weather alerts active.</p>";
        }
      } catch (error) {
        console.error("Error fetching weather alerts:", error);
        document.getElementById("weatherAlerts").innerHTML =
          "<p>Error loading alerts.</p>";
      }
    }

    function displayWeather(weather) {
      const weatherIcons = {
        Thunderstorm: "🌩️",
        Drizzle: "🌦️",
        Rain: "🌧️",
        Snow: "❄️",
        "Clear sky": "☀️",
        "Few clouds": "⛅",
        "Scattered clouds": "🌥️",
        "Broken clouds": "☁️",
        "Overcast clouds": "🌫️",
        Mist: "🌁",
        Fog: "🌁",
        Haze: "🌫️",
        Smoke: "💨",
        Dust: "🌪️",
        Sand: "🏜️",
      };

      const weatherDescription = weather.weather.description;
      const weatherIcon = weatherIcons[weatherDescription] || "❓";

      document.getElementById("weatherInfo").innerHTML = `
        <p><strong>📍 City:</strong> ${weather.city_name}</p>
        <p><strong>🌡 Temperature:</strong> ${weather.temp}°C</p>
        <p><strong>💨 Wind speed:</strong> ${weather.wind_spd.toFixed(
          1
        )} m/s</p>
        <p><strong>💧 Humidity:</strong> ${weather.rh}%</p>
        <p><strong>🌡 Thermal feeling:</strong> ${weather.app_temp}°C</p>
        <p><strong>${weatherIcon} Weather:</strong> ${weatherDescription}</p>
    `;
    }

    async function getWeather(lat, lon) {
      const API_KEY = "b1d9fc27dc854d99a1b6c399286551ac";
      const url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${API_KEY}&lang=en`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const weather = data.data[0];
          displayWeather(weather);
          getWeatherAlerts(lat, lon);
        } else {
          document.getElementById("weatherInfo").innerHTML =
            "<p>No weather data found.</p>";
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        document.getElementById("weatherInfo").innerHTML =
          "<p>Error al obtener datos.</p>";
      }
    }
    // Event Listeners for weather and waifu
    document
      .getElementById("buttonSet")
      ?.addEventListener("click", function () {
        const latValue = document.getElementById("latitude")?.value;
        const lonValue = document.getElementById("longitude")?.value;
        console.log("Lat:", latValue, "Lon:", lonValue);

        if (latValue && lonValue) {
          getWeather(latValue, lonValue);
        } else {
          alert("Please enter valid coordinates.");
        }
      });

    hiddenBtn?.addEventListener("click", () => {
      loadWaifu();
      waifuWindow.style.display = "block";
    });

    closeBtn?.addEventListener("click", () => {
      waifuWindow.style.display = "none";
    });
  });
});
