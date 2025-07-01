import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './button';

export function SupabaseDebugger() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    
    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus(`❌ Connection failed: ${error.message}`);
      } else {
        setStatus(`✅ Connection successful! Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    
    setLoading(false);
  };

  const testSimpleSignup = async () => {
    setLoading(true);
    setStatus('Testing simple signup...');
    
    try {
      // Try different email formats to see what works
      const testEmails = [
        `test${Date.now()}@example.com`,
        `user${Date.now()}@test.com`,
        `demo${Date.now()}@demo.com`,
        `admin${Date.now()}@localhost.com`
      ];
      
      let successfulEmail = null;
      let lastError = null;
      
      for (const testEmail of testEmails) {
        const testPassword = '123456';
        
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });
        
        if (error) {
          lastError = error;
          console.log(`❌ Failed with ${testEmail}: ${error.message}`);
        } else {
          successfulEmail = testEmail;
          setStatus(`✅ Signup successful with ${testEmail}! User: ${data.user?.email}, Session: ${data.session ? 'Created' : 'None (email confirmation may be required)'}`);
          break;
        }
      }
      
      if (!successfulEmail && lastError) {
        setStatus(`❌ All test emails failed. Last error: ${lastError.message}\n\nTried: ${testEmails.join(', ')}\n\n💡 This suggests email domain restrictions are configured in Supabase.`);
      }
    } catch (error) {
      setStatus(`❌ Signup error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    
    setLoading(false);
  };

  const checkProjectSettings = async () => {
    setLoading(true);
    setStatus('Checking project configuration...');
    
    const projectUrl = 'https://tagelcmwqukvhyvocfpb.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2VsY213cXVrdmh5dm9jZnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTAwNDksImV4cCI6MjA2NjQyNjA0OX0.rDPqGS86l_S9yfoFW1JWT3dQVizhWq9TtDWk8dPjAZE';
    
    setStatus(`
      📋 Project Configuration:
      • URL: ${projectUrl}
      • API Key: ${apiKey.substring(0, 20)}...
      • Client initialized: ${supabase ? '✅' : '❌'}
      
      🔗 Dashboard: ${projectUrl}/project/tagelcmwqukvhyvocfpb/auth/settings
      
      ⚠️ Email "test@gmail.com" is invalid suggests:
      1. Email domain restrictions are enabled
      2. Gmail domains might be blocked
      3. Email allowlist/blocklist configured
      4. Custom email validation rules
      
      ✅ Try these solutions:
      1. Check Auth → Settings → Email Domain Allowlist
      2. Check Auth → Settings → Custom SMTP (if configured)
      3. Try different email domains (@example.com, @test.com)
      4. Disable email validation temporarily
    `);
    
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-semibold mb-3">🔧 Supabase Debugger</h3>
      
      <div className="space-y-2 mb-4">
        <Button onClick={testConnection} disabled={loading} size="sm" className="w-full">
          Test Connection
        </Button>
        <Button onClick={testSimpleSignup} disabled={loading} size="sm" className="w-full">
          Test Simple Signup
        </Button>
        <Button onClick={checkProjectSettings} disabled={loading} size="sm" variant="secondary" className="w-full">
          Check Configuration
        </Button>
      </div>
      
      <div className="bg-gray-50 p-3 rounded border text-xs">
        <div className="font-medium mb-1">Status:</div>
        <pre className="whitespace-pre-wrap text-gray-700">{status || 'Click a button to test...'}</pre>
      </div>
      
      {loading && (
        <div className="mt-2 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm">Testing...</span>
        </div>
      )}
    </div>
  );
}
