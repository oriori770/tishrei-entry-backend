import { connectDB, disconnectDB } from '../config/database';
import { UserModel } from '../models/User';
import { ParticipantModel } from '../models/Participant';
import { EventModel } from '../models/Event';
import { UserRole, GroupType } from '../types';

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - be careful in production!)
    // await UserModel.deleteMany({});
    // await ParticipantModel.deleteMany({});
    // await EventModel.deleteMany({});
    
    // Create admin user
    const adminExists = await UserModel.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminUser = new UserModel({
        username: 'admin',
        password: 'admin770',
        name: 'מנהל ראשי',
        role: UserRole.Admin,
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Create scanner user
    const scannerExists = await UserModel.findOne({ username: 'scanner' });
    if (!scannerExists) {
      const scannerUser = new UserModel({
        username: 'scanner',
        password: 'scanner770',
        name: 'סורק ראשי',
        role: UserRole.Scanner,
        isActive: true
      });
      await scannerUser.save();
      console.log('✅ Scanner user created');
    } else {
      console.log('ℹ️ Scanner user already exists');
    }
    
    // Create sample participants
    const participants = [
      {
        name: 'ישראל',
        family: 'כהן',
        barcode: '123456789',
        phone: '050-1234567',
        email: 'israel.cohen@example.com',
        city: 'ירושלים',
        schoolClass: 'י"ב',
        branch: 'סניף מרכז',
        groupType: GroupType.HighSchool
      },
      {
        name: 'שרה',
        family: 'לוי',
        barcode: '987654321',
        phone: '052-7654321',
        email: 'sarah.levi@example.com',
        city: 'תל אביב',
        schoolClass: 'י"א',
        branch: 'סניף צפון',
        groupType: GroupType.HighSchool
      },
      {
        name: 'משה',
        family: 'גולדברג',
        barcode: '456789123',
        phone: '054-9876543',
        email: 'moshe.goldberg@example.com',
        city: 'חיפה',
        schoolClass: 'י"ג',
        branch: 'סניף דרום',
        groupType: GroupType.Seminar
      },
      {
        name: 'רחל',
        family: 'ברק',
        barcode: '789123456',
        phone: '053-4567890',
        email: 'rachel.barak@example.com',
        city: 'באר שבע',
        schoolClass: 'י"ב',
        branch: 'סניף מרכז',
        groupType: GroupType.Women
      },
      {
        name: 'דוד',
        family: 'רוזן',
        barcode: '321654987',
        phone: '055-3216549',
        email: 'david.rozen@example.com',
        city: 'אשדוד',
        schoolClass: 'י"א',
        branch: 'סניף דרום',
        groupType: GroupType.HighSchool
      }
    ];

    
    // function generateParticipants(count: number) {
    //   const firstNames = ["שרה", "רחל", "מרים", "יעל", "חנה", "אלישבע", "דבורה", "אסתר", "נעמי", "אביגיל"];
    //   const lastNames = ["כהן", "לוי", "מizrahi", "גולדברג", "ברק", "פרידמן", "רוזן", "אלון", "קפלן", "שמש"];
    //   const cities = ["ירושלים", "תל אביב", "חיפה", "באר שבע", "אשדוד", "נתניה", "פתח תקווה", "עפולה", "טבריה", "רמת גן"];
    //   const branches = ["סניף מרכז", "סניף צפון", "סניף דרום", "סניף מזרח", "סניף מערב"];
    //   const classes = ["י'", "י\"א", "י\"ב", "י\"ג"];
    //   const groups = [GroupType.HighSchool,  GroupType.Seminar, GroupType.Women];
    
    //   const participants = Array.from({ length: count }, (_, i) => {
    //     const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    //     const family = lastNames[Math.floor(Math.random() * lastNames.length)];
    //     const city = cities[Math.floor(Math.random() * cities.length)];
    //     const branch = branches[Math.floor(Math.random() * branches.length)];
    //     const schoolClass = classes[Math.floor(Math.random() * classes.length)];
    //     const groupType = groups[Math.floor(Math.random() * groups.length)];
    
    //     const barcode = (Math.floor(100000000 + Math.random() * 900000000)).toString();
    //     const phone = `05${Math.floor(Math.random() * 5)}-${Math.floor(1000000 + Math.random() * 9000000)}`;
    //     const email = `${transliterate(name)}.${transliterate(family)}${i}@example.com`.toLowerCase();
    
    //     return {
    //       name,
    //       family,
    //       barcode,
    //       phone,
    //       email,
    //       city,
    //       schoolClass,
    //       branch,
    //       groupType
    //     };
    //   });
    
    //   return participants;
    // }
    
    // // פונקציה פשוטה להמרת עברית ללטינית למייל
    // function transliterate(text: string) {
    //   const map: Record<string, string> = {
    //     "א": "a", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z", "ח": "ch", "ט": "t",
    //     "י": "y", "כ": "k", "ל": "l", "מ": "m", "נ": "n", "ס": "s", "ע": "a", "פ": "p", "צ": "tz",
    //     "ק": "k", "ר": "r", "ש": "sh", "ת": "t", " ": ""
    //   };
    //   return text.split("").map(c => map[c] || c).join("");
    // }
    
    // // שימוש:
    // const participants = generateParticipants(400);
    
    
    for (const participantData of participants) {
      const exists = await ParticipantModel.findOne({ barcode: participantData.barcode });
      if (!exists) {
        const participant = new ParticipantModel(participantData);
        await participant.save();
        console.log(`✅ Participant ${participantData.name} ${participantData.family} created`);
      } else {
        console.log(`ℹ️ Participant ${participantData.name} ${participantData.family} already exists`);
      }
    }
    
    // Create sample events
    const events = [
      {
        name: 'כנס ראש השנה',
        date: new Date('2024-10-02T18:00:00Z'),
        description: 'כנס מיוחד לראש השנה עם הרצאות ופעילויות',
        isActive: true
      },
      {
        name: 'סדנת ימים נוראים',
        date: new Date('2024-10-05T19:00:00Z'),
        description: 'סדנה מיוחדת לימים נוראים',
        isActive: true
      },
      {
        name: 'אירוע סוכות',
        date: new Date('2024-10-15T17:00:00Z'),
        description: 'אירוע חגיגי בסוכות',
        isActive: false
      }
    ];
    
    for (const eventData of events) {
      const exists = await EventModel.findOne({ name: eventData.name });
      if (!exists) {
        const event = new EventModel(eventData);
        await event.save();
        console.log(`✅ Event "${eventData.name}" created`);
      } else {
        console.log(`ℹ️ Event "${eventData.name}" already exists`);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('👑 Admin: username=admin, password=admin123');
    console.log('📱 Scanner: username=scanner, password=scanner123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

export default seedData; 