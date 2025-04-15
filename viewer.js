// viewer.js Version 1.4 – Marker bleiben fixiert beim Zoom durch gemeinsamen Transform-Wrapper

const kunde = "kunde01";
let aktuellesBild = "";
let bilderListe = [];
let aktuellerIndex = 0;
let markerAktiv = true;
let zoomFaktor = 1;
let isPanning = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;

const bildElement = document.getElementById("viewer");
const markerContainer = document.getElementById("overlay");
const container = document.getElementById("container");
const wrapper = document.getElementById("wrapper");

const statusLabel = document.createElement("div");
statusLabel.style.position = "fixed";
statusLabel.style.top = "10px";
statusLabel.style.right = "10px";
statusLabel.style.background = "#387373";
statusLabel.style.color = "white";
statusLabel.style.padding = "6px 12px";
statusLabel.style.borderRadius = "8px";
statusLabel.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
statusLabel.style.zIndex = "1000";
statusLabel.style.fontSize = "14px";
document.body.appendChild(statusLabel);

function updateStatusLabel() {
  statusLabel.textContent = markerAktiv ? "Markierungsmodus aktiv" : "Verschiebemodus aktiv";
}

function toggleMarkers() {
  markerAktiv = !markerAktiv;
  markerContainer.style.display = markerAktiv ? "block" : "none";
  bildElement.style.cursor = markerAktiv ? "crosshair" : "grab";
  updateStatusLabel();
}

function ladeBilder() {
  fetch(`/kunden/${kunde}/bilder`)
    .then(res => res.json())
    .then(bilder => {
      bilderListe = bilder;
      zeigeBild(0);
    });
}

function zeigeBild(index) {
  if (index < 0 || index >= bilderListe.length) return;
  aktuellerIndex = index;
  aktuellesBild = bilderListe[index];
  bildElement.onload = () => ladeAnmerkungen();
  bildElement.src = `/uploads/${kunde}/${encodeURIComponent(aktuellesBild)}`;
  document.getElementById("counter").textContent = `Bild ${index + 1} von ${bilderListe.length}`;
  zoomFaktor = 1;
  offsetX = 0;
  offsetY = 0;
  updateViewerTransform();
  updateStatusLabel();
}

function prevImage() {
  zeigeBild(aktuellerIndex - 1);
}

function nextImage() {
  zeigeBild(aktuellerIndex + 1);
}

function zoom(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoomFaktor = Math.min(Math.max(zoomFaktor + delta, 0.5), 3);
  updateViewerTransform();
}

function updateViewerTransform() {
  wrapper.style.transform = `scale(${zoomFaktor}) translate(${offsetX}px, ${offsetY}px)`;
}

container.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    isPanning = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    bildElement.style.cursor = "grabbing";
  }
});

container.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  updateViewerTransform();
});

container.addEventListener("mouseup", () => {
  isPanning = false;
  bildElement.style.cursor = markerAktiv ? "crosshair" : "grab";
});

container.addEventListener("mouseleave", () => {
  isPanning = false;
  bildElement.style.cursor = markerAktiv ? "crosshair" : "grab";
});

function addMarker(e) {
  if (!markerAktiv || e.button !== 0) return;
  const rect = bildElement.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const text = prompt("Bemerkung hinzufügen:");
  if (!text) return;

  fetch(`/kunden/${kunde}/anmerkung`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bild: aktuellesBild, x, y, text })
  }).then(() => ladeAnmerkungen());
}

function ladeAnmerkungen() {
  markerContainer.innerHTML = "";
  fetch(`/kunden/${kunde}/anmerkung/${encodeURIComponent(aktuellesBild)}`)
    .then(res => res.json())
    .then(anmerkungen => {
      anmerkungen.forEach((a, index) => {
        const marker = document.createElement("div");
        marker.className = "marker";
        marker.style.left = `${a.x * 100}%`;
        marker.style.top = `${a.y * 100}%`;
        marker.style.transform = "translate(0, -50%)";
        marker.style.position = "absolute";

        const punkt = document.createElement("div");
        punkt.style.width = "6px";
        punkt.style.height = "6px";
        punkt.style.background = "red";
        punkt.style.borderRadius = "50%";

        const label = document.createElement("span");
        label.textContent = a.text;
        label.style.background = "rgba(255, 255, 255, 0.8)";
        label.style.color = "black";
        label.style.padding = "2px 4px";
        label.style.borderRadius = "3px";
        label.style.marginLeft = "4px";

        const del = document.createElement("button");
        del.textContent = "✕";
        del.style.marginLeft = "4px";
        del.style.cursor = "pointer";
        del.onclick = (e) => {
          e.stopPropagation();
          fetch(`/kunden/${kunde}/anmerkung/${encodeURIComponent(aktuellesBild)}/${index}`, {
            method: "DELETE"
          }).then(() => ladeAnmerkungen());
        };

        marker.appendChild(punkt);
        marker.appendChild(label);
        marker.appendChild(del);
        markerContainer.appendChild(marker);
      });
    });
}

document.addEventListener("contextmenu", e => e.preventDefault());
ladeBilder();
