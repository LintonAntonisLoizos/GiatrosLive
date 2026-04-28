# Giatros Live

Αυτή η εφαρμογή χωρίζεται σε δύο μέρη:

1. Cloud backend + frontend που θα τρέχει στο Render.
2. Τοπικός printer agent που τρέχει στο κατάστημα και επικοινωνεί με τον εκτυπωτή.

---

## Αρχιτεκτονική

- `server.js`: Εξυπηρετεί το client site, την admin σελίδα και το API.
- `public/client/index.html`: Κατάστημα/πελάτης.
- `public/administrator/index.html`: Διαχειριστής.
- `local-printer-agent.js`: Τοπική υπηρεσία που διαβάζει εκκρεμείς παραγγελίες από το cloud και τις στέλνει στον εκτυπωτή.

### Πώς λειτουργεί

- Ο πελάτης στέλνει παραγγελία στο cloud API.
- Το cloud αποθηκεύει την παραγγελία και την σημειώνει ως `printRequested`.
- Ο τοπικός agent ελέγχει περιοδικά το cloud για εκκρεμείς εκτυπώσεις.
- Όταν βρει παραγγελία, την εκτυπώνει στον τοπικό εκτυπωτή και ενημερώνει το cloud.
- Ο διαχειριστής μπορεί να ζητήσει επανεκτύπωση από το admin UI.

---

## Σύνδεση με GitHub + Render

1. Δημιούργησε ένα GitHub repository και ανέβασε όλο το project.
2. Σύνδεσε το repository με το Render.
3. Στη δημιουργία υπηρεσίας στο Render:
   - Επιλογή τύπου: Web Service
   - Περιβάλλον: Node
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Στο Render μπορείς να ορίσεις περιβάλλοντα μεταβλητές αν χρειαστείς.

Με αυτό τον τρόπο, το frontend και το cloud backend θα τρέχουν στο Render.

---

## Τοπικός printer agent

1. Κλωνοποίησε το repository στο μηχάνημα του καταστήματος.
2. Εκτέλεσε `npm install`.
3. Ορισμός μεταβλητών περιβάλλοντος:
   - `CLOUD_API_URL`: Το URL της υπηρεσίας στο Render, π.χ. `https://my-giatros-app.onrender.com`
   - `LOCAL_PRINTER_HOST`: `192.168.88.4`
   - `LOCAL_PRINTER_PORT`: `9100`
   - `POLL_INTERVAL_SECONDS`: `10` (ή μεγαλύτερο αν θέλεις)
   - `STATUS_PORT`: `4000`
4. Ξεκίνησε τον agent με:
   ```bash
   npm run local-agent
   ```
5. Άνοιξε `http://localhost:4000` για να δεις την κατάσταση του τοπικού agent.

---

## Περιβάλλοντα μεταβλητές

Μπορείς να χρησιμοποιήσεις αρχείο `.env` ή να ορίσεις τις μεταβλητές απευθείας στο Render / στο τοπικό σύστημα.

Παράδειγμα `.env.example`:

```dotenv
CLOUD_API_URL=https://<your-render-service>.onrender.com
LOCAL_PRINTER_HOST=192.168.88.4
LOCAL_PRINTER_PORT=9100
POLL_INTERVAL_SECONDS=10
STATUS_PORT=4000
```

---

## Επιπλέον

- Αν ο τοπικός agent δεν είναι ενεργός, οι παραγγελίες θα αποθηκεύονται στο cloud και θα περιμένουν για εκτύπωση.
- Για να χρησιμοποιήσεις το Render, αρκεί να κάνεις push στο branch `main` και το Render θα κάνει deploy.
- Το `local-printer-agent.js` πρέπει να τρέχει πάντα σε μηχάνημα που έχει πρόσβαση στο τοπικό δίκτυο του εκτυπωτή.
