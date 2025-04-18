import React from 'react';

export default function PlayerList({ sessions = [], currentPlayerNum = null, turnPlayerNum = null }) {
  return (
    <ul style={{display:'flex',gap:24,listStyle:'none',padding:0,margin:0}}>
      {sessions.map(s => (
        <li key={s.player_num} style={{
          fontWeight:600,
          color: turnPlayerNum === s.player_num ? '#09f' : '#222',
          borderBottom: turnPlayerNum === s.player_num ? '2px solid #09f' : 'none',
          background: currentPlayerNum === s.player_num ? '#cdefff' : 'transparent',
          borderRadius:8,
          padding:'4px 10px'
        }}>
          {s.name || `Bunny #${s.player_num}`}
          {s.ready ? ' ✅' : ' ⏳'}
        </li>
      ))}
    </ul>
  );
}
