import { connectDB, disconnectDB } from '../config/database';
import { UserModel } from '../models/User';
import { ParticipantModel } from '../models/Participant';
import { EventModel } from '../models/Event';
import { UserRole, GroupType } from '../types';

// פונקציה עיקרית שמבצעת את ה-seeding
/*const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - be careful in production!)
    await UserModel.deleteMany({});
    await ParticipantModel.deleteMany({});
    await EventModel.deleteMany({});

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
};*/


const usersToSeed = [
  {
    username: 'admin',
    password: 'admin770',
    name: 'מנהל ראשי',
    role: UserRole.Admin,
    isActive: true,
  },
  {
    username: 'scanner',
    password: 'scanner770',
    name: 'סורק ראשי',
    role: UserRole.Scanner,
    isActive: true,
  },
  {
    username: 'guest',
    password: 'guest123',
    name: 'משתמש אורח',
    role: UserRole.Viewer,
    isActive: true,
  },
];

// פונקציה עיקרית שמבצעת את ה-seeding
const seedData = async () => {
  try {
    console.log('🌱 Starting user seeding...');

    await connectDB();

    for (const userData of usersToSeed) {
      const exists = await UserModel.findOne({ username: userData.username });
      if (exists) {
        console.log(`ℹ️ User "${userData.username}" already exists, skipping`);
      } else {
        const newUser = new UserModel(userData);
        await newUser.save();
        console.log(`✅ User "${userData.username}" created`);
      }
    }

    console.log('🎉 User seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};



// הרצה ישירה דרך node
if (require.main === module) {
  seedData();
}

export default seedData;