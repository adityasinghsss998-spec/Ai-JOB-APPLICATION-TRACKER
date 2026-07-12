export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      job_applications: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          id: string
          job_url: string | null
          location: string | null
          notes: string | null
          role: string
          salary_range: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          role: string
          salary_range?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          role?: string
          salary_range?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          phone: string | null // Added phone number
          location: string | null // Added location
          summary: string | null // Added professional summary
          skills: string[] | null // Added skills array
          current_company: string | null // Added current company
          current_job_title: string | null // Added current job title
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          phone?: string | null
          location?: string | null
          summary?: string | null
          skills?: string[] | null
          current_company?: string | null
          current_job_title?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          phone?: string | null
          location?: string | null
          summary?: string | null
          skills?: string[] | null
          current_company?: string | null
          current_job_title?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          created_at: string
          file_name: string
          file_path: string
          file_url: string
          parsed_data: Json | null // Store parsed JSON data
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_url: string
          parsed_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_url?: string
          parsed_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "interviewing"
        | "offer"
        | "rejected"
        | "withdrawn"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"]
