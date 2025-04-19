import React, { useEffect, useState, useRef } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { createWebSocketConnection } from '../utils/websocket';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PlayerList from '../components/PlayerList';
import './DraftPlay.css';

function Modal({ open, onConfirm, onDecline, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <div className="modal-content">{children}</div>
        <div className="modal-actions">
          <button className="btn" onClick={onConfirm}>Да</button>
          <button className="btn" onClick={onDecline}>Нет</button>
        </div>
      </div>
    </div>
  );
}


export default function DraftPlay() {
  // Таймер хода
  const TURN_LIMIT = Infinity;
  const [turnStart, setTurnStart] = useState(Date.now());
  const [turnTime, setTurnTime] = useState(0);
  const [autoPickMsg, setAutoPickMsg] = useState(null);

  const { draftId, playerNum } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [step, setStep] = useState(0);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [myTurn, setMyTurn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(false);
  // --- RESET DRAFT STATE ---
  const [pendingReset, setPendingReset] = useState(null); // {from: playerNum}
  const [showResetModal, setShowResetModal] = useState(false);
  const elementIcons = ['anemo','geo','cryo','hydro','dendro','pyro','electro','none'];
  const actionIcons = ['talent','companion','artifact','elemental-resonance','technique','food','location','arcane-legend','item','weapon','combat-action'];
  const BASE_URL = import.meta.env.BASE_URL;

  // Flatten draft plan into steps
  const planSteps = [];
  if (draft?.rules?.blocks) {
    draft.rules.blocks.forEach(b => {
      for (let i = 0; i < b.count; i++) {
        planSteps.push({ action: b.type, cardType: b.cardType, playerNum: b.playerNum });
      }
    });
  }
  // Compute current block index and details from draft.rules.blocks
  let blockIdx = 0, totalCount = 0;
  if (draft?.rules?.blocks) {
    for (let i = 0; i < draft.rules.blocks.length; i++) {
      const b = draft.rules.blocks[i];
      if (history.length < totalCount + b.count) { blockIdx = i; break; }
      totalCount += b.count;
    }
  }
  const currentBlock = draft?.rules?.blocks?.[blockIdx] || {};

  useEffect(() => {
    if (myTurn) setTurnStart(Date.now());
  }, [myTurn, step]);

  useEffect(() => {
    if (!myTurn) return;
    setAutoPickMsg(null);
    setTurnTime(0);
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now()-turnStart)/1000);
      setTurnTime(seconds);
      if (seconds >= TURN_LIMIT && availableCards.length > 0 && myTurn) {
        // Автовыбор
        setAutoPickMsg(t('auto_pick'));
        setTimeout(() => {
          setAutoPickMsg(null);
          setSelectedCard(availableCards[0].id);
          confirmPick();
        }, 500);
      }
    }, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [myTurn, turnStart, availableCards]);

  // Reset filterTag when block changes
  useEffect(() => { setFilterTag(null); }, [currentBlock.cardType]);

  // Toggle browser notifications
  function toggleNotifications() {
    console.log('[DraftPlay] toggleNotifications called, notificationsEnabled=', notificationsEnabled, 'Notification.permission=', Notification.permission);
    if (!notificationsEnabled) {
      if (!('Notification' in window)) {
        alert('Этот браузер не поддерживает уведомления.');
      } else if (Notification.permission === 'granted') {
        console.log('[DraftPlay] Notification.permission === granted, enabling notifications');
        setNotificationsEnabled(true);
        new Notification('Уведомления о начале вашего хода включены!');
      } else if (Notification.permission !== 'denied') {
        console.log('[DraftPlay] requesting Notification permission');
        const handlePermission = (permission) => {
          console.log('[DraftPlay] handlePermission result:', permission);
          if (permission === 'granted') {
            setNotificationsEnabled(true);
            new Notification('Уведомления о начале вашего хода включены!');
          } else {
            setNotificationsEnabled(false);
          }
        };
        const permissionResult = Notification.requestPermission();
        if (permissionResult && permissionResult.then) {
          permissionResult.then(handlePermission).catch(() => {
            console.log('[DraftPlay] permissionResult rejected, retrying with callback');
            Notification.requestPermission(handlePermission);
          });
        } else {
          console.log('[DraftPlay] Notification.requestPermission(callback) since no promise returned');
          Notification.requestPermission(handlePermission);
        }
      } else {
        alert('Уведомления в браузере заблокированы.');
      }
    } else {
      console.log('[DraftPlay] disabling notifications');
      setNotificationsEnabled(false);
    }
  }

  // Notify at start of your turn when tab not visible
  useEffect(() => {
    console.log('[DraftPlay] notifyEffect run', { myTurn, notificationsEnabled, visibility: document.visibilityState, permission: Notification.permission });
    if (myTurn && notificationsEnabled && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      console.log('[DraftPlay] sending start-turn notification');
      new Notification('Ваш ход начался!');
    }
  }, [myTurn, notificationsEnabled]);

  // Listen for tab visibility change to notify if turn started while hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[DraftPlay] visibilitychange event, state=', document.visibilityState);
      if (myTurn && notificationsEnabled && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        console.log('[DraftPlay] sending notification on visibility change');
        new Notification('Ваш ход начался!');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [myTurn, notificationsEnabled]);

  // Получить драфт, сессии, историю
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

  // WebSocket подключение
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
      if (data.type === 'pending_reset') {
        setPendingReset({ from: data.from });
        // Если это не я инициировал — показать модалку
        if (Number(playerNum) !== data.from) setShowResetModal(true);
      }
      if (data.type === 'reset_cancel') {
        setPendingReset(null);
        setShowResetModal(false);
      }
      if (data.type === 'reset_confirmed') {
        setPendingReset(null);
        setShowResetModal(false);
        fetchDraftState();
      }
    };
    fetchDraftState();
    return () => wsRef.current && wsRef.current.close();
    // eslint-disable-next-line
  }, [draftId, playerNum]);

  // Определить чей ход (упрощенно: step % 2 === playerNum-1)
  useEffect(() => {
    if (!draft || !history) return;
    setStep(history.length);
    // Determine next player based on draft plan blocks
    let nextPlayer;
    if (draft.rules && draft.rules.blocks) {
      let totalCount = 0;
      for (let i = 0; i < draft.rules.blocks.length; i++) {
        const b = draft.rules.blocks[i];
        if (history.length < totalCount + b.count) {
          nextPlayer = b.playerNum || 1;
          break;
        }
        totalCount += b.count;
      }
    } else {
      nextPlayer = (history.length % 2) + 1;
    }
    setMyTurn(nextPlayer === Number(playerNum));
    // Поддержка блоков draft.rules
    async function loadAvailableCards() {
      if (!draft.rules || !draft.rules.blocks) return setAvailableCards([]);
      // Определяем текущий блок
      let blockIdx = 0, stepInBlock = 0, total = 0;
      for (let i=0;i<draft.rules.blocks.length;i++) {
        const b = draft.rules.blocks[i];
        if (history.length < total + b.count) {
          blockIdx = i; stepInBlock = history.length - total; break;
        }
        total += b.count;
      }
      const block = draft.rules.blocks[blockIdx];
      if (!block) return setAvailableCards([]);
      const cardType = block.cardType || 'Character';
      // Собираем уже выбранные и забаненные карты
      const picked = history.filter(h=>h.data && h.data.action==='pick').map(h=>h.data.cardId);
      const banned = history.filter(h=>h.data && h.data.action==='ban').map(h=>h.data.cardId);
      let exclude = [...picked, ...banned];
      // Для ban показываем только не забаненные и не выбранные, для pick — не забаненные и не выбранные
      // Fetch cards for this block type and optional tag
      const urlType = block.cardType || 'Character';
      let url = `/api/cards?type=${urlType}`;
      if (filterTag) url += `&tag=${filterTag}`;
      let cards = await apiGet(url);
      cards = cards.filter(c => !exclude.includes(c.id));
      // show all available cards
      // cards = cards.sort(() => Math.random()-0.5).slice(0, 3);
      setAvailableCards(cards);
    }
    loadAvailableCards();
  }, [draft, history, playerNum, filterTag]);

  // Выбрать карту
  function handlePickCard(cardId) {
    setSelectedCard(cardId);
  }

  // Подтвердить выбор карты
  async function confirmPick() {
    if (!selectedCard) return;
    if (!draft.rules || !draft.rules.blocks) return;
    // Определяем текущий блок
    let blockIdx = 0, total = 0;
    for (let i=0;i<draft.rules.blocks.length;i++) {
      const b = draft.rules.blocks[i];
      if (history.length < total + b.count) { blockIdx = i; break; }
      total += b.count;
    }
    const block = draft.rules.blocks[blockIdx];
    const action = block.type || 'pick';
    const cardType = block.cardType || 'Character';
    const card = availableCards.find(c=>c.id===selectedCard);
    wsRef.current.send(JSON.stringify({
      type: action,
      draftId,
      playerNum: Number(playerNum),
      cardId: selectedCard,
      cardName: card ? card.name_en : '',
      cardType,
      action,
      step,
      time: myTurn ? Math.floor((Date.now()-turnStart)/1000) : undefined,
    }));
    setSelectedCard(null);
  }

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div className="draft-container">
      <h2 className="draft-header">{t('draft_play')}</h2>
      <div className="summary-container">
        <div className="summary-player">
          <ul className="summary-list summary-list-bans summary-list-bans-character">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'ban' && h.data.cardType === 'Character').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-bans summary-list-bans-action">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'ban' && h.data.cardType === 'Action').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks summary-list-picks-character">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'pick' && h.data.cardType === 'Character').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image pick"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks summary-list-picks-action">
            {history.filter(h => h.data && h.data.playerNum === 1 && h.data.action === 'pick' && h.data.cardType === 'Action').map((h,i) => (
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
          <ul className="summary-list summary-list-bans summary-list-bans-character">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'ban' && h.data.cardType === 'Character').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-bans summary-list-bans-action">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'ban' && h.data.cardType === 'Action').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image ban"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks summary-list-picks-character">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'pick' && h.data.cardType === 'Character').map((h,i) => (
              <li key={i} className="summary-item">
                <img
                  src={`${BASE_URL}images/cards/${h.data.cardId}.webp`}
                  alt={h.data.cardName}
                  className="summary-image pick"
                />
              </li>
            ))}
          </ul>
          <ul className="summary-list summary-list-picks summary-list-picks-action">
            {history.filter(h => h.data && h.data.playerNum === 2 && h.data.action === 'pick' && h.data.cardType === 'Action').map((h,i) => (
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
      <div className="draft-layout">
        <div className="draft-left">
          <div>{t('step')}: {step+1}</div>
          {/* Определяем текущий блок и действие */}
          {draft.rules && draft.rules.blocks && (() => {
            let blockIdx = 0, total = 0;
            for (let i=0;i<draft.rules.blocks.length;i++) {
              const b = draft.rules.blocks[i];
              if (history.length < total + b.count) { blockIdx = i; break; }
              total += b.count;
            }
            const block = draft.rules.blocks[blockIdx];
            return <div className="block-info">{block ? `${block.type || 'pick'} — ${block.cardType || 'Character'}` : ''}</div>;
          })()}
          <div>{myTurn ? t('your_turn') : t('waiting_opponent')}</div>
          <div>
            {myTurn && (
              <span className="turn-time">
                {t('your_time')}: {turnTime}s
                {turnTime>=TURN_LIMIT-5 && ` (${TURN_LIMIT-turnTime}s)`}
              </span>
            )}
            <div style={{ marginTop: 8 }}>
              <button onClick={toggleNotifications}>
                {notificationsEnabled ? '🔔' : '🔕'}
              </button>
            </div>
            {autoPickMsg && <div className="auto-pick-msg">{t('time_is_up')} {autoPickMsg}</div>}
          </div>
          <div className={`draft-plan ${planExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="draft-plan-header">
              <h4>{t('draft_plan')}</h4>
            </div>
            {/* Draft plan and filters */}
            <ul className="plan-list">
              {planSteps.map((b, idx) => {
                const stepPlayer = b.playerNum;
                const session = sessions.find(s => s.player_num === stepPlayer);
                const done = idx < history.length;
                const current = idx === history.length;
                return (
                  <li key={idx} className={`plan-item ${done ? 'done' : current ? 'current' : ''}`}>
                    <strong>{session?.name || `${t('player')} ${stepPlayer}`}: </strong>
                    {t(b.action)} {t(b.cardType.toLowerCase())}{done && ' ✅'}
                  </li>
                );
              })}
            </ul>
            <div className="plan-toggle">
              <button className="btn" onClick={() => setPlanExpanded(prev => !prev)}>
                {planExpanded ? t('show_less') : t('show_more')}
              </button>
            </div>
            <div className="filter-icons">
              {currentBlock.cardType === 'Character' && elementIcons.map(el => (
                <img key={el} src={`${BASE_URL}images/cards/element-icons/${el}.webp`} alt={el} className={`filter-ico${filterTag===el?' selected':''}`} onClick={() => setFilterTag(el)} />
              ))}
              {currentBlock.cardType === 'Action' && actionIcons.map(ac => (
                <img key={ac} src={`${BASE_URL}images/cards/action-type-icons/${ac}.webp`} alt={ac} className={`filter-ico${filterTag===ac?' selected':''}`} onClick={() => setFilterTag(ac)} />
              ))}
            </div>
          </div>
          {history.length >= planSteps.length ? (
            <div className="draft-finished">
              <h3>Драфты закончены!</h3>
              <div className="draft-finished-buttons">
              {[Number(playerNum)].map(playerNum => {
                const session = sessions.find(s => s.player_num === playerNum);
                const title = session?.name || `${t('player')} ${playerNum}`;
                const pickedChars = history.filter(h => h.data && h.data.action==='pick' && h.data.cardType==='Character' && h.data.playerNum===playerNum).map(h => h.data.cardId);
                const pickedActions = history.filter(h => h.data && h.data.action==='pick' && h.data.cardType==='Action' && h.data.playerNum===playerNum).map(h => h.data.cardId);
                const bannedChars = history.filter(h => h.data && h.data.action==='ban' && h.data.cardType==='Character').map(h => h.data.cardId);
                const bannedActions = history.filter(h => h.data && h.data.action==='ban' && h.data.cardType==='Action').map(h => h.data.cardId);
                const params = new URLSearchParams();
                if (pickedChars.length) params.append('chars', pickedChars.join(','));
                if (pickedActions.length) params.append('actions', pickedActions.join(','));
                if (bannedChars.length) params.append('banned_chars', bannedChars.join(','));
                if (bannedActions.length) params.append('banned_actions', bannedActions.join(','));
                return (
                  <button key={playerNum} className="btn" onClick={() => window.open(`https://gitcg.ru/?${params.toString()}`, '_blank')}>
                    {`Создать колоду ${title}`}
                  </button>
                );
              })}
              <button className="btn" onClick={() => {
                // Инициатор сброса — отправляем запрос через websocket
                wsRef.current.send(JSON.stringify({ type: 'request_reset', draftId, from: Number(playerNum) }));
                setPendingReset({ from: Number(playerNum) });
              }}>Повторить драфты</button>
              {(pendingReset && pendingReset.from === Number(playerNum) && !showResetModal) && (
                <div className="reset-request-msg" style={{marginTop:8, color:'#888'}}>
                  Запрос на повтор драфтов отправлен второму игроку. Ожидание ответа...
                </div>
              )}
            </div>
              <Modal
                open={showResetModal}
                onConfirm={() => {
                  wsRef.current.send(JSON.stringify({ type: 'confirm_reset', draftId, from: Number(playerNum) }));
                  setShowResetModal(false);
                }}
                onDecline={() => {
                  wsRef.current.send(JSON.stringify({ type: 'decline_reset', draftId, from: Number(playerNum) }));
                  setShowResetModal(false);
                }}
              >
                Повторить драфты? Второй игрок запросил сброс. Начать заново?
              </Modal>
            </div>
          ) : availableCards.length === 0 ? (
            <div className="no-cards">{t('no_cards')}</div>
          ) : (
            <div className="card-grid-container">
              {currentBlock?.type && (
                <div className="action-instruction" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                  {`${t(myTurn ? 'you' : 'opponent')} ${t(currentBlock.type).toUpperCase()} ${t(currentBlock.cardType === 'Character' ? 'card_character' : 'card_action')}!`}
                </div>
              )}
              {myTurn && <button className="btn" disabled={!selectedCard} onClick={confirmPick}>{t('confirm_pick')}</button>}
              <ul className="card-grid">
                {availableCards.map(card => {
                  let blockIdx=0,total=0;
                  if (draft.rules && draft.rules.blocks) {
                    for(let i=0;i<draft.rules.blocks.length;i++) {
                      const b=draft.rules.blocks[i];
                      if(history.length<total+b.count){blockIdx=i;break;}
                      total+=b.count;
                    }
                  }
                  const block = draft.rules && draft.rules.blocks ? draft.rules.blocks[blockIdx] : null;
                  const isBan = block?.type==='ban';
                  return (
                    <li key={card.id} className="card-item">
                      <button
                        className={`card-button ${isBan?'ban':'pick'}${selectedCard===card.id?' selected':''}`}
                        onClick={()=>handlePickCard(card.id)}
                        disabled={!myTurn}
                      >
                        <img src={`${BASE_URL}images/cards/${card.id}.webp`} alt={card.name_en} className="card-image"/>
                        <span className="card-title">{card.name_en}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="draft-right">
          <h4 className="history-header">{t('history')}</h4>
          <ol className="history-list">
            {history.map((h,i)=>(
              <li key={i} className="history-item">
                {h.data && h.data.cardId && <img src={`${BASE_URL}images/cards/${h.data.cardId}.webp`} alt={h.data.cardName} className="history-image" />}
                <span className="history-text">
                  {h.data && h.data.action ? `${h.data.action === 'ban' ? t('ban') : t('pick')}: ` : ''}
                  {h.data && h.data.cardType ? `${h.data.cardType} — ` : ''}
                  {h.data && h.data.cardName ? h.data.cardName : JSON.stringify(h.data)}
                </span>
                <span className="history-player">
                  {h.data && h.data.playerNum && sessions.find(s=>s.player_num===h.data.playerNum)?.name}
                  {h.data && h.data.time !== undefined ? ` (${h.data.time}s)` : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
