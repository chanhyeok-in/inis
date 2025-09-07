import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import UploadForm from './UploadForm' // We will create this component next

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>관리자 페이지</h1>
      <p>1세대 캐릭터를 업로드하세요.</p>
      <UploadForm />
    </div>
  )
}