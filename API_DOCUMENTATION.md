# API Documentation - Tishrei Entry System

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "admin",
      "name": "מנהל ראשי",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "התחברות הצליחה"
}
```

### Get Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "admin",
    "name": "מנהל ראשי",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "פרופיל משתמש"
}
```

### Change Password
**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 👤 Participants Endpoints

### Get All Participants
**GET** `/participants`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: 'createdAt')
- `sortOrder` (string, 'asc' | 'desc', default: 'desc')
- `search` (string) - Search in name, family, barcode, email, city

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "ישראל",
        "family": "כהן",
        "barcode": "123456789",
        "phone": "050-1234567",
        "email": "israel.cohen@example.com",
        "city": "ירושלים",
        "schoolClass": "י\"ב",
        "branch": "סניף מרכז",
        "groupType": "תיכון",
        "fullName": "ישראל כהן",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Get Participant by ID
**GET** `/participants/:id`

### Get Participant by Barcode
**GET** `/participants/barcode/:barcode`

### Create Participant (Admin Only)
**POST** `/participants`

**Request Body:**
```json
{
  "name": "ישראל",
  "family": "כהן",
  "barcode": "123456789",
  "phone": "050-1234567",
  "email": "israel.cohen@example.com",
  "city": "ירושלים",
  "schoolClass": "י\"ב",
  "branch": "סניף מרכז",
  "groupType": "תיכון"
}
```

### Update Participant (Admin Only)
**PUT** `/participants/:id`

### Delete Participant (Admin Only)
**DELETE** `/participants/:id`

---

## 📅 Events Endpoints

### Get All Events
**GET** `/events`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: 'date')
- `sortOrder` (string, 'asc' | 'desc', default: 'desc')
- `isActive` (boolean)

### Get Active Events
**GET** `/events/active`

### Get Event by ID
**GET** `/events/:id`

### Create Event (Admin Only)
**POST** `/events`

**Request Body:**
```json
{
  "name": "כנס ראש השנה",
  "date": "2024-10-02T18:00:00.000Z",
  "description": "כנס מיוחד לראש השנה עם הרצאות ופעילויות",
  "isActive": true
}
```

### Update Event (Admin Only)
**PUT** `/events/:id`

### Delete Event (Admin Only)
**DELETE** `/events/:id`

### Toggle Event Status (Admin Only)
**PATCH** `/events/:id/toggle-status`

---

## 🎫 Entries Endpoints

### Create Entry (Scanner/Admin)
**POST** `/entries`

**Request Body:**
```json
{
  "participantId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "eventId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "method": "barcode"
}
```

### Create Entry by Barcode (Scanner/Admin)
**POST** `/entries/barcode`

**Request Body:**
```json
{
  "barcode": "123456789",
  "eventId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "method": "barcode"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "participantId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "ישראל",
      "family": "כהן",
      "barcode": "123456789",
      "fullName": "ישראל כהן"
    },
    "eventId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "כנס ראש השנה",
      "date": "2024-10-02T18:00:00.000Z"
    },
    "scannerId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "name": "סורק ראשי",
      "username": "scanner"
    },
    "entryTime": "2024-01-01T12:00:00.000Z",
    "method": "barcode",
    "formattedEntryTime": "01/01/2024, 15:00:00",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "כניסה נרשמה בהצלחה"
}
```

### Get Entries by Event (Scanner/Admin)
**GET** `/entries/event/:eventId`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

### Get Entry Statistics (Scanner/Admin)
**GET** `/entries/stats/:eventId`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 25,
    "methodStats": {
      "barcode": 20,
      "manual": 5
    },
    "barcodeEntries": 20,
    "manualEntries": 5
  }
}
```

### Get All Entries (Admin Only)
**GET** `/entries`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: 'entryTime')
- `sortOrder` (string, 'asc' | 'desc', default: 'desc')
- `eventId` (string)
- `participantId` (string)

### Get Entry by ID (Admin Only)
**GET** `/entries/:id`

### Delete Entry (Admin Only)
**DELETE** `/entries/:id`

---

## 👥 Users Endpoints (Admin Only)

### Get All Users
**GET** `/users`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: 'createdAt')
- `sortOrder` (string, 'asc' | 'desc', default: 'desc')
- `role` (string, 'admin' | 'scanner')
- `isActive` (boolean)

### Get Scanners
**GET** `/users/scanners`

### Get User by ID
**GET** `/users/:id`

### Create User
**POST** `/users`

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "משתמש חדש",
  "role": "scanner",
  "isActive": true
}
```

### Update User
**PUT** `/users/:id`

**Note:** Password cannot be updated through this endpoint.

### Delete User
**DELETE** `/users/:id`

### Toggle User Status
**PATCH** `/users/:id/toggle-status`

### Reset User Password
**POST** `/users/:id/reset-password`

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

---

## 🔒 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "שם הוא שדה חובה"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "נדרש טוקן אימות"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "אין לך הרשאה לבצע פעולה זו"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "משתתף לא נמצא"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "שגיאה בשרת"
}
```

---

## 📊 Data Types

### GroupType Enum
- `"סמינר"` - Seminar
- `"תיכון"` - High School
- `"נשים"` - Women

### UserRole Enum
- `"admin"` - Administrator
- `"scanner"` - Scanner

### Entry Method
- `"barcode"` - Barcode scan
- `"manual"` - Manual entry

---

## 🚀 Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
```

3. **Start MongoDB**

4. **Seed the database:**
```bash
npm run seed
```

5. **Start the server:**
```bash
npm run dev
```

6. **Test the API:**
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All text responses are in Hebrew
- JWT tokens expire after 24 hours by default
- Rate limiting: 100 requests per 15 minutes per IP
- CORS is configured for `http://localhost:5173` by default 