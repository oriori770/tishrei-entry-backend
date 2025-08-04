# Tishrei Entry Backend

שרת Node.js עם MongoDB לניהול מערכת כניסות QR Code

## תכונות עיקריות

- 🔐 אימות משתמשים עם JWT
- 👥 ניהול משתמשים (מנהל/סורק)
- 👤 ניהול משתתפים
- 📅 ניהול אירועים
- 🎫 רישום כניסות (ברקוד/ידני)
- 📊 סטטיסטיקות וניתוח נתונים
- 🔒 אבטחה מתקדמת
- 📱 API מלא עם תיעוד

## דרישות מערכת

- Node.js 18+ 
- MongoDB 5+
- npm או yarn

## התקנה

1. **שכפול הפרויקט**
```bash
cd tishrei-entry-backend
```

2. **התקנת תלויות**
```bash
npm install
```

3. **הגדרת משתני סביבה**
```bash
cp env.example .env
```

ערוך את קובץ `.env` עם ההגדרות שלך:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tishrei-entry

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

4. **הפעלת השרת**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## מבנה הפרויקט

```
src/
├── config/
│   └── database.ts          # הגדרות מסד נתונים
├── controllers/
│   ├── authController.ts    # בקר אימות
│   ├── participantController.ts
│   ├── eventController.ts
│   ├── entryController.ts
│   └── userController.ts
├── middleware/
│   └── auth.ts              # middleware אימות
├── models/
│   ├── Participant.ts
│   ├── User.ts
│   ├── Event.ts
│   └── Entry.ts
├── routes/
│   ├── auth.ts
│   ├── participants.ts
│   ├── events.ts
│   ├── entries.ts
│   └── users.ts
├── types/
│   └── index.ts             # הגדרות טיפוסים
└── index.ts                 # קובץ ראשי
```

## API Endpoints

### אימות (Authentication)
- `POST /api/auth/login` - התחברות
- `GET /api/auth/profile` - פרופיל משתמש
- `POST /api/auth/change-password` - שינוי סיסמה

### משתתפים (Participants)
- `GET /api/participants` - רשימת משתתפים
- `GET /api/participants/:id` - משתתף לפי מזהה
- `GET /api/participants/barcode/:barcode` - משתתף לפי ברקוד
- `POST /api/participants` - יצירת משתתף (מנהל בלבד)
- `PUT /api/participants/:id` - עדכון משתתף (מנהל בלבד)
- `DELETE /api/participants/:id` - מחיקת משתתף (מנהל בלבד)

### אירועים (Events)
- `GET /api/events` - רשימת אירועים
- `GET /api/events/active` - אירועים פעילים
- `GET /api/events/:id` - אירוע לפי מזהה
- `POST /api/events` - יצירת אירוע (מנהל בלבד)
- `PUT /api/events/:id` - עדכון אירוע (מנהל בלבד)
- `DELETE /api/events/:id` - מחיקת אירוע (מנהל בלבד)
- `PATCH /api/events/:id/toggle-status` - הפעלה/השבתה (מנהל בלבד)

### כניסות (Entries)
- `POST /api/entries` - יצירת כניסה (סורק/מנהל)
- `POST /api/entries/barcode` - יצירת כניסה לפי ברקוד (סורק/מנהל)
- `GET /api/entries/event/:eventId` - כניסות לאירוע (סורק/מנהל)
- `GET /api/entries/stats/:eventId` - סטטיסטיקות אירוע (סורק/מנהל)
- `GET /api/entries` - כל הכניסות (מנהל בלבד)
- `GET /api/entries/:id` - כניסה לפי מזהה (מנהל בלבד)
- `DELETE /api/entries/:id` - מחיקת כניסה (מנהל בלבד)

### משתמשים (Users)
- `GET /api/users` - רשימת משתמשים (מנהל בלבד)
- `GET /api/users/scanners` - רשימת סורקים (מנהל בלבד)
- `GET /api/users/:id` - משתמש לפי מזהה (מנהל בלבד)
- `POST /api/users` - יצירת משתמש (מנהל בלבד)
- `PUT /api/users/:id` - עדכון משתמש (מנהל בלבד)
- `DELETE /api/users/:id` - מחיקת משתמש (מנהל בלבד)
- `PATCH /api/users/:id/toggle-status` - הפעלה/השבתה (מנהל בלבד)
- `POST /api/users/:id/reset-password` - איפוס סיסמה (מנהל בלבד)

## הרשאות

### מנהל (Admin)
- גישה מלאה לכל הפונקציות
- ניהול משתמשים
- ניהול משתתפים
- ניהול אירועים
- צפייה בכל הכניסות

### סורק (Scanner)
- סריקת ברקודים
- רישום כניסות
- צפייה במשתתפים
- צפייה באירועים פעילים
- צפייה בכניסות לאירועים

## דוגמאות שימוש

### התחברות
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

### יצירת משתתף
```bash
curl -X POST http://localhost:3001/api/participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "ישראל",
    "family": "כהן",
    "barcode": "123456789",
    "phone": "050-1234567",
    "email": "israel@example.com",
    "city": "ירושלים",
    "schoolClass": "י"ב",
    "branch": "סניף מרכז",
    "groupType": "תיכון"
  }'
```

### רישום כניסה
```bash
curl -X POST http://localhost:3001/api/entries/barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "barcode": "123456789",
    "eventId": "EVENT_ID_HERE",
    "method": "barcode"
  }'
```

## פיתוח

### הרצת בדיקות
```bash
npm test
```

### בנייה לייצור
```bash
npm run build
```

### בדיקת קוד
```bash
npm run lint
```

## אבטחה

- 🔐 JWT tokens לאימות
- 🔒 הצפנת סיסמאות עם bcrypt
- 🛡️ Rate limiting
- 🛡️ Helmet.js לאבטחה
- 🛡️ CORS מוגדר
- 🛡️ Validation מלא

## תמיכה

לשאלות ותמיכה, פנה אל:
- 📧 Email: support@example.com
- 📱 WhatsApp: +972-XX-XXXXXXX

## רישיון

MIT License 