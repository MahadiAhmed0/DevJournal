import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceRole = this.configService.get<string>('SUPABASE_SERVICE_ROLE');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Client for regular operations (respects RLS)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for server-side operations (bypasses RLS)
    if (supabaseServiceRole) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }
}
