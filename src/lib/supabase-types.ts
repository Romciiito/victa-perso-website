/**
 * Hand-rolled types for the 8 Supabase tables in `supabase/migrations/001_initial_schema.sql`.
 * Replace with `supabase gen types typescript --project-id <id> --schema public > src/lib/supabase-types.gen.ts`
 * post-launch when CLI access is wired (architecture.md §5.4 OQ note).
 *
 * AR-21..AR-24: anon role has zero policies; all writes via service key.
 *
 * NOTE: Insert types are written as concrete object literals (not `Omit<Row, ...>`) because
 * `@supabase/postgrest-js` v2.x's `RejectExcessProperties<Insert, Row>` helper does not
 * resolve correctly through computed types — it falls back to `never`. Keep them concrete.
 */

type EmptyRelationships = [];

type LeadSource = 'contact_form' | 'newsletter' | 'booking' | 'chatbot' | 'cold_ad' | 'referral';
type LocaleCode = 'cs' | 'en';
type BookingEventType = 'BOOKING_CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'REJECTED';
type AuditTier = 'tier_1' | 'tier_2' | 'tier_3' | 'free_scoping';
type InvoiceStatus = 'pending_invoice' | 'invoiced' | 'paid' | 'overdue';
type ChatRole = 'user' | 'assistant' | 'system';

export type Database = {
  public: {
    Tables: {
      leads: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          company: string | null;
          phone: string | null;
          source: LeadSource;
          source_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          locale: LocaleCode | null;
          budget_tier: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          company?: string | null;
          phone?: string | null;
          source: LeadSource;
          source_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          locale?: LocaleCode | null;
          budget_tier?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          company?: string | null;
          phone?: string | null;
          source?: LeadSource;
          source_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          locale?: LocaleCode | null;
          budget_tier?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      contact_submissions: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          lead_id: string | null;
          email: string;
          name: string | null;
          company: string | null;
          phone: string | null;
          service_interest: string | null;
          budget_tier: string | null;
          message: string;
          locale: string;
          ip_hash: string | null;
          user_agent: string | null;
          honeypot_passed: boolean;
          resend_email_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          email: string;
          name?: string | null;
          company?: string | null;
          phone?: string | null;
          service_interest?: string | null;
          budget_tier?: string | null;
          message: string;
          locale?: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          honeypot_passed?: boolean;
          resend_email_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contact_submissions']['Insert']>;
      };
      chatbot_sessions: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          lead_id: string | null;
          session_id: string;
          ip_hash: string | null;
          user_agent: string | null;
          locale: string | null;
          source_url: string | null;
          utm_source: string | null;
          message_count: number;
          total_tokens_in: number;
          total_tokens_out: number;
          estimated_cost_usd: number;
          high_value_intent: boolean;
          conversion_event: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          session_id: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          locale?: string | null;
          source_url?: string | null;
          utm_source?: string | null;
          message_count?: number;
          total_tokens_in?: number;
          total_tokens_out?: number;
          estimated_cost_usd?: number;
          high_value_intent?: boolean;
          conversion_event?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chatbot_sessions']['Insert']>;
      };
      chatbot_messages: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          session_id: string;
          role: ChatRole;
          content: string;
          tokens_in: number | null;
          tokens_out: number | null;
          model: string | null;
          flagged_topics: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: ChatRole;
          content: string;
          tokens_in?: number | null;
          tokens_out?: number | null;
          model?: string | null;
          flagged_topics?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chatbot_messages']['Insert']>;
      };
      newsletter_subscribers: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          lead_id: string | null;
          email: string;
          resend_audience_id: string | null;
          source_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          locale: string;
          ip_hash: string | null;
          consented_at: string;
          consent_text: string;
          unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          email: string;
          resend_audience_id?: string | null;
          source_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          locale?: string;
          ip_hash?: string | null;
          consented_at: string;
          consent_text: string;
          unsubscribed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
      };
      booking_events: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          lead_id: string | null;
          cal_booking_id: string;
          event_type: BookingEventType;
          audit_tier: AuditTier | null;
          attendee_email: string | null;
          attendee_name: string | null;
          scheduled_for: string | null;
          invoice_status: InvoiceStatus | null;
          invoice_id: string | null;
          webhook_signature_verified: boolean;
          raw_payload: unknown;
          received_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          cal_booking_id: string;
          event_type: BookingEventType;
          audit_tier?: AuditTier | null;
          attendee_email?: string | null;
          attendee_name?: string | null;
          scheduled_for?: string | null;
          invoice_status?: InvoiceStatus | null;
          invoice_id?: string | null;
          webhook_signature_verified: boolean;
          raw_payload: unknown;
          received_at?: string;
        };
        Update: Partial<Database['public']['Tables']['booking_events']['Insert']>;
      };
      aeo_citations: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          llm_provider: string;
          query: string;
          citation_text: string | null;
          cited_url: string | null;
          date_observed: string;
          source_method: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          llm_provider: string;
          query: string;
          citation_text?: string | null;
          cited_url?: string | null;
          date_observed: string;
          source_method: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['aeo_citations']['Insert']>;
      };
      audit_log: {
        Relationships: EmptyRelationships;
        Row: {
          id: string;
          event_type: string;
          actor: string | null;
          resource_type: string | null;
          resource_id: string | null;
          details: unknown;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          actor?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: unknown;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
