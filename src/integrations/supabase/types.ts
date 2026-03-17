export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      carrier_availability: {
        Row: {
          available_until: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          destination_address: string | null
          destination_city: string | null
          destination_lat: number | null
          destination_lng: number | null
          id: string
          is_online: boolean
          last_location_update: string | null
          max_detour_km: number | null
          max_item_size: Database["public"]["Enums"]["item_size"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_until?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_address?: string | null
          destination_city?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          is_online?: boolean
          last_location_update?: string | null
          max_detour_km?: number | null
          max_item_size?: Database["public"]["Enums"]["item_size"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_until?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_address?: string | null
          destination_city?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          is_online?: boolean
          last_location_update?: string | null
          max_detour_km?: number | null
          max_item_size?: Database["public"]["Enums"]["item_size"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          accepted_at: string | null
          buyer_rated: boolean | null
          delivered_at: string | null
          delivery_deadline: string | null
          drop_otp: string | null
          escrow_id: string | null
          id: string
          partner_id: string | null
          partner_rated: boolean | null
          picked_up_at: string | null
          pickup_deadline: string | null
          pickup_otp: string | null
          purchase_proof_uploaded_at: string | null
          purchase_proof_url: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
        }
        Insert: {
          accepted_at?: string | null
          buyer_rated?: boolean | null
          delivered_at?: string | null
          delivery_deadline?: string | null
          drop_otp?: string | null
          escrow_id?: string | null
          id?: string
          partner_id?: string | null
          partner_rated?: boolean | null
          picked_up_at?: string | null
          pickup_deadline?: string | null
          pickup_otp?: string | null
          purchase_proof_uploaded_at?: string | null
          purchase_proof_url?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Update: {
          accepted_at?: string | null
          buyer_rated?: boolean | null
          delivered_at?: string | null
          delivery_deadline?: string | null
          drop_otp?: string | null
          escrow_id?: string | null
          id?: string
          partner_id?: string | null
          partner_rated?: boolean | null
          picked_up_at?: string | null
          pickup_deadline?: string | null
          pickup_otp?: string | null
          purchase_proof_uploaded_at?: string | null
          purchase_proof_url?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Relationships: []
      }
      delivery_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_by: string | null
          carrier_id: string | null
          carrier_rated: boolean | null
          created_at: string
          delivered_at: string | null
          drop_address: string
          drop_city: string
          drop_instructions: string | null
          drop_otp: string | null
          drop_phone: string
          drop_postal_code: string | null
          escrow_id: string | null
          estimated_fare: number | null
          final_fare: number | null
          id: string
          item_description: string
          item_size: Database["public"]["Enums"]["item_size"]
          item_value: number | null
          item_weight_kg: number | null
          matched_at: string | null
          partner_id: string | null
          picked_up_at: string | null
          pickup_address: string
          pickup_city: string
          pickup_instructions: string | null
          pickup_otp: string | null
          pickup_phone: string
          pickup_postal_code: string | null
          platform_fee: number | null
          preferred_date: string | null
          purchase_proof_uploaded_at: string | null
          purchase_proof_url: string | null
          sender_rated: boolean | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          carrier_id?: string | null
          carrier_rated?: boolean | null
          created_at?: string
          delivered_at?: string | null
          drop_address: string
          drop_city: string
          drop_instructions?: string | null
          drop_otp?: string | null
          drop_phone: string
          drop_postal_code?: string | null
          escrow_id?: string | null
          estimated_fare?: number | null
          final_fare?: number | null
          id?: string
          item_description: string
          item_size?: Database["public"]["Enums"]["item_size"]
          item_value?: number | null
          item_weight_kg?: number | null
          matched_at?: string | null
          partner_id?: string | null
          picked_up_at?: string | null
          pickup_address: string
          pickup_city: string
          pickup_instructions?: string | null
          pickup_otp?: string | null
          pickup_phone: string
          pickup_postal_code?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          purchase_proof_uploaded_at?: string | null
          purchase_proof_url?: string | null
          sender_rated?: boolean | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          carrier_id?: string | null
          carrier_rated?: boolean | null
          created_at?: string
          delivered_at?: string | null
          drop_address?: string
          drop_city?: string
          drop_instructions?: string | null
          drop_otp?: string | null
          drop_phone?: string
          drop_postal_code?: string | null
          escrow_id?: string | null
          estimated_fare?: number | null
          final_fare?: number | null
          id?: string
          item_description?: string
          item_size?: Database["public"]["Enums"]["item_size"]
          item_value?: number | null
          item_weight_kg?: number | null
          matched_at?: string | null
          partner_id?: string | null
          picked_up_at?: string | null
          pickup_address?: string
          pickup_city?: string
          pickup_instructions?: string | null
          pickup_otp?: string | null
          pickup_phone?: string
          pickup_postal_code?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          purchase_proof_uploaded_at?: string | null
          purchase_proof_url?: string | null
          sender_rated?: boolean | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          buyer_id: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          created_at: string
          drop_address: string | null
          drop_city: string | null
          drop_location: unknown | null
          drop_notes: string | null
          drop_postal_code: string | null
          estimated_price: number | null
          expires_at: string | null
          id: string
          is_phone_visible: boolean | null
          item_description: string | null
          item_name: string
          item_size: Database["public"]["Enums"]["item_size"] | null
          item_value: number | null
          pickup_address: string | null
          pickup_city: string | null
          pickup_location: unknown | null
          pickup_notes: string | null
          pickup_postal_code: string | null
          platform_fee: number | null
          preferred_date: string | null
          reward: number | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          total_price: number | null
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
          weight: number | null
        }
        Insert: {
          buyer_id?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          drop_address?: string | null
          drop_city?: string | null
          drop_location?: unknown | null
          drop_notes?: string | null
          drop_postal_code?: string | null
          estimated_price?: number | null
          expires_at?: string | null
          id?: string
          is_phone_visible?: boolean | null
          item_description?: string | null
          item_name: string
          item_size?: Database["public"]["Enums"]["item_size"] | null
          item_value?: number | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_location?: unknown | null
          pickup_notes?: string | null
          pickup_postal_code?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          reward?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          total_price?: number | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          weight?: number | null
        }
        Update: {
          buyer_id?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          drop_address?: string | null
          drop_city?: string | null
          drop_location?: unknown | null
          drop_notes?: string | null
          drop_postal_code?: string | null
          estimated_price?: number | null
          expires_at?: string | null
          id?: string
          is_phone_visible?: boolean | null
          item_description?: string | null
          item_name?: string
          item_size?: Database["public"]["Enums"]["item_size"] | null
          item_value?: number | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_location?: unknown | null
          pickup_notes?: string | null
          pickup_postal_code?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          reward?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          total_price?: number | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          weight?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          against_user_id: string
          created_at: string
          delivery_request_id: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          raised_by: string
          reason: string
          resolution: Database["public"]["Enums"]["dispute_resolution"] | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          against_user_id: string
          created_at?: string
          delivery_request_id: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          raised_by: string
          reason: string
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          against_user_id?: string
          created_at?: string
          delivery_request_id?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          raised_by?: string
          reason?: string
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: []
      }
      escrow_holds: {
        Row: {
          amount: number
          carrier_id: string | null
          carrier_payout: number
          created_at: string
          currency: string
          delivery_request_id: string
          held_at: string
          id: string
          platform_fee: number
          refunded_at: string | null
          released_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          carrier_id?: string | null
          carrier_payout?: number
          created_at?: string
          currency?: string
          delivery_request_id: string
          held_at?: string
          id?: string
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          carrier_id?: string | null
          carrier_payout?: number
          created_at?: string
          currency?: string
          delivery_request_id?: string
          held_at?: string
          id?: string
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_holds_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: true
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          delivery_request_id: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          delivery_request_id: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          delivery_request_id?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          delivery_request_id: string | null
          heading: number | null
          id: string
<<<<<<< HEAD
          location: unknown | null
=======
          latitude: number
          location: unknown | null
          longitude: number
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
          is_online: boolean | null
          max_detour_km: number | null
          partner_id: string
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          delivery_request_id?: string | null
          heading?: number | null
          id?: string
<<<<<<< HEAD
          location?: unknown | null
=======
          latitude?: number
          location?: unknown | null
          longitude?: number
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
          is_online?: boolean | null
          max_detour_km?: number | null
          partner_id?: string
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          delivery_request_id?: string | null
          heading?: number | null
          id?: string
<<<<<<< HEAD
          location?: unknown | null
=======
          latitude?: number
          location?: unknown | null
          longitude?: number
>>>>>>> 3319ff3825dfb548e880d1d59cee4e3076f86c53
          is_online?: boolean | null
          max_detour_km?: number | null
          partner_id?: string
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_locations_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_trips: {
        Row: {
          created_at: string
          departure_date: string
          departure_time: string | null
          from_city: string
          id: string
          is_active: boolean | null
          max_item_size: string | null
          max_item_value: number | null
          notes: string | null
          partner_id: string
          to_city: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          departure_date: string
          departure_time?: string | null
          from_city: string
          id?: string
          is_active?: boolean | null
          max_item_size?: string | null
          max_item_value?: number | null
          notes?: string | null
          partner_id: string
          to_city: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          from_city?: string
          id?: string
          is_active?: boolean | null
          max_item_size?: string | null
          max_item_value?: number | null
          notes?: string | null
          partner_id?: string
          to_city?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          delivery_instructions: string | null
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          delivery_instructions?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          delivery_instructions?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      promo_usage: {
        Row: {
          delivery_request_id: string | null
          discount_applied: number
          id: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          delivery_request_id?: string | null
          discount_applied: number
          id?: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          delivery_request_id?: string | null
          discount_applied?: number
          id?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_usage_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          delivery_request_id: string
          id: string
          rated_id: string
          rater_id: string
          rater_role: string
          rating: number
          review: string | null
        }
        Insert: {
          created_at?: string
          delivery_request_id: string
          id?: string
          rated_id: string
          rater_id: string
          rater_role: string
          rating: number
          review?: string | null
        }
        Update: {
          created_at?: string
          delivery_request_id?: string
          id?: string
          rated_id?: string
          rater_id?: string
          rater_role?: string
          rating?: number
          review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          instructions: string | null
          is_default: boolean | null
          label: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          label: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          label?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          delivery_request_id: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          delivery_request_id?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          delivery_request_id?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_staff_reply: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          delivery_request_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          delivery_request_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          delivery_request_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_scores: {
        Row: {
          avg_rating_as_carrier: number | null
          avg_rating_as_sender: number | null
          cancellation_penalty_count: number | null
          created_at: string
          flags_received: number | null
          id: string
          last_calculated_at: string | null
          last_cancellation_at: string | null
          max_allowed_item_value: number | null
          score: number
          total_as_carrier: number | null
          total_as_sender: number | null
          total_deliveries_cancelled: number | null
          total_deliveries_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_rating_as_carrier?: number | null
          avg_rating_as_sender?: number | null
          cancellation_penalty_count?: number | null
          created_at?: string
          flags_received?: number | null
          id?: string
          last_calculated_at?: string | null
          last_cancellation_at?: string | null
          max_allowed_item_value?: number | null
          score?: number
          total_as_carrier?: number | null
          total_as_sender?: number | null
          total_deliveries_cancelled?: number | null
          total_deliveries_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_rating_as_carrier?: number | null
          avg_rating_as_sender?: number | null
          cancellation_penalty_count?: number | null
          created_at?: string
          flags_received?: number | null
          id?: string
          last_calculated_at?: string | null
          last_cancellation_at?: string | null
          max_allowed_item_value?: number | null
          score?: number
          total_as_carrier?: number | null
          total_as_sender?: number | null
          total_deliveries_cancelled?: number | null
          total_deliveries_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          id: string
          skipped_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          skipped_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          skipped_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          delivery_instructions: string | null
          email: string
          id: string
          is_verified: boolean | null
          name: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          delivery_instructions?: string | null
          email: string
          id: string
          is_verified?: boolean | null
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          delivery_instructions?: string | null
          email?: string
          id?: string
          is_verified?: boolean | null
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "partner" | "buyer"
      delivery_status:
        | "pending"
        | "matched"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      dispute_resolution:
        | "refund"
        | "partial_refund"
        | "no_action"
        | "account_warning"
        | "account_suspended"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      escrow_status: "held" | "released" | "refunded" | "disputed"
      item_size: "small" | "medium" | "large" | "extra_large"
      ticket_category:
        | "payment"
        | "delivery"
        | "account"
        | "partner"
        | "technical"
        | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_response"
        | "resolved"
        | "closed"
      transaction_status: "pending" | "completed" | "failed" | "refunded"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "escrow_hold"
        | "escrow_release"
        | "escrow_refund"
        | "platform_fee"
        | "carrier_payout"
      urgency_level: "standard" | "express" | "urgent"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "partner", "buyer"],
      delivery_status: [
        "pending",
        "matched",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      dispute_resolution: [
        "refund",
        "partial_refund",
        "no_action",
        "account_warning",
        "account_suspended",
      ],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      escrow_status: ["held", "released", "refunded", "disputed"],
      item_size: ["small", "medium", "large", "extra_large"],
      ticket_category: [
        "payment",
        "delivery",
        "account",
        "partner",
        "technical",
        "other",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_response",
        "resolved",
        "closed",
      ],
      transaction_status: ["pending", "completed", "failed", "refunded"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "escrow_hold",
        "escrow_release",
        "escrow_refund",
        "platform_fee",
        "carrier_payout",
      ],
      urgency_level: ["standard", "express", "urgent"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
