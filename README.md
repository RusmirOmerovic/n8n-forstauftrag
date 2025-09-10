# Automatisierter Forstauftrag-Workflow

Dieses Repository enthält einen n8n-Workflow, der GPS-Daten erfasst,
Formulareingaben sammelt und daraus ein professionelles PDF-Dokument
für Forstaufträge erstellt.

## Überblick

(/forstauftrag-workflow.png)

## Funktionsweise

1. Die Datei `gps-form.html` ermittelt auf Wunsch automatisch die
   Koordinaten des Geräts oder nimmt manuelle Eingaben entgegen.
2. Anschließend wird ein n8n-Formular geöffnet, in dem alle
   Auftragsdaten eingegeben werden.
3. Nach Absenden werden die Angaben mit Wetterdaten und den nächsten
   Rettungspunkten kombiniert.
4. Ein HTML-Template mit modernem Layout wird erzeugt und über
   Gotenberg in ein PDF umgewandelt.
5. Die Zustimmung des Nutzers wird im PDF als Ersatz für eine
   Unterschrift angezeigt, damit das Formular gültig ist.

## Anpassungen

- **Modernes Layout:** Überarbeitete CSS-Variablen und Styles sorgen
  für ein professionelles, druckfreundliches PDF.
- **Zustimmung:** Der Text aus dem Formularfeld „Zustimmung“ wird in
  einer eigenen Karte im PDF ausgegeben.

## Beispiel

![Altes Formular](docs/original-formular.png)
*Platzhalter für das ursprüngliche, händisch auszufüllende PDF.*

## Entwicklung

1. `workflow.json` in n8n importieren.
2. `gps-form.html` im Browser öffnen, um die Standortabfrage zu testen.
3. Änderungen am Workflow erneut exportieren und committen.

## Lizenz

MIT – frei für private und kommerzielle Nutzung.

