'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'; // Import useLanguage

export default function LoginPage() {
  const supabase = createClient()
  const { language, changeLanguage, t } = useLanguage(); // Use the language context

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.location.href = '/' // Redirect to home page on sign in
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
        {/* Language Selector */}
        <select onChange={(e) => changeLanguage(e.target.value)} value={language} style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}>
          <option value="en">🇺🇸 {t('common.english')}</option>
          <option value="ko">🇰🇷 {t('common.korean')}</option>
        </select>
      </div>
      <div style={{ width: '400px' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  // Removed inputText: 'white' to allow default theme handling for dark/light mode
                },
              },
            },
          }}
          providers={[]}
                    localization={{
            variables: {
              sign_in: {
                email_label: t('common.emailAddress'),
                password_label: t('common.password'),
                email_input_placeholder: t('common.enterEmail'),
                password_input_placeholder: t('common.enterPassword'),
                button_label: t('common.login'),
                social_provider_text: t('common.loginWithProvider'),
                link_text: t('common.alreadyHaveAccount'),
              },
              sign_up: {
                email_label: t('common.emailAddress'),
                password_label: t('common.password'),
                email_input_placeholder: t('common.enterEmail'),
                password_input_placeholder: t('common.enterPassword'),
                button_label: t('common.signup'),
                social_provider_text: t('common.loginWithProvider'),
                link_text: t('common.noAccount'),
              },
              forgotten_password: {
                email_label: t('common.emailAddress'),
                password_label: t('common.password'),
                email_input_placeholder: t('common.enterEmail'),
                button_label: t('common.resetPassword'),
                link_text: t('common.forgotPassword'),
              },
              update_password: {
                password_label: t('common.newPassword'),
                password_input_placeholder: t('common.newPassword'),
                button_label: t('common.updatePassword'),
              },
              magic_link: {
                email_input_placeholder: t('common.enterEmail'),
                button_label: t('common.sendMagicLink'),
                link_text: t('common.loginWithMagicLink'),
              },
              verify_otp: {
                email_input_placeholder: t('common.enterEmail'),
                phone_input_placeholder: t('common.enterPhoneNumber'),
                token_input_placeholder: t('common.enterOtpToken'),
                button_label: t('common.verify'),
                link_text: t('common.loginWithOtp'),
              },
            },
          }}
        />
      </div>
    </div>
  )
}