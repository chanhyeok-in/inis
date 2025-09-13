'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // URL hash fragments are not available on the server, so we process them on the client.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove the '#'

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      console.log('Manually setting session from URL tokens.');
      
      const setSession = async () => {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Error manually setting session:', error);
        } else {
          // Once the session is set, redirect to the home page.
          console.log('Session successfully set. Redirecting...');
          router.push('/');
        }
      };

      setSession();

    } else {
      console.error('Access token or refresh token not found in URL hash.');
      // Handle error, maybe redirect to a login failure page.
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Processing login...</p>
    </div>
  );
}