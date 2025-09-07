프로젝트 설명

INIS

다마고치 + 포켓몬 형태의 게임을 만들려고해. 
현재는 1세대 이니스를 관리자가 직접 등록하고 있어. 
회원 가입 시 supabase의 function으로 가입자에게 랜덤한 이니스를 지급해주고 있어.

supabase의 테이블 구조는 src/sql 하위에 있어.

TODO
각 이니스의 기본 스탯을 만들려고해. 
공격력
방어력
체력
회복력

레벨당 1의 수치를 올릴 수 있고, 시작은 항상 4레벨로 시작하려해.
공격력 1
방어력 1
체력 1
회복력 1
로 4레벨인 이니스를 지급하도록 내용을 수정해야해.

공격력은 공격력 수치에 3을 곱한 값을 기본 공격력(0)에 더해서 이니스의 공격력이 돼.
방어력은 방어력 수치에 3을 곱한 값을 기본 방어력(0)에 더해서 이니스의 방어력이 돼.
체력은 체력 수치에 5을 곱한 값을 기본 체력(20)에 더해서 이니스의 체력이 돼.
회복력은 회복력 수치에 1을 곱한 값을 기본 회복력(0)에 더해서 이니스의 회복력이 돼. 회복력은 턴마다 닳은 체력을 회복하는 수치야.


이니스의 기본 스탯에는 유대감이 추가돼.
유대감은 레벨업으로는 절대 오르지 않고, 오직 유저와의 대화(+1), 산책(+1), 승리 시(+1)에만 획득할 수 있어.

매일(UTC 00:00 마다 초기화) 1회 산책 시스템을 만들어서 산책 도중 랜덤(10%)으로 이니스와 유저와의 유대감 수치를 올려주려해.(+1)
매일(UTC 00:00 마다 초기화) 3회 대화 시스템을 만들어서 이니스의 상태를 살피고 랜덤으로 이상이 있거나(5%) 할말이 있는(5%) 이니스의 대화를 듣고 유대감 수치를 올릴 수 있어.(+1)

그리고 매일(UTC 00:00 마다 초기화) 1회 랜덤으로 다른 유저의 이니스와 전투할 수 있는 시스템을 만들려고해.
스탯이 5이하 차이나는 유저의 이니스와만 전투할 수 있게 구현하려해.
전투는 자동으로 이루어지고, 행동 선택은 랜덤으로 이루어져.
행동은 
공격했다 !(25%)
유저의 말을 이해하지 못했다 !(25%)
멍때리고 있다 !(25%)
유저의 말을 듣지 않는다 !(25%)
이렇게 4가지로 이루어져 있고

유대감이 높을수록 전투 시 '유저의 말을 듣지 않는다 ! '를 실행할 확률이 낮아지고 '공격했다 !' 를 실행할 확률이 높아져.
반대로 유대감이 낮을 수록 전투 시 '공격했다 !' 를 실행할 확률이 낮아지고 '유저의 말을 듣지 않는다 !' 를 실행할 확률이 높아져.
유대감은 1부터 10000이 최대이며, 1 당 0.0025%의 영향을 미쳐.
예를들어 유대감이 1000이라면 2.5% 의 영향을 주어서
공격했다 !(27.5%)
유저의 말을 이해하지 못했다 !(25%)
멍때리고 있다 !(25%)
유저의 말을 듣지 않는다 !(22.5%)
가 되는거야.



오류 수정을 위해 수행된 변경 사항 요약:

1. `src/lib/supabase/server-utils.ts` 생성: 이 새 파일은 createServerClient 로직과 cookies() 임포트를 캡슐화하여 서버 전용 유틸리티로 만듭니다.
2. `src/app/daily-actions.ts` 수정:
    * 최상위 import { createClient } from '@/lib/supabase/server'를 제거했습니다.
    * 각 함수에서 로컬 const { cookies } = await import('next/headers')를 제거했습니다.
    * import { getSupabaseServerClient } from '@/lib/supabase/server-utils'를 추가했습니다.
    * 각 서버 액션에서 const supabase = createClient()를 const supabase = getSupabaseServerClient()로 변경했습니다.
3. `src/lib/supabase/server.ts` 삭제: 기능이 이동되었으므로 이전 파일은 제거되었습니다.
4. `src/lib/supabase/server.ts` 되돌리기 (이전 시도): 새 server-utils.ts가 생성되기 전에 createClient 함수가 원래 형식(내부적으로 cookies()를
   호출하는 방식)으로 되돌려졌습니다. 이는 문제 해결 과정의 일부였습니다.

전체 구현된 작업 요약:

1. 카카오 로그인 연동: (사용자님의 명확화에 따라 되돌림)
2. Supabase 연동: 기존 Supabase 설정 확인.
3. 관리자 페이지 구현: UploadForm.tsx 및 actions.ts 구현 확인.
4. 브리딩 페이지 구현: page.tsx 및 actions.ts 구현 확인 (간소화된 새 캐릭터 생성 및 기본 특성 상속 포함).
5. 위치 정보 업데이트 기능 구현: LocationUpdater.tsx 및 actions.ts 구현 확인.
6. 이니스의 기본 스탯:
    * 제안된 데이터베이스 스키마 변경: characters 테이블에 level, attack_stat, defense_stat, health_stat, recovery_stat, affection 컬럼 추가
      (사용자님께서 SQL 실행 확인).
    * 캐릭터 생성 로직: src/app/admin/actions.ts 및 src/app/breeding/actions.ts 업데이트하여 새 스탯 초기화.
    * 스탯 계산 로직: src/lib/inis/stats.ts 생성 및 src/app/page.tsx에 통합하여 표시.
7. 유대감 메커니즘 및 일일 시스템 (산책, 대화, 전투):
    * 제안된 데이터베이스 스키마 변경: profiles 테이블에 last_daily_reset, walk_count, conversation_count, battle_count 컬럼 추가 (사용자님께서
      SQL 실행 확인).
    * 서버 액션: src/app/daily-actions.ts 생성 (일일 초기화 로직 및 유대감 획득 포함)하여 performWalk, performConversation, performBattle 함수
      구현.
    * 일일 활동 전용 페이지: src/app/walk/page.tsx, src/app/conversation/page.tsx, src/app/battle/page.tsx 생성 (전용 UI 및 직접 메시지 표시
      포함).
    * 홈 페이지 (`src/app/page.tsx`) 업데이트: DailyActionButton 제거 및 일일 활동 섹션을 새 페이지로 직접 연결되는 링크로 대체.
    * 상세 전투 시스템 구현: src/app/daily-actions.ts의 performBattle 내에 상세 전투 시뮬레이션 로직 구현.
    * 전투 시스템 개선: 위치 기반 전투와 랜덤 매칭 전투 모드를 모두 지원하도록 개선했습니다. 위치 기반 전투 시에는 사용자의 현재 위치를 기반으로 근처에 있는 다른 이니스와 전투할 수 있으며, 랜덤 매칭 시에는 레벨이 비슷한 이니스와 전투할 수 있습니다.

사용자님께 남은 작업:

* Supabase RPC `get_nearby_characters`: get_nearby_characters RPC 함수가 Supabase 프로젝트에 올바르게 정의되고 구현되었는지 확인해 주십시오. 이
  함수는 브리딩 페이지가 주변 캐릭터를 가져오는 데 중요합니다.
* 브리딩 로직 개선: src/app/breeding/actions.ts의 브리딩 로직을 개선하여 브리딩된 캐릭터에 대한 더 정교한 이미지 생성을 포함하십시오. (기본 특성
  상속은 구현됨).
* 상세 전투 로직 개선:
    * 전투 UI/시각화: 현재 전투 로그는 텍스트 기반입니다. 전투의 더 시각적인 표현이 필요할 수 있습니다.

제공된 정보와 도구를 기반으로 제가 구현할 수 있는 모든 작업을 완료했습니다.