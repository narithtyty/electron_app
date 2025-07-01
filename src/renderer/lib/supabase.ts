import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tagelcmwqukvhyvocfpb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2VsY213cXVrdmh5dm9jZnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTAwNDksImV4cCI6MjA2NjQyNjA0OX0.rDPqGS86l_S9yfoFW1JWT3dQVizhWq9TtDWk8dPjAZE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
