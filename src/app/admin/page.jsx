import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import UploadForm from './UploadForm'
import AdminClientPage from './AdminClientPage' // Import AdminClientPage

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

  // Fetch existing characters
  const { data: characters, error: fetchError } = await supabase
    .from('characters')
    .select('id, image_url, level, attack_stat, defense_stat, health_stat, recovery_stat, affection, traits')
    .order('id', { ascending: true }); // Order by ID for consistent display

  if (fetchError) {
    console.error('Error fetching characters:', fetchError);
    return <div style={{ padding: '20px' }}>캐릭터를 불러오는 데 실패했습니다.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>관리자 페이지</h1>
      
      {/* UploadForm is still here */}
      <h2>새 캐릭터 업로드</h2>
      <p>1세대 캐릭터를 업로드하세요.</p>
      <UploadForm />

      {/* Render AdminClientPage and pass characters */}
      <AdminClientPage characters={characters || []} />
    </div>
  )
}