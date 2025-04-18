import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../utils/api';
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
  console.log('PlayerWaitingRoom component initialized');
  const { draftId, playerNum } = useParams();
  console.log('URL parameters:', { draftId, playerNum });
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
    console.log('Пытаемся получить сессии для драфта:', draftId);
    try {
      const data = await apiGet(`/api/drafts/${draftId}/sessions`);
      console.log('Получены данные сессий:', data);
      setSessions(data);
      setLoading(false);
      // Если оба готовы — переход к драфту
      if (data.length === 2 && data.every(s => s.ready)) {
        // Важно не добавлять /draft/ в начало пути, так как BrowserRouter уже настроен с basename
        navigate(`/${draftId}/play/${playerNum}`);
      }
    } catch (e) {
      console.error('Ошибка при получении сессий:', e);
      setError(e.message);
    }
  }

  // Установить имя игрока
  async function saveName() {
    await apiPost(`/api/drafts/${draftId}/session`, { playerNum: Number(playerNum), name });
    fetchSessions();
  }

  // Установить готовность
  async function setPlayerReadyState(val) {
    setReady(val);
    await apiPost(`/api/drafts/${draftId}/ready`, { playerNum: Number(playerNum), ready: val });
    fetchSessions();
  }

  useEffect(() => {
    console.log('Initial useEffect for fetching sessions triggered');
    fetchSessions();
    const id = setInterval(fetchSessions, 1500);
    setIntervalId(id);
    console.log('Interval set for fetching sessions, ID:', id);
    return () => {
      console.log('Clearing interval on component unmount');
      clearInterval(id);
    };
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

  if (loading) return (
    <WaitingRoomWrapper>
      <h2>{t('loading')} ({draftId}/player/{playerNum})</h2>
      <div>Debug loading state: {loading ? 'Still loading' : 'Loading complete'}</div>
      <div>Sessions count: {sessions ? sessions.length : 0}</div>
      <div>Error: {error ? error : 'No errors'}</div>
    </WaitingRoomWrapper>
  );
  
  if (error) return (
    <WaitingRoomWrapper>
      <h2>Error occurred</h2>
      <div className="error-message">{error}</div>
      <div>draftId: {draftId}, playerNum: {playerNum}</div>
      <div>Sessions count: {sessions ? sessions.length : 0}</div>
    </WaitingRoomWrapper>
  );

  return (
    <WaitingRoomWrapper>
      <h2>{t('waiting_room')} - {draftId}/player/{playerNum}</h2>
      
      {/* Debug section - will help identify potential issues */}
      <div style={{background: '#f5f5f5', border: '1px solid #ddd', padding: '10px', marginBottom: '20px', borderRadius: '5px'}}>
        <h4>Debug Info:</h4>
        <ul style={{listStyle: 'none', padding: '0'}}>
          <li>draftId: {draftId}</li>
          <li>playerNum: {playerNum}</li>
          <li>Sessions count: {sessions ? sessions.length : 0}</li>
          <li>Loading state: {loading ? 'Loading' : 'Complete'}</li>
          <li>Error state: {error ? error : 'No errors'}</li>
          <li>API URL: /api/drafts/{draftId}/sessions</li>
          <li>Ready state: {ready ? 'Ready' : 'Not ready'}</li>
        </ul>
      </div>
      
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
          {sessions.length > 0 ? (
            sessions.map(s => (
              <li key={s.player_num}>
                {s.name || `Bunny #${s.player_num}`} — {s.ready ? <span style={{color: 'var(--accent)'}}>{t('ready')}</span> : <span>{t('not_ready')}</span>}
              </li>
            ))
          ) : (
            <li>No sessions found. Trying to create/fetch...</li>
          )}
        </ul>
      </div>
      <div className="waiting-text">{t('waiting_for_all_ready')}</div>
    </WaitingRoomWrapper>
  );
}
