export type User = {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  phone_number?: string;
  description?: string;
  hashed_password?: string;
  user_role: "default" | "admin" | string;
  profile_image?: string;
  created: string; // ISO
  updated: string; // ISO
};

export type ListedService = {
  id: string;
  name: string;
  description: string;
  datetime: string | null; // ISO tai null
  location: string | null;
  service_provider: string;
  listing_creator: string;
  price: string; // esim "€29"
  service_type: "1on1" | "group" | "pre-recorded" | "study material" | string;
  attendee_limit: string; // esim "1" tai "unlimited"
  service_category: string; // esim "music" | "pottery"
  image: string | null;
  created: string;
  updated: string;
};

export type LoginResponse = { token: string; email: string };
