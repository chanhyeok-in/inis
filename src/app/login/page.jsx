'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import ProtonWebSDK from '@proton/web-sdk'
import { protonLoginAction } from '@/app/actions' // Import the server action

export default function LoginPage() {
  const supabase = createClient()
  const { language, changeLanguage, t } = useLanguage()
  const [protonSession, setProtonSession] = useState(null)
  const [isLoading, setIsLoading] = useState(false);

  const appIdentifier = 'inis-app'

  // Restore session on component mount from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('proton-session');
    if (savedSession && savedSession !== 'undefined') {
      try {
        const restoredSession = JSON.parse(savedSession);
        setProtonSession(restoredSession);
        console.log('Proton session restored for:', restoredSession.auth.actor)
      } catch (e) {
        console.error('Could not parse saved Proton session:', e);
        localStorage.removeItem('proton-session');
      }
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleProtonLogin = async () => {
    setIsLoading(true);
    try {
      const { session } = await ProtonWebSDK({
        linkOptions: { endpoints: ['https://proton.greymass.com'] },
        transportOptions: { requestAccount: appIdentifier },
        selectorOptions: { appName: 'Inis' },
      });
      
      if (session && session.auth && session.auth.actor) {
        setProtonSession(session);
        localStorage.setItem('proton-session', JSON.stringify(session));
        console.log('Proton login successful:', session.auth.actor);

        const result = await protonLoginAction(session.auth.actor);
        
        if (result.success && result.magicLink) {
          // Redirect the user to the magic link to complete authentication
          window.location.href = result.magicLink;
        } else {
          console.error('Failed to get magic link from server:', result.error);
          setIsLoading(false);
        }
      } else {
        console.log('Proton login was not completed or failed.');
        setIsLoading(false);
      }

    } catch (e) {
      console.error('Proton login failed:', e)
      setIsLoading(false);
    }
  }

  const handleProtonLogout = async () => {
    localStorage.removeItem('proton-session');
    await supabase.auth.signOut();
    setProtonSession(null);
    console.log('Proton and Supabase logout successful');
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
        <select onChange={(e) => changeLanguage(e.target.value)} value={language} style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}>
          <option value="en">🇺🇸 {t('common.english')}</option>
          <option value="ko">🇰🇷 {t('common.korean')}</option>
        </select>
      </div>
      <div style={{ width: '400px' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa, variables: { default: { colors: { inputBackground: 'black', inputText: 'white' } } } }}
          providers={[]}
          localization={{ variables: {
            sign_in: { email_label: t('common.emailAddress'), password_label: t('common.password'), email_input_placeholder: t('common.enterEmail'), password_input_placeholder: t('common.enterPassword'), button_label: t('common.login'), social_provider_text: t('common.loginWithProvider'), link_text: t('common.alreadyHaveAccount') },
            sign_up: { email_label: t('common.emailAddress'), password_label: t('common.password'), email_input_placeholder: t('common.enterEmail'), password_input_placeholder: t('common.enterPassword'), button_label: t('common.signup'), social_provider_text: t('common.loginWithProvider'), link_text: t('common.noAccount') },
            forgotten_password: { email_label: t('common.emailAddress'), password_label: t('common.password'), email_input_placeholder: t('common.enterEmail'), button_label: t('common.resetPassword'), link_text: t('common.forgotPassword') },
            update_password: { password_label: t('common.newPassword'), password_input_placeholder: t('common.newPassword'), button_label: t('common.updatePassword') },
            magic_link: { email_input_placeholder: t('common.enterEmail'), button_label: t('common.sendMagicLink'), link_text: t('common.loginWithMagicLink') },
            verify_otp: { email_input_placeholder: t('common.enterEmail'), phone_input_placeholder: t('common.enterPhoneNumber'), token_input_placeholder: t('common.enterOtpToken'), button_label: t('common.verify'), link_text: t('common.loginWithOtp') },
          } }}
        />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {protonSession ? (
            <div>
              <p>Logged in as: {protonSession.auth.actor}</p>
              <button onClick={handleProtonLogout} style={{ padding: '10px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#ff4d4d', color: 'white', cursor: 'pointer' }}>
                Logout from Proton
              </button>
            </div>
          ) : (
            <button onClick={handleProtonLogin} disabled={isLoading} style={{ padding: '10px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#752EEB', color: 'white', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Logging in...' : 'Login with Proton Wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}