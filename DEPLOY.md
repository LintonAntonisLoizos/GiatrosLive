# 🚀 DEPLOY GUIDE (Ο Κύριος Διαχειριστής)

Αυτό είναι για εσένα που θα ανεβάσεις το project στο cloud.

---

## ΒΗΜΑ 1: GitHub Account

1. Πήγαινε: https://github.com
2. Sign Up με email
3. Επιβεβαίωσε το email

---

## ΒΗΜΑ 2: GitHub Repository

1. Κάνε login στο GitHub
2. Πάτησε `+` → `New repository`
3. Όνομα: `giatros-live`
4. Description: `Order system with cloud and local printer`
5. Public/Private: Επιλέγεις
6. Πάτησε `Create repository`

---

## ΒΗΜΑ 3: Upload Project

Άνοιξε PowerShell στο `C:\Users\loizo\Desktop\Giatros-Live`:

```powershell
# Αρχική ρύθμιση
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Ανέβασμα
git init
git add .
git commit -m "Initial commit: Giatros Live"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/giatros-live.git
git push -u origin main
```

**Προσοχή:** Αντικατάστησε `YOUR_USERNAME` με τη δική σου!

---

## ΒΗΜΑ 4: Render Account

1. Πήγαινε: https://render.com
2. Πάτησε `Sign Up with GitHub`
3. Ενέργησε το request που στέλνει το GitHub

---

## ΒΗΜΑ 5: Deploy στο Render

1. Στο Render dashboard, πάτησε `New +` → `Web Service`
2. Επέλεξε το repository `giatros-live`
3. Ρυθμίσεις:
   - **Name**: `giatros-live`
   - **Environment**: Node
   - **Region**: Frankfurt
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Πάτησε `Create Web Service`

Περίμενε 2-3 λεπτά. Το URL θα είναι κάτι σαν:
```
https://giatros-live.onrender.com
```

---

## ΒΗΜΑ 6: Δώσε το URL στους άλλους

Ο τοπικός agent χρειάζεται αυτό το URL. Δημιούργησε ένα `.env` αρχείο για τους άλλους:

**Δώσε σε κάθε κατάστημα αυτό το αρχείο ως `.env`:**

```dotenv
CLOUD_API_URL=https://giatros-live.onrender.com
LOCAL_PRINTER_HOST=192.168.88.4
LOCAL_PRINTER_PORT=9100
POLL_INTERVAL_SECONDS=10
STATUS_PORT=4000
```

---

## ΒΗΜΑ 7: Δοκιμή

1. Πήγαινε: `https://giatros-live.onrender.com` (Πελάτης)
2. Πήγαινε: `https://giatros-live.onrender.com/administrator` (Admin)
3. Στο κατάστημα τρέχει τον `START-AGENT.bat`

Δοκίμασε να κάνεις μια παραγγελία!

---

## 🔄 Updates αργότερα

Αν αλλάξεις κάτι:

```powershell
git add .
git commit -m "Update: description of changes"
git push
```

Render θα κάνει deploy αυτόματα! ✅

---

Απορίες; 🤔
