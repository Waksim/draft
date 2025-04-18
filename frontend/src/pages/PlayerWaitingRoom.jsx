import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const WaitingRoomWrapper = styled.div`
  max-width: 500px;
  margin: 40px auto;
  padding: 24px;
  background-color: ${props => props.theme.secondaryBackground};
  border-radius: 16px;
  box-shadow: ${props => props.theme.cardShadow};
  color: ${props => props.theme.text};

  h2,
  h4 {
    color: var(--text); /* Ensure headings use the main text color */
  }
  
  label {
    display: block;
    margin-bottom: 8px;
  }
  
  input {
      /* Inherit theme styles defined globally */
      margin-left: 8px; 
      width: auto; /* Allow input to size naturally */
  }
  
  button {
      /* Inherit theme styles defined globally */
      margin-right: 8px; /* Add some space if needed */
  }
  
  ul {
      list-style: none;
      padding: 0;
      margin-top: 8px;
  }
  
  li {
      margin-bottom: 4px;
  }

  .ready-button {
      font-size: 1.1rem; 
      padding: 10px 24px;
      margin-top: 16px;
      margin-bottom: 16px;
      background-color: ${props => props.theme.buttonPrimary};
      color: ${props => props.theme.buttonText};

      &:hover {
          background-color: ${props => props.theme.accentDark};
      }
  }

  .status-list {
      margin-top: 16px;
  }
  
  .waiting-text {
      margin-top: 16px;
      color: ${props => props.theme.mutedText};
  }

  .error-message {
    color: #e53935; /* Keep error message red */
    margin-top: 10px;
  }
`;

export default function PlayerWaitingRoom() {
  const { draftId, playerNum } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaultName = `Bunny #${playerNum}`;
  const [name, setName] = useState(defaultName);
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  // Получить статус сессий
  async function fetchSessions() {
    try {
      const res = await fetch(`/api/drafts/${draftId}/sessions`);
      const data = await res.json();
      setSessions(data);
      setLoading(false);
      // Если оба готовы — переход к драфту
      if (data.length === 2 && data.every(s => s.ready)) {
        navigate(`/draft/${draftId}/play/${playerNum}`);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  // Установить имя игрока
  async function saveName() {
    await fetch(`/api/drafts/${draftId}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerNum: Number(playerNum), name })
    });
    fetchSessions();
  }

  // Установить готовность
  async function setPlayerReadyState(val) {
    setReady(val);
    await fetch(`/api/drafts/${draftId}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerNum: Number(playerNum), ready: val })
    });
    fetchSessions();
  }

  useEffect(() => {
    fetchSessions();
    const id = setInterval(fetchSessions, 1500);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [draftId]);

  // Имя по умолчанию
  useEffect(() => {
    if (!name && sessions.length) {
      const me = sessions.find(s => s.player_num === Number(playerNum));
      if (me) setName(me.name || `Bunny #${playerNum}`);
    }
  }, [sessions, playerNum, name]);

  // Automatically create session with default name if missing
  useEffect(() => {
    if (!sessions.find(s => s.player_num === Number(playerNum))) {
      saveName();
    }
  }, [sessions, playerNum]);

  // Sync local ready state with server flag
  useEffect(() => {
    const me = sessions.find(s => s.player_num === Number(playerNum));
    if (me) setReady(Boolean(me.ready));
  }, [sessions, playerNum]);

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <WaitingRoomWrapper><div className="error-message">{error}</div></WaitingRoomWrapper>;

  return (
    <WaitingRoomWrapper>
      <h2>{t('waiting_room')}</h2>
      <div>
        <label>
          {t('your_name')}:
          <input value={name} onChange={e=>setName(e.target.value)} onBlur={saveName} />
        </label>
      </div>
      <div>
        <button onClick={()=>setPlayerReadyState(!ready)} className="ready-button">
          {ready ? t('not_ready') : t('ready')}
        </button>
      </div>
      <div className="status-list">
        <h4>{t('players_status')}:</h4>
        <ul>
          {sessions.map(s => (
            <li key={s.player_num}>
              {s.name || `Bunny #${s.player_num}`} — {s.ready ? <span style={{color: 'var(--accent)'}}>{t('ready')}</span> : <span>{t('not_ready')}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="waiting-text">{t('waiting_for_all_ready')}</div>
    </WaitingRoomWrapper>
  );
}
