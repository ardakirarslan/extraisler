export type UserRole = 'worker' | 'employer';

export type AvailabilityStatus = 'available' | 'unavailable';

export type JobDurationType = 'daily' | 'seasonal';

export type JobPostStatus = 'open' | 'filled' | 'closed' | 'cancelled';

export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'auto_cancelled'
  | 'completed';

export type ServiceRequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceOfferStatus = 'pending' | 'accepted' | 'rejected';

export type ServicePhotoType = 'before' | 'after';

export type RaterRole = 'worker' | 'employer' | 'master' | 'requester';

export type JobInviteStatus = 'pending' | 'accepted' | 'declined';

// NOTE: these are `type` aliases, not `interface`s, on purpose. An `interface`
// does not get an implicit string index signature, so it fails the
// `extends Record<string, unknown>` check `@supabase/supabase-js` runs on
// every `Row`/`Insert`/`Update` shape — that silently collapses the whole
// `Database` type to `never` and breaks every `.from(...)` call's inference.

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: UserRole | null;
  created_at: string;
};

export type EmployerProfile = {
  user_id: string;
  business_name: string | null;
  location: string | null;
  description: string | null;
};

export type WorkerProfile = {
  user_id: string;
  skills: string[];
  availability_status: AvailabilityStatus | null;
  available_from: string | null;
  available_to: string | null;
  bio: string | null;
  district: string | null;
  languages: string[];
};

export type MasterProfile = {
  user_id: string;
  skills: string[];
  bio: string | null;
};

export type JobPost = {
  id: string;
  employer_id: string;
  title: string;
  position: string | null;
  date: string;
  needed_worker_count: number;
  daily_wage: number;
  description: string | null;
  status: JobPostStatus;
  duration_type: JobDurationType;
  cover_photo_url: string | null;
  is_urgent: boolean;
  district: string | null;
  required_languages: string[];
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  job_post_id: string;
  worker_id: string;
  status: ApplicationStatus;
  applied_at: string;
  completed_at: string | null;
  team_size: number;
  team_members: string[];
};

export type FavoriteWorker = {
  employer_id: string;
  worker_id: string;
  created_at: string;
};

export type JobInvite = {
  id: string;
  job_post_id: string;
  employer_id: string;
  worker_id: string;
  status: JobInviteStatus;
  created_at: string;
};

export type PushToken = {
  user_id: string;
  token: string;
  updated_at: string;
};

export type WorkerDocument = {
  id: string;
  worker_id: string;
  name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
};

export type SavedJob = {
  worker_id: string;
  job_post_id: string;
  created_at: string;
};

export type ServiceRequest = {
  id: string;
  requester_id: string;
  category: string;
  title: string;
  description: string | null;
  price: number | null;
  is_urgent: boolean;
  needed_date: string | null;
  location: string | null;
  status: ServiceRequestStatus;
};

export type ServiceOffer = {
  id: string;
  request_id: string;
  master_id: string;
  offered_price: number;
  message: string | null;
  status: ServiceOfferStatus;
};

export type ServicePhoto = {
  id: string;
  request_id: string;
  photo_url: string;
  type: ServicePhotoType;
  uploaded_by: string;
};

export type Rating = {
  id: string;
  application_id: string | null;
  service_request_id: string | null;
  rater_id: string;
  rated_id: string;
  rater_role: RaterRole;
  score: number;
  comment: string | null;
};

export type Conversation = {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  last_message_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export type PublicUserInfo = {
  id: string;
  name: string | null;
  role: UserRole | null;
  created_at: string;
};

/**
 * Hand-written Supabase Database type. `Insert`/`Update` shapes are spelled
 * out explicitly (not derived via `Partial<Row>`) because `@supabase/supabase-js`
 * cannot infer `.insert()`/`.upsert()` argument types through a mapped-type
 * `Insert`/`Update`. Once the real schema is exported with
 * `supabase gen types typescript`, replace this file with the generated one.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: { id: string; email?: string | null; phone?: string | null; name?: string | null; role?: UserRole | null; created_at?: string };
        Update: { email?: string | null; phone?: string | null; name?: string | null; role?: UserRole | null };
        Relationships: [];
      };
      employer_profiles: {
        Row: EmployerProfile;
        Insert: { user_id: string; business_name?: string | null; location?: string | null; description?: string | null };
        Update: { business_name?: string | null; location?: string | null; description?: string | null };
        Relationships: [];
      };
      worker_profiles: {
        Row: WorkerProfile;
        Insert: {
          user_id: string;
          skills?: string[];
          availability_status?: AvailabilityStatus | null;
          available_from?: string | null;
          available_to?: string | null;
          bio?: string | null;
          district?: string | null;
          languages?: string[];
        };
        Update: {
          skills?: string[];
          availability_status?: AvailabilityStatus | null;
          available_from?: string | null;
          available_to?: string | null;
          bio?: string | null;
          district?: string | null;
          languages?: string[];
        };
        Relationships: [];
      };
      master_profiles: {
        Row: MasterProfile;
        Insert: { user_id: string; skills?: string[]; bio?: string | null };
        Update: { skills?: string[]; bio?: string | null };
        Relationships: [];
      };
      job_posts: {
        Row: JobPost;
        Insert: {
          id?: string;
          employer_id: string;
          title: string;
          position?: string | null;
          date: string;
          needed_worker_count: number;
          daily_wage: number;
          description?: string | null;
          status?: JobPostStatus;
          duration_type: JobDurationType;
          cover_photo_url?: string | null;
          is_urgent?: boolean;
          district?: string | null;
          required_languages?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          position?: string | null;
          date?: string;
          needed_worker_count?: number;
          daily_wage?: number;
          description?: string | null;
          status?: JobPostStatus;
          duration_type?: JobDurationType;
          cover_photo_url?: string | null;
          is_urgent?: boolean;
          district?: string | null;
          required_languages?: string[];
        };
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: {
          id?: string;
          job_post_id: string;
          worker_id: string;
          status?: ApplicationStatus;
          applied_at?: string;
          team_size?: number;
          team_members?: string[];
        };
        Update: { status?: ApplicationStatus; completed_at?: string | null };
        Relationships: [];
      };
      favorite_workers: {
        Row: FavoriteWorker;
        Insert: { employer_id: string; worker_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      job_invites: {
        Row: JobInvite;
        Insert: {
          id?: string;
          job_post_id: string;
          employer_id: string;
          worker_id: string;
          status?: JobInviteStatus;
          created_at?: string;
        };
        Update: { status?: JobInviteStatus };
        Relationships: [];
      };
      push_tokens: {
        Row: PushToken;
        Insert: { user_id: string; token: string; updated_at?: string };
        Update: { token?: string; updated_at?: string };
        Relationships: [];
      };
      worker_documents: {
        Row: WorkerDocument;
        Insert: { id?: string; worker_id: string; name: string; file_url: string; file_size?: number | null; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      saved_jobs: {
        Row: SavedJob;
        Insert: { worker_id: string; job_post_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      service_requests: {
        Row: ServiceRequest;
        Insert: {
          id?: string;
          requester_id: string;
          category: string;
          title: string;
          description?: string | null;
          price?: number | null;
          is_urgent?: boolean;
          needed_date?: string | null;
          location?: string | null;
          status?: ServiceRequestStatus;
        };
        Update: {
          category?: string;
          title?: string;
          description?: string | null;
          price?: number | null;
          is_urgent?: boolean;
          needed_date?: string | null;
          location?: string | null;
          status?: ServiceRequestStatus;
        };
        Relationships: [];
      };
      service_offers: {
        Row: ServiceOffer;
        Insert: { id?: string; request_id: string; master_id: string; offered_price: number; message?: string | null; status?: ServiceOfferStatus };
        Update: { offered_price?: number; message?: string | null; status?: ServiceOfferStatus };
        Relationships: [];
      };
      service_photos: {
        Row: ServicePhoto;
        Insert: { id?: string; request_id: string; photo_url: string; type: ServicePhotoType; uploaded_by: string };
        Update: { photo_url?: string; type?: ServicePhotoType };
        Relationships: [];
      };
      ratings: {
        Row: Rating;
        Insert: {
          id?: string;
          application_id?: string | null;
          service_request_id?: string | null;
          rater_id: string;
          rated_id: string;
          rater_role: RaterRole;
          score: number;
          comment?: string | null;
        };
        Update: { score?: number; comment?: string | null };
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: { id?: string; participant_1_id: string; participant_2_id: string; created_at?: string; last_message_at?: string | null };
        Update: { last_message_at?: string | null };
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: { id?: string; conversation_id: string; sender_id: string; content: string; created_at?: string; read_at?: string | null };
        Update: { read_at?: string | null };
        Relationships: [];
      };
    };
    Views: {
      public_user_info: { Row: PublicUserInfo; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
