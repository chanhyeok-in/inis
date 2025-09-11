
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { LanguageProvider } from '@/lib/i18n/LanguageProvider'; // Import LanguageProvider
import { getSupabaseServerClient } from '@/lib/supabase/server-utils'; // Import for initial language fetch

export const metadata = {
  title: "Inis Land",
  description: "Let's Travel Together With Your Inis",
};

export default async function RootLayout({ children,}) {
  // Fetch initial language from user profile
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let initialLanguage = 'en'; // Default language

  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', user.id)
      .single();

    if (!error && profile && profile.language) {
      initialLanguage = profile.language;
    }
  }

  return (
    <html lang={initialLanguage}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
