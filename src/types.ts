export type User = {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  phone_number?: string | null;
  description?: string | null;
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
  price: string; 
  service_type:
    | "1on1"
    | "group"
    | "pre-recorded"
    | "study material"
    | "live seminar/lesson"
    | string;
  attendee_limit: string; // esim "1" tai "unlimited"
  service_category: string; // esim "cooking lessons"
  image: string | null;
  language?: string | null;
  created: string;
  updated: string;
};

/** Auth-vaste signup + login -endpointeista */
export type AuthResponse = {
  id: string;
  firstname: string;
  surname: string;
  userToken: string;
};

/** Profiilin hakeminen /users/:id -reitistä */
export type UserProfile = {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  phone_number?: string | null;
  description?: string | null;
  profile_image: string;
  user_role: string;
};

/** Kurssipalautteet (listing_rating_entries) */
export type ListingRatingEntry = {
  id: string;
  listing_id: string;
  user_id: string;
  stars: number;
  feedback: string | null;
  public: boolean;
  created: string;
};

/** Kurssipalautteen yhteenveto (listing_ratings-taulu) */
export type ListingRatingSummary = {
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
  average: number | null;
};

/** Käyttäjäpalautteet (user_rating_entries) */
export type UserRatingEntry = {
  id: string;
  user_id: string; // käyttäjä jota arvioidaan
  reviewer_id: string;
  stars: number;
  feedback: string | null;
  public: boolean;
  created: string;
};

/** Käyttäjäpalautteen yhteenveto (user_ratings-taulu) */
export type UserRatingSummary = {
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
  average: number | null;
};

/** Raporttitaulu reports */
export type Report = {
  id: string;
  reporter_id: string;
  target_type: "service" | "user";
  reported_service_id: string | null;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: "pending" | "in_progress" | "resolved" | string;
  resolution_notes: string | null;
  created: string;
  updated: string;
  resolved_at: string | null;
};