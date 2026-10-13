import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import { UserModel } from '../models/User';
import { EventModel } from '../models/Event';
import { ParticipantModel } from '../models/Participant';
import { EntryModel } from '../models/Entry';
import { UserRole, GroupType } from '../types';

/**
 * מנהלים (Admins)
 */
const MANAGERS_DATA = [
  { username: 'witzenhandler', name: 'מושקי ויצהנדלר' },
  { username: 'yarel', name: 'אילה יראל' },
  { username: 'blili', name: 'חני בלילי' },
  { username: 'benisti', name: 'מושקא בניסטי' },
  { username: 'lalum', name: 'אלונה ללום' },
  { username: 'lerner', name: 'גאולה לרנר' },
  { username: 'achotshri', name: 'מוקד אחותשרי' },
  { username: 'chani_levy', name: 'חני לוי - רכזת תכניות' },
  { username: 'rivka_k', name: 'רבקה קעניג - אחראית כניסות' },
];

/**
 * עמדות סריקה / סורקים (Scanners)
 */
const SCANNERS_DATA = [
  { username: 'scanner', name: 'סורק ראשי' },
  { username: 'scanner_main', name: 'עמדת סריקה - שער ראשי' },
  { username: 'scanner_side', name: 'עמדת סריקה - שער צדדי' },
  { username: 'scanner_hall', name: 'עמדת סריקה - לובי אולם' },
  { username: 'scanner_mobile', name: 'סורק נייד - אחראית שטח' },
];

/**
 * מאגר שמות פרטיים ומשפחה למשתתפות
 */
const FIRST_NAMES = [
  'חיה מושקא', 'רבקה', 'שרה', 'דבורה לאה', 'מנוחה רחל', 'שטערנא שרה', 'פייגא',
  'ברכה', 'חנה רבקה', 'מרים', 'הודיה', 'תמר', 'שירה', 'מיכל', 'רחל', 'אסתר',
  'שפרה', 'עטרה', 'יהודית', 'לאה', 'צביה', 'רותי', 'בתיה', 'מלכה', 'נעמי',
  'הדסה', 'ציפורה', 'שולמית', 'גיטל', 'בת שבע', 'דינה', 'אהובה', 'ריבה',
  'חסידה', 'תהילה', 'אפרת', 'נחמה דינה', 'חיה רחל', 'יוכבד', 'חני', 'מירי',
  'אורלי', 'פנינה', 'יסכה', 'תהל', 'אודליה', 'גליה', 'צופיה', 'שרית', 'מוריה',
  'איילת השחר', 'כנרת', 'רננה', 'מוסיא', 'שמחה'
];

const LAST_NAMES = [
  'שניאורסון', 'קעניג', 'סגל', 'גולדשטיין', 'בליצקי', 'קליין', 'מנדלסון',
  'קפלן', 'גינזבורג', 'לוי', 'כהן', 'אלפרוביץ', 'וולף', 'פרידמן', 'אשכנזי',
  'בוטמן', 'רוזנבלום', 'ליפשיץ', 'סלונים', 'זילברשטרום', 'מילר', 'פישר',
  'רוזנברג', 'הלפרין', 'גרשוביץ', 'אקסלרוד', 'קמינצקי', 'מרוזוב', 'טייטלבוים',
  'שוורץ', 'קרסיק', 'דוכמן', 'לבקובסקי', 'רבינוביץ', 'וילהלם', 'גרוזמן',
  'ליברמן', 'פלדמן', 'ברקוביץ', 'בוקובזה', 'לרנר', 'ויסברג', 'כץ', 'שטרן',
  'אברמוביץ', 'דרוק', 'עזרא', 'סבג', 'בן שמעון', 'צור', 'מזרחי', 'ביטון',
  'אוחיון', 'שלום', 'אדרעי', 'ליפסקר', 'קרומבי', 'בלילי', 'בניסטי', 'הבלין'
];

const CITIES = [
  'ירושלים', 'כפר חב"ד', 'צפת', 'בני ברק', 'נתניה', 'נחל\'ה', 'לוד',
  'מגדל העמק', 'בית שמש', 'אשקלון', 'קריית גת', 'חיפה', 'אלעד', 'ביתר עילית',
  'רחובות', 'פתח תקווה', 'עפולה', 'קריית מלאכי', 'באר שבע'
];

const GROUP_TYPES = [
  GroupType.HighSchoolFullMonth,
  GroupType.HighSchoolPartialAfterYom,
  GroupType.ApartmentPlusPrograms,
  GroupType.SeminarFullMonth,
  GroupType.SeminarAfterYom,
  GroupType.Women,
];

interface SeedOptions {
  clearExisting?: boolean;
}

/**
 * פונקציית Seed מקיפה ליצירת כל נתוני המערכת
 */
export async function seedData(options: SeedOptions = { clearExisting: true }): Promise<void> {
  console.log('====================================================');
  console.log('🌱 מתחיל תהליך SEED מקיף עבור מערכת כניסות תשרי');
  console.log('====================================================\n');

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || '770770';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin770';

  if (options.clearExisting) {
    console.log('🧹 [1/5] מנקה נתונים קיימים...');
    await EntryModel.deleteMany({});
    await EventModel.deleteMany({});
    await ParticipantModel.deleteMany({});
    await UserModel.deleteMany({});
    console.log('   ✅ מסד הנתונים נוקה בהצלחה.\n');
  }

  // --------------------------------------------------------------------------
  // 1. יצירת משתמשים (סופר-אדמין, מנהלים, סורקים)
  // --------------------------------------------------------------------------
  console.log('👥 [2/5] יוצר מנהלים וסורקים...');

  // סופר אדמין
  const superAdmin = new UserModel({
    username: (process.env.SUPER_ADMIN_USERNAME || 'admin').trim().toLowerCase(),
    password: superAdminPassword,
    name: process.env.SUPER_ADMIN_NAME || 'מנהל ראשי - משרד',
    email: 'oriori770@gmail.com',
    role: UserRole.SuperAdmin,
    isActive: true,
  });
  await superAdmin.save();

  // מנהלים
  const createdManagers: any[] = [];
  for (const m of MANAGERS_DATA) {
    const user = new UserModel({
      username: m.username,
      password: defaultPassword,
      name: m.name,
      email: `${m.username}@tishrei.org`,
      role: UserRole.Admin,
      isActive: true,
    });
    await user.save();
    createdManagers.push(user);
  }

  // סורקים
  const createdScanners: any[] = [];
  for (const s of SCANNERS_DATA) {
    const user = new UserModel({
      username: s.username,
      password: defaultPassword,
      name: s.name,
      email: `${s.username}@tishrei.org`,
      role: UserRole.Scanner,
      isActive: true,
    });
    await user.save();
    createdScanners.push(user);
  }

  console.log(`   ✅ נוצרו 1 מנהל ראשי, ${createdManagers.length} מנהלים, ו-${createdScanners.length} עמדות סריקה.\n`);

  // --------------------------------------------------------------------------
  // 2. יצירת משתתפות (Participants)
  // --------------------------------------------------------------------------
  console.log('🎫 [3/5] יוצר משתתפות (תיכונים, סמינרים, דירות, נשים)...');

  const now = new Date();
  const initialRegistrationDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // נרשמו לפני 14 יום
  const lateRegistrationDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);    // נרשמו אחרי יום כיפור (לפני 6 ימים)

  const participantsToInsert: any[] = [];
  const TOTAL_PARTICIPANTS = 70;

  for (let i = 0; i < TOTAL_PARTICIPANTS; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const city = CITIES[i % CITIES.length];
    const barcodeNum = 10001 + i;
    const phoneNum = `05${(i % 5) + 0}${7700000 + i}`;

    // חלוקת קבוצות
    let groupType: GroupType;
    let regDate: Date;

    if (i < 20) {
      groupType = GroupType.HighSchoolFullMonth;
      regDate = initialRegistrationDate;
    } else if (i < 35) {
      groupType = GroupType.SeminarFullMonth;
      regDate = initialRegistrationDate;
    } else if (i < 45) {
      groupType = GroupType.ApartmentPlusPrograms;
      regDate = initialRegistrationDate;
    } else if (i < 55) {
      groupType = GroupType.Women;
      regDate = initialRegistrationDate;
    } else if (i < 63) {
      // גל רישום לאחר יום כיפור
      groupType = GroupType.HighSchoolPartialAfterYom;
      regDate = lateRegistrationDate;
    } else {
      // גל רישום לאחר יום כיפור סמינר
      groupType = GroupType.SeminarAfterYom;
      regDate = lateRegistrationDate;
    }

    // אישור כניסה - כמעט כולן מאושרות (חוץ מ-2 לאימות)
    const isApproved = i !== 68 && i !== 69;

    participantsToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      name: firstName,
      family: lastName,
      barcode: barcodeNum.toString(),
      phone: phoneNum,
      city,
      groupType,
      isApproved,
      createdAt: regDate,
      updatedAt: regDate,
    });
  }

  // שימוש ב-insertMany ישיר עם הגדרת תאריכי createdAt מפורשים (חשוב לחישובי מטריקות נוכחות!)
  await ParticipantModel.collection.insertMany(participantsToInsert);
  console.log(`   ✅ נוצרו ${participantsToInsert.length} משתתפות עם ברקודים, טלפונים ייחודיים וסוגי קבוצות.\n`);

  // --------------------------------------------------------------------------
  // 3. יצירת אירועי תשרי (Events)
  // --------------------------------------------------------------------------
  console.log('📅 [4/5] יוצר אירועי תשרי (כינוסים, התוועדויות, שמחת בית השואבה, באנקעט)...');

  // הגדרת תאריכים יחסיים לזמן הנוכחי
  const eventsConfig = [
    {
      name: 'כינוס פתיחה חגיגי - אורחות המלך',
      date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000 + 19 * 3600 * 1000 + 30 * 60 * 1000), // לפני 11 ימים, 19:30
      description: 'כינוס פתיחה ענק לכל אורחות המלך באהל האירועים עם מופע מולטימדיה',
      isActive: true,
      attendanceRate: 0.84, // ~84% נוכחות
    },
    {
      name: 'התוועדות מרכזית - ו\' תשרי',
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000 + 20 * 3600 * 1000), // לפני 8 ימים, 20:00
      description: 'התוועדות שנתית לכבוד יום ההילולא של הרבנית חנה נ"ע',
      isActive: true,
      attendanceRate: 0.73, // ~73% נוכחות
    },
    {
      name: 'שיעור עיוני והכנה לקראת יום הקדוש',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 18 * 3600 * 1000 + 30 * 60 * 1000), // לפני 5 ימים, 18:30
      description: 'סדר ניגונים ושיעור הכנה לקראת יום הכיפורים באולם המרכזי',
      isActive: true,
      attendanceRate: 0.65, // ~65% נוכחות
    },
    {
      name: 'שמחת בית השואבה - ליל ראשון',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 21 * 3600 * 1000), // לפני 3 ימים, 21:00
      description: 'שמחה וריקודים לתוך הלילה בסוכה הגדולה בליווי תזמורת',
      isActive: true,
      attendanceRate: 0.89, // ~89% נוכחות
    },
    {
      name: 'שמחת בית השואבה המרכזית',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 20 * 3600 * 1000 + 30 * 60 * 1000), // לפני יום, 20:30
      description: 'המעמד המרכזי של שמחת בית השואבה בקינגסטון',
      isActive: true,
      attendanceRate: 0.94, // ~94% נוכחות (שיא!)
    },
    {
      name: 'כינוס צבאות השם וההגרלה הגדולה',
      date: new Date(now.getTime() - 3 * 3600 * 1000), // היום לפני 3 שעות
      description: 'כינוס מיוחד, הכרזת הפסוקים, סיכומי מבצעים וחלוקת פרסים',
      isActive: true,
      attendanceRate: 0.77, // ~77% נוכחות
    },
    {
      name: 'באנקעט סיום תשרי וחלוקת תעודות',
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 19 * 3600 * 1000 + 30 * 60 * 1000), // בעוד יומיים (עתידי)
      description: 'מעמד נעילת החודש השביעי - צאתכם לשלום והחלטות טובות לשנה כולה',
      isActive: true,
      attendanceRate: 0, // אירוע עתידי - 0 כניסות
    },
    {
      name: 'סדר חסידות מיוחד והתוועדות פרידה',
      date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 3600 * 1000), // בעוד 4 ימים (עתידי)
      description: 'סדר לימוד אחרון והתוועדות פרידה קודם הנסיעה לשדה התעופה',
      isActive: true,
      attendanceRate: 0, // אירוע עתידי - 0 כניסות
    },
  ];

  const createdEvents: any[] = [];
  for (const ec of eventsConfig) {
    const event = new EventModel({
      name: ec.name,
      date: ec.date,
      description: ec.description,
      isActive: ec.isActive,
    });
    await event.save();
    createdEvents.push({ ...event.toObject(), attendanceRate: ec.attendanceRate });
  }

  console.log(`   ✅ נוצרו ${createdEvents.length} אירועים (6 עבר/הווה, 2 עתידיים).\n`);

  // --------------------------------------------------------------------------
  // 4. יצירת כניסות (Entries) עם התפלגות זמנים לפי מודל 5-דקות
  // --------------------------------------------------------------------------
  console.log('🚪 [5/5] יוצר כניסות (Entries) מדומות עם התפלגות גלי כניסה (Buckets)...');

  const entriesToInsert: any[] = [];
  const scannerIds = createdScanners.map(s => s._id);

  for (const event of createdEvents) {
    if (event.attendanceRate === 0) continue; // אירועים עתידיים ללא כניסות

    // סינון משתתפות שנרשמו עד תאריך האירוע ומאושרות כניסה
    const eligibleParticipants = participantsToInsert.filter(
      p => p.createdAt <= event.date && p.isApproved
    );

    const targetEnteredCount = Math.round(eligibleParticipants.length * event.attendanceRate);

    // נבחר משתתפות אקראיות לכניסה מתוך הזכאיות
    const shuffled = [...eligibleParticipants].sort(() => 0.5 - Math.random());
    const attendees = shuffled.slice(0, targetEnteredCount);

    // התפלגות כניסה לאורך זמן סביב מועד האירוע (פעמון כניסות כל 5 דקות)
    // חלוקה ל-10 חלונות של 5 דקות: החל מ-30 דקות לפני האירוע ועד 20 דקות אחריו
    const distributionWeights = [3, 6, 12, 18, 26, 20, 14, 8, 4, 2]; // משקלים להתפלגות
    const totalWeight = distributionWeights.reduce((a, b) => a + b, 0);

    let attendeeIndex = 0;
    for (let bucketIdx = 0; bucketIdx < distributionWeights.length; bucketIdx++) {
      const bucketWeight = distributionWeights[bucketIdx];
      const countInBucket = Math.round((bucketWeight / totalWeight) * targetEnteredCount);

      // זמן הבאקט: (bucketIdx - 6) * 5 דקות יחסית לשעת האירוע
      const bucketOffsetMinutes = (bucketIdx - 6) * 5;
      const bucketBaseTime = new Date(event.date.getTime() + bucketOffsetMinutes * 60 * 1000);

      for (let k = 0; k < countInBucket && attendeeIndex < attendees.length; k++) {
        const participant = attendees[attendeeIndex++];
        const scannerId = scannerIds[Math.floor(Math.random() * scannerIds.length)];

        // פיזור עדין של שניות בתוך הבאקט של ה-5 דקות
        const randomSeconds = Math.floor(Math.random() * 280);
        const entryTime = new Date(bucketBaseTime.getTime() + randomSeconds * 1000);

        // שיטת כניסה: 85% ברקוד, 15% ידני
        const method = Math.random() < 0.85 ? 'barcode' : 'manual';

        entriesToInsert.push({
          participantId: participant._id,
          eventId: event._id,
          scannerId,
          entryTime,
          method,
          createdAt: entryTime,
          updatedAt: entryTime,
        });
      }
    }

    // אם נשארו עוד כמה עקב עיגול מספרים
    while (attendeeIndex < attendees.length) {
      const participant = attendees[attendeeIndex++];
      const scannerId = scannerIds[Math.floor(Math.random() * scannerIds.length)];
      const entryTime = new Date(event.date.getTime() + Math.floor(Math.random() * 15) * 60 * 1000);
      entriesToInsert.push({
        participantId: participant._id,
        eventId: event._id,
        scannerId,
        entryTime,
        method: 'barcode',
        createdAt: entryTime,
        updatedAt: entryTime,
      });
    }
  }

  // שמירת כל הכניסות ב-Bulk
  if (entriesToInsert.length > 0) {
    await EntryModel.collection.insertMany(entriesToInsert);
  }

  console.log(`   ✅ נוצרו ${entriesToInsert.length} כניסות מתועדות ומקושרות.\n`);

  // --------------------------------------------------------------------------
  // סיכום נתונים עבור דף המטריקות
  // --------------------------------------------------------------------------
  console.log('====================================================');
  console.log('📊 סיכום נתונים למערכת ולדף המטריקות:');
  console.log('====================================================');
  console.log(`👤 סך הכל משתמשים: ${1 + createdManagers.length + createdScanners.length}`);
  console.log(`🎫 סך הכל משתתפות רשומות: ${participantsToInsert.length}`);
  console.log(`📅 סך הכל אירועים: ${createdEvents.length}`);
  console.log(`🚪 סך הכל כניסות בפועל: ${entriesToInsert.length}\n`);

  console.log('📋 פירוט נוכחות ומטריקות לפי אירוע:');
  console.log('----------------------------------------------------------------------');
  console.log('שם האירוע                       | רשומות | נכנסו | אחוז נוכחות | סטטוס');
  console.log('----------------------------------------------------------------------');

  for (const event of createdEvents) {
    const regCount = participantsToInsert.filter(p => p.createdAt <= event.date).length;
    const enterCount = entriesToInsert.filter(e => e.eventId.toString() === event._id.toString()).length;
    const pct = regCount > 0 ? ((enterCount / regCount) * 100).toFixed(1) : '0.0';
    const status = event.date < now ? 'הסתיים' : 'עתידי';

    const paddedName = event.name.padEnd(32, ' ');
    const paddedReg = String(regCount).padStart(6, ' ');
    const paddedEnter = String(enterCount).padStart(5, ' ');
    const paddedPct = `${pct}%`.padStart(11, ' ');

    console.log(`${paddedName} | ${paddedReg} | ${paddedEnter} | ${paddedPct} | ${status}`);
  }
  console.log('----------------------------------------------------------------------\n');

  console.log('🔑 פרטי התחברות לדוגמה למערכת:');
  console.log('----------------------------------------------------------------------');
  console.log(`👑 מנהל ראשי (SuperAdmin):`);
  console.log(`   שם משתמש: admin`);
  console.log(`   סיסמה:    ${superAdminPassword}`);
  console.log('');
  console.log(`👩‍💼 מנהלות (Admins):`);
  console.log(`   שמות משתמש: witzenhandler, yarel, blili, benisti, lalum, lerner, achotshri`);
  console.log(`   סיסמה:      ${defaultPassword}`);
  console.log('');
  console.log(`📱 עמדות סריקה (Scanners):`);
  console.log(`   שמות משתמש: scanner, scanner_main, scanner_side, scanner_hall, scanner_mobile`);
  console.log(`   סיסמה:      ${defaultPassword}`);
  console.log('----------------------------------------------------------------------\n');
  console.log('🎉 תהליך ה-SEED הסתיים בהצלחה! עכשיו תוכל לראות מטריקות מלאות בדף המטריקות.\n');
}

/**
 * נקודת כניסה ראשית בהרצה ישירה דרך npm run seed
 */
async function main() {
  try {
    await connectDB();
    await seedData({ clearExisting: true });
  } catch (error) {
    console.error('❌ שגיאה בהרצת Seed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

// הרצה ישירה אם הקובץ נקרא ישירות
if (require.main === module) {
  main();
}

export default seedData;