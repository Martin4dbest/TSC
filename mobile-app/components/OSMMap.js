import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function OSMMap({ latitude, longitude }) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
      #map {
        height: 100vh;
        width: 100%;
        margin: 0;
      }
      body {
        margin: 0;
      }
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script>
      var map = L.map('map').setView([${latitude}, ${longitude}], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      L.marker([${latitude}, ${longitude}])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    </script>
  </body>
  </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ html }} style={{ flex: 1 }} />
    </View>
  );
}