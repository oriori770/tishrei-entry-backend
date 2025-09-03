// טיפוסים עבור השרת - מערכת ניהול רישום וכניסות

export enum GroupType {
  HighSchoolFullMonth = "תיכון תכניות חודש מלא",
  HighSchoolPartialAfterYom = "חודש חלקי (אחרי יוכ\"פ)",
  ApartmentPlusPrograms = "דירה + תכניות",
  SeminarFullMonth = "סמינר - תכניות חודש מלא",
  SeminarAfterYom = "סמינר - תכניות אחרי יוכ\"פ",
  Women = "נשים",  // הוספנו כאן
}

export enum UserRole {
  Admin = "admin",
  Scanner = "scanner"
}

export interface Participant {
  _id?: string;
  name: string;
  family: string;
  barcode: string;
  phone: string;
  email: string;
  city: string;
  schoolClass: string;
  branch: string;
  groupType: GroupType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Event {
  _id?: string;
  name: string;
  date: Date;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Entry {
  _id?: string;
  participantId: string;
  eventId: string;
  scannerId: string;
  entryTime: Date;
  method: 'barcode' | 'manual';
  createdAt?: Date;
}

export interface EntryWithDetails extends Entry {
  participant: Participant;
  event: Event;
  scanner: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 