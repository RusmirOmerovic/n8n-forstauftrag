# Forstauftrag – End-to-End Workflow (n8n → Gotenberg PDF)

Dieses Projekt erzeugt aus Web-Formularen (inkl. optionaler GPS-Daten) strukturierte **Arbeitsaufträge als PDF**. Besonderheiten:
- Nutzer wählen in `index.html`, ob und wie GPS geteilt wird.
- n8n sammelt Formular- und Zusatzdaten (Wetter via OpenWeatherMap, Top-3 Rettungspunkte).
- Gotenberg (Chromium) rendert das PDF inkl. **einheitlichem Header/Footer**.
- Ergebnisse können gespeichert, versendet und in Google Sheets geloggt werden.

## Inhaltsverzeichnis
1. [Architektur](#architektur)
2. [Ablauf / Data Flow](#ablauf--data-flow)
3. [Voraussetzungen](#voraussetzungen)
4. [Lokales Setup & Deployment](#lokales-setup--deployment)
5. [Frontend (`index.html`)](#frontend-indexhtml)
6. [n8n Workflow](#n8n-workflow)
7. [PDF-Erzeugung (Gotenberg)](#pdf-erzeugung-gotenberg)
8. [Header/Footer-Design](#headerfooter-design)
9. [GPS & Rettungspunkte](#gps--rettungspunkte)
10. [Wetterdaten](#wetterdaten)
11. [Fehlerbehandlung](#fehlerbehandlung)
12. [Troubleshooting](#troubleshooting)
13. [Screenshots](#screenshots)
14. [Versionierung & Lizenz](#versionierung--lizenz)

---

## Architektur