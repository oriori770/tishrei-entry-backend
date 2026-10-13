import { UserModel } from '../models/User';
import { UserRole } from '../types';

export const bootstrapSuperAdmin = async (): Promise<void> => {
  try {
    const username = (process.env.SUPER_ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin770';
    const name = process.env.SUPER_ADMIN_NAME || 'מנהל ראשי';

    let superAdmin = await UserModel.findOne({ username });

    if (!superAdmin) {
      superAdmin = new UserModel({
        username,
        password,
        name,
        role: UserRole.SuperAdmin,
        isActive: true,
      });
      await superAdmin.save();
      console.log(`👑 מנהל ראשי נוצר בהצלחה (שם משתמש: "${username}")`);
    } else {
      let updated = false;

      // ודא שהתפקיד הוא מנהל ראשי
      if (superAdmin.role !== UserRole.SuperAdmin) {
        superAdmin.role = UserRole.SuperAdmin;
        updated = true;
      }

      // ודא שהמשתמש פעיל
      if (!superAdmin.isActive) {
        superAdmin.isActive = true;
        updated = true;
      }

      if (updated) {
        await superAdmin.save();
        console.log(`👑 משתמש ראשי "${username}" עודכן לתפקיד SuperAdmin וסטטוס פעיל`);
      }
    }
  } catch (error) {
    console.error('❌ שגיאה באתחול מנהל ראשי:', error);
  }
};
