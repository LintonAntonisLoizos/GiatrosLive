# 🚀 Giatros Live

Αυτή η εφαρμογή χωρίζεται σε δύο μέρη:

1. **Cloud backend + frontend** στο Render (διαχειριστής ανεβάζει)
2. **Τοπικός printer agent** στο κατάστημα (διαχειριστής τρέχει μόνο ένα αρχείο)

---

## � Τι χρειάζεσαι

- ✅ Node.js (version 18+)
- ✅ Git (για version control)
- ✅ GitHub account
- ✅ Render account

**Κάνε download:**
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/downloads

---

## �👥 Ρόλοι & Δράσεις

| Ρόλος | Τι κάνει | Αρχείο |
|-------|----------|--------|
| 🔧 Κύριος Διαχειριστής | GitHub + Render setup | `DEPLOY.md` |
| 🏪 Διαχειριστής Καταστήματος | Τρέχει τον Agent | `INSTALL.md` |
| 👥 Πελάτης | Κάνει παραγγελίες | Web browser |
| 📱 Admin User | Διαχειρίζεται παραγγελίες | Web browser admin |

---

## 🎯 ΓΙΑ ΤΟΝ ΔΙΑΧΕΙΡΙΣΤΗ ΚΑΤΑΣΤΗΜΑΤΟΣ

### ✅ Τι χρειάζεται

- Windows PC / Laptop
- Node.js (setup κάνει auto-check)
- Σύνδεση στο ίδιο δίκτυο με τον εκτυπωτή

### 🚀 Μόνο 2 Βήματα

**1️⃣ Εγκατάσταση (Πρώτη φορά)**
```
Διπλοκλικ: SETUP.bat
```

**2️⃣ Εκκίνηση (Κάθε φορά)**
```
Διπλοκλικ: START-AGENT.bat
```

### 📊 Δες τα Logs
```
Άνοιξε: http://localhost:4000
```

👉 **Πλήρης οδηγίες**: Δες `INSTALL.md`

---

## � Updates & Αλλαγές

### Για τον Κύριο Διαχειριστή (Developer)

**Όταν κάνεις αλλαγές:**

1. Άλλαξε τα αρχεία
2. **Διπλοκλικ**: `UPDATE.bat`
3. Γράψε μήνυμα για τις αλλαγές
4. Πάτησε Enter

**Το Render κάνει αυτόματα deploy!** 🚀

### Για τους Διαχειριστές Καταστημάτων

**Για να πάρουν τις νέες αλλαγές:**

```powershell
cd C:\Giatros\giatros-live
git pull
```

Μετά ξανατρέξε `START-AGENT.bat`

---

## 📋 Workflow

1. **Developer** κάνει αλλαγές → `UPDATE.bat` → GitHub
2. **Render** βλέπει τις αλλαγές → αυτόματο deploy
3. **Καταστήματα** κάνουν `git pull` → νέες λειτουργίες

---

## �🖥️ ΓΙΑ ΤΟΝ ΚΥΡΙΟ ΔΙΑΧΕΙΡΙΣΤΗ (Cloud Setup)

### 🚀 Μόνο 6 Βήματα

**1️⃣ GitHub Account** - https://github.com → Sign Up  
**2️⃣ Create Repository** - New repository named `giatros-live`  
**3️⃣ Upload Project** - `git push` όλα τα αρχεία  
**4️⃣ Render Account** - https://render.com → Sign up with GitHub  
**5️⃣ Deploy** - New Web Service → Connect `giatros-live`  
**6️⃣ Δώσε το URL** - Σε κάθε κατάστημα  

👉 **Πλήρης οδηγίες**: Δες `DEPLOY.md`

---

