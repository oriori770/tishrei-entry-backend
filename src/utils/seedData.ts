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
        password: 'admin123',
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
        password: 'scanner123',
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