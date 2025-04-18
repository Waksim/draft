import React, { useState, useEffect } from 'react';
import { apiPost } from '../utils/api';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const defaultBlock = { type: 'pick', cardType: 'Character', count: 1, playerNum: 1 };

const ConstructorWrapper = styled.div`
  padding: 24px;
  background-color: ${props => props.theme.secondaryBackground};
  color: ${props => props.theme.text};
  border-radius: 8px;
  box-shadow: ${props => props.theme.cardShadow};
  margin: 20px 0;

  h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }

  table {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
    color: ${props => props.theme.tableTextColor};
    font-size: 0.9rem;

    th,
    td {
      border: 1px solid ${props => props.theme.tableBorderColor};
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: ${props => props.theme.tableHeaderBackground};
      font-weight: 600;
    }

    tr:nth-child(even) {
      background-color: ${props => props.theme.tableAltRowBackground};
    }
    tr:nth-child(odd) {
        background-color: ${props => props.theme.tableRowBackground};
    }

    td select,
    td input {
      width: 100%;
      max-width: 150px;
      box-sizing: border-box;
      font-size: 0.9rem;
      padding: 6px 8px;
    }
    
    td input[type="number"] {
        max-width: 60px;
    }

    td:last-child {
        text-align: center;
        white-space: nowrap;
    }

    button {
      margin: 0 2px;
      padding: 4px 6px;
      font-size: 1rem;
      line-height: 1;
      min-width: 24px;
    }
  }

  .add-block-button {
      margin-bottom: 8px;
  }
  
  .create-draft-button {
      margin-top: 16px;
      padding: 10px 20px;
      font-size: 1.1rem;
      background-color: ${props => props.theme.buttonPrimary};
      color: ${props => props.theme.buttonText};
      &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }
  }
  
  .preset-link-button {
      margin-bottom: 16px;
      background-color: ${props => props.theme.buttonSecondary};
      color: ${props => props.theme.buttonTextSecondary};
  }

  .error-message {
    color: #e53935;
    margin-top: 10px;
  }
`;

const CreatedLinksWrapper = styled.div`
  padding: 24px;
  background-color: ${props => props.theme.secondaryBackground};
  color: ${props => props.theme.text};
  border-radius: 8px;
  box-shadow: ${props => props.theme.cardShadow};
  margin: 20px 0;

  h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
  }

  li {
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
  }

  a {
    margin-right: 8px;
    word-break: break-all;
  }

  .copy-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0 4px;
    margin-left: 4px;
    font-size: 1.2rem;
    line-height: 1;
    
    &:hover {
        color: var(--accent-light);
    }
  }
  
  .create-another-button {
  }
`;

export default function DraftConstructor({ onDraftCreated }) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState([
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'pick', cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'pick', cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'pick', cardType: 'Character', count: 1, playerNum: 1 },
    { type: 'ban',  cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'pick',cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'pick',cardType: 'Character', count: 1, playerNum: 2 },
    { type: 'pick',cardType: 'Character', count: 1, playerNum: 1 },
  ]);

  function updateBlock(idx, field, value) {
    setBlocks(blocks => blocks.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  }
  function addBlock() {
    setBlocks(blocks => [...blocks, { ...defaultBlock }]);
  }
  function removeBlock(idx) {
    setBlocks(blocks => blocks.filter((_, i) => i !== idx));
  }
  function moveBlock(idx, dir) {
    setBlocks(blocks => {
      const arr = [...blocks];
      const target = arr[idx];
      arr.splice(idx, 1);
      arr.splice(idx + dir, 0, target);
      return arr;
    });
  }
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('preset');
    if (preset) {
      try {
        const decoded = JSON.parse(decodeURIComponent(preset));
        if (Array.isArray(decoded)) {
          setBlocks(decoded);
        }
      } catch (err) {
        console.error('Failed to parse preset', err);
      }
    }
  }, []);

  function copyToClipboard(text) {
    const url = text.startsWith('http') ? text : window.location.origin + text;
    navigator.clipboard.writeText(url);
  }
  function copyPresetLink() {
    const presetParam = encodeURIComponent(JSON.stringify(blocks));
    const urlPath = `${window.location.pathname}?preset=${presetParam}`;
    const fullLink = window.location.origin + urlPath;
    navigator.clipboard.writeText(fullLink);
  }

  async function createDraft() {
    setLoading(true); setError(null);
    try {
      const res = await apiPost('/api/drafts', { rules: { blocks } });
      const data = res;
      setLinks(data.links);
      if (onDraftCreated) onDraftCreated(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (links) {
    return (
      <CreatedLinksWrapper>
        <h2>{t('draft_created')}</h2>
        <ul>
          <li>
            {t('link_player1')}:&nbsp;
            <a href={links.player1} target="_blank" rel="noopener noreferrer">{t('link')}</a>
            <button onClick={() => copyToClipboard(links.player1)} className="copy-button" title={t('copy_link')}>📋</button>
          </li>
          <li>
            {t('link_player2')}:&nbsp;
            <a href={links.player2} target="_blank" rel="noopener noreferrer">{t('link')}</a>
            <button onClick={() => copyToClipboard(links.player2)} className="copy-button" title={t('copy_link')}>📋</button>
          </li>
          <li>
            {t('link_spectator')}:&nbsp;
            <a href={links.spectator} target="_blank" rel="noopener noreferrer">{t('link')}</a>
            <button onClick={() => copyToClipboard(links.spectator)} className="copy-button" title={t('copy_link')}>📋</button>
          </li>
        </ul>
        <button onClick={() => setLinks(null)} className="create-another-button">{t('create_another')}</button>
      </CreatedLinksWrapper>
    );
  }

  return (
    <ConstructorWrapper>
      <button type="button" onClick={copyPresetLink} className="preset-link-button">{t('copy_preset_link')}</button>
      <h2>{t('draft_constructor')}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t('type')}</th>
            <th>{t('card_type')}</th>
            <th>{t('count')}</th>
            <th>{t('player')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((b, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>
                <select value={b.type} onChange={e => updateBlock(idx, 'type', e.target.value)}>
                  <option value="pick">{t('pick')}</option>
                  <option value="ban">{t('ban')}</option>
                </select>
              </td>
              <td>
                <select value={b.cardType} onChange={e => updateBlock(idx, 'cardType', e.target.value)}>
                  <option value="Character">{t('character')}</option>
                  <option value="Action">{t('action')}</option>
                </select>
              </td>
              <td>
                <input type="number" min={1} max={b.cardType === 'Character' ? 3 : 30} value={b.count} onChange={e => updateBlock(idx, 'count', Number(e.target.value) || 1)} />
              </td>
              <td>
                <select value={b.playerNum} onChange={e => updateBlock(idx, 'playerNum', Number(e.target.value))}>
                  <option value={1}>{t('player')} 1</option>
                  <option value={2}>{t('player')} 2</option>
                </select>
              </td>
              <td>
                <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0} title={t('up')}>↑</button>
                <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} title={t('down')}>↓</button>
                <button type="button" onClick={() => removeBlock(idx)} disabled={blocks.length <= 1} title={t('delete')}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addBlock} className="add-block-button">+ {t('add_block')}</button>
      <br />
      <button onClick={createDraft} disabled={loading} className="create-draft-button">{loading ? t('creating') : t('create_draft')}</button>
      {error && <div className="error-message">{error}</div>}
    </ConstructorWrapper>
  );
}
