import React, { useEffect, useState, useRef } from 'react';
import { apiGet } from '../utils/api';
import { createWebSocketConnection } from '../utils/websocket';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PlayerList from '../components/PlayerList';
import './DraftPlay.css';

export default function SpectatorView() {
  const BASE_URL = import.meta.env.BASE_URL;
  const { draftId } = useParams();
  const { t } = useTranslation();
  const wsRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchDraftState() {
    try {
      const [draftRes, sessionsRes, historyRes] = await Promise.all([
        apiGet(`/api/drafts/${draftId}`),
        apiGet(`/api/drafts/${draftId}/sessions`),
        apiGet(`/api/drafts/${draftId}/history`),
      ]);
      setDraft(draftRes);
      setSessions(sessionsRes);
      setHistory(historyRes);
      setLoading(false);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    wsRef.current = createWebSocketConnection();
    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', draftId }));
    };
    wsRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'draft_update') {
        fetchDraftState();
      }
    };
    fetchDraftState();
    return () => wsRef.current && wsRef.current.close();
    // eslint-disable-next-line
  }, [draftId]);

  useEffect(() => {
    if (!draft || !history) return;
    setStep(history.length);
  }, [draft, history]);

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div style={{maxWidth:900,margin:'40px auto',padding:24,background:'rgba(0,0,0,0.07)',borderRadius:16}}>
      <h2>{t('spectator_view')}</h2>
      <div style={{marginBottom:12}}>
        <b>{t('players')}:</b>
        <PlayerList sessions={sessions} />
      </div>
      <div className="summary-container">
        <div className="summary-player">
          <ul className="summary-list summary-list-bans">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'ban').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'pick').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image pick"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="summary-player">
          <ul className="summary-list summary-list-bans">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'ban').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'pick').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image pick"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h4>{t('history')}</h4>
        <ol>
          {history.map((h,i)=>(
            <li key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              {h.data && h.data.cardId && <img src={`${BASE_URL}images/cards/${h.data.cardId}.webp`} alt={h.data.cardName} style={{width:32,height:54,objectFit:'cover',borderRadius:4}} />}
              <span style={{color:h.data && h.data.action==='ban'?'#e53935':undefined,fontWeight:h.data && h.data.action==='ban'?600:400}}>
                {h.data && h.data.action ? `${h.data.action === 'ban' ? t('ban') : t('pick')}: ` : ''}
                {h.data && h.data.cardType ? `${h.data.cardType} — ` : ''}
                {h.data && h.data.cardName ? h.data.cardName : h.data.cardId}
              </span>
              <span style={{fontSize:12,color:'#888'}}>
                {h.data && h.data.playerNum && sessions.find(s=>s.player_num===h.data.playerNum)?.name}
                {h.data && h.data.time !== undefined ? ` (${h.data.time}s)` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div style={{marginTop:16,color:'#888'}}>{t('spectator_tip')}</div>
    </div>
  );
}
