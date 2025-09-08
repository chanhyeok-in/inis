'use client'

import { useState } from 'react'
import { default as NextImage } from 'next/image'
import EditCharacterForm from './EditCharacterForm'

export default function AdminClientPage({ characters }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleEditClick = (character) => {
    setSelectedCharacter(character);
  };

  const handleCancelEdit = () => {
    setSelectedCharacter(null);
  };

  return (
    <>
      <h2>새 캐릭터 업로드</h2>
      <p>1세대 캐릭터를 업로드하세요.</p>
      {/* UploadForm will be rendered by the parent AdminPage */}

      <h2 style={{ marginTop: '40px' }}>기존 캐릭터 수정</h2>
      {selectedCharacter ? (
        <EditCharacterForm character={selectedCharacter} onCancel={handleCancelEdit} />
      ) : characters && characters.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {characters.map(character => (
            <div key={character.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <NextImage src={character.image_url} alt={`Character ${character.id}`} width={150} height={150} style={{ borderRadius: '4px' }} />
              <p>ID: {character.id}</p>
              <p>레벨: {character.level}</p>
              <p>공격력: {character.attack_stat}</p>
              <p>방어력: {character.defense_stat}</p>
              <p>체력: {character.health_stat}</p>
              <p>회복력: {character.recovery_stat}</p>
              <p>유대감: {character.affection}</p>
              <button onClick={() => handleEditClick(character)} style={{ marginTop: '10px', padding: '5px 10px' }}>
                수정
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>등록된 캐릭터가 없습니다.</p>
      )}
    </>
  );
}