'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { revalidatePath } from 'next/cache'

export async function uploadCharacter(prevState, formData) {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: '오류: 로그인되지 않았습니다.' }
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { message: '오류: 관리자 권한이 없습니다.' }
  }

  const image = formData.get('image')
  const traits = formData.get('traits')

  if (!image || image.size === 0) {
    return { message: '오류: 이미지를 선택해주세요.' }
  }

  let parsedTraits
  try {
    parsedTraits = JSON.parse(traits)
  } catch (error) {
    return { message: '오류: 특징(Traits)이 유효한 JSON 형식이 아닙니다.' }
  }

  const fileExt = image.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('characters')
    .upload(filePath, image)

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError)
    return { message: `오류: 이미지를 업로드하지 못했습니다. (${uploadError.message})` }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('characters')
    .getPublicUrl(filePath)

  const { error: dbError } = await supabase.from('characters').insert([
    {
      image_url: publicUrl,
      generation: 1,
      traits: parsedTraits,
      level: 4,
      attack_stat: 1,
      defense_stat: 1,
      health_stat: 1,
      recovery_stat: 1,
      affection: 1,
    },
  ])

  if (dbError) {
    console.error('Database Insert Error:', dbError)
    return { message: `오류: 데이터베이스에 캐릭터를 저장하지 못했습니다. (${dbError.message})` }
  }

  revalidatePath('/admin') // Re-renders the admin page to show new data if any
  return { message: '성공: 1세대 캐릭터가 성공적으로 생성되었습니다.' }
}