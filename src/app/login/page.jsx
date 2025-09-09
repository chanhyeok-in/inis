'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()

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
                email_label: '이메일 주소',
                password_label: '비밀번호',
                email_input_placeholder: '이메일 주소를 입력하세요',
                password_input_placeholder: '비밀번호를 입력하세요',
                button_label: '로그인',
                social_provider_text: '{{provider}}로 로그인',
                link_text: '이미 계정이 있으신가요? 로그인',
              },
              sign_up: {
                email_label: '이메일 주소',
                password_label: '비밀번호',
                email_input_placeholder: '이메일 주소를 입력하세요',
                password_input_placeholder: '비밀번호를 입력하세요',
                button_label: '회원가입',
                social_provider_text: '{{provider}}로 회원가입',
                link_text: '계정이 없으신가요? 회원가입',
              },
              forgotten_password: {
                email_label: '이메일 주소',
                password_label: '비밀번호',
                email_input_placeholder: '이메일 주소를 입력하세요',
                button_label: '비밀번호 재설정',
                link_text: '비밀번호를 잊으셨나요?',
              },
              update_password: {
                password_label: '새 비밀번호',
                password_input_placeholder: '새 비밀번호를 입력하세요',
                button_label: '비밀번호 업데이트',
              },
              magic_link: {
                email_input_placeholder: '이메일 주소를 입력하세요',
                button_label: '매직 링크 보내기',
                link_text: '매직 링크로 로그인',
              },
              verify_otp: {
                email_input_placeholder: '이메일 주소를 입력하세요',
                phone_input_placeholder: '전화번호를 입력하세요',
                token_input_placeholder: 'OTP 토큰을 입력하세요',
                button_label: '확인',
                link_text: 'OTP로 로그인',
              },
            },
          }}
        />
      </div>
    </div>
  )
}
