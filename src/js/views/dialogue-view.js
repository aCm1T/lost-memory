import { el, assetUrl, clear } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState, setState } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { renderGameNav } from '../components/game-nav.js';
import {
  askTopic,
  getCharacterById,
  getDialogueHistoryForCharacter,
  listInterviewableCharacters,
  listTopicsForCharacter,
} from '../systems/dialogue-system.js';

export function renderPeopleView(root) {
  const state = getState();
  if (!state.caseId) {
    navigate('/cases');
    return;
  }
  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(el('section', { className: 'view panel' }, [el('p', { text: loaded.error })]));
    return;
  }
  const caseData = getLoadedCase(state.caseId);
  const people = listInterviewableCharacters(caseData, state);

  root.append(
    el('section', { className: 'view', attrs: { 'aria-labelledby': 'people-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Interviews' }),
        el('h1', { id: 'people-title', text: '人物询问' }),
        el('p', { text: '选择对象进行问话。新解锁的问题会标出提示。' }),
      ]),
      el(
        'div',
        { className: 'people-grid' },
        people.map((item) =>
          el(
            'button',
            {
              type: 'button',
              className: 'person-card',
              on: { click: () => navigate(`/dialogue/${item.character.id}`) },
            },
            [
              el('img', {
                className: 'person-card__portrait',
                src: assetUrl(item.character.portrait),
                alt: `${item.character.name} 肖像`,
              }),
              el('div', { className: 'person-card__body' }, [
                el('h2', { text: item.character.name }),
                el('p', { text: item.character.role }),
                el('p', {
                  className: 'overview-card__meta',
                  text:
                    item.newCount > 0
                      ? `可问 ${item.availableCount} · 新问题 ${item.newCount}`
                      : `可问 ${item.availableCount} · 已问 ${item.askedCount}`,
                }),
              ]),
            ],
          ),
        ),
      ),
      renderGameNav('people'),
    ]),
  );
}

export function renderDialogueView(root, characterId) {
  const state = getState();
  if (!state.caseId) {
    navigate('/cases');
    return;
  }
  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(el('section', { className: 'view panel' }, [el('p', { text: loaded.error })]));
    return;
  }

  const caseData = getLoadedCase(state.caseId);
  const character = getCharacterById(caseData, characterId);
  if (!character || !character.interviewable) {
    root.append(
      el('section', { className: 'view panel' }, [
        el('h1', { text: '无法询问该人物' }),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn--primary',
            on: { click: () => navigate('/people') },
          },
          '返回人物列表',
        ),
      ]),
    );
    return;
  }

  setState({ currentCharacterId: characterId });
  const shell = el('section', {
    className: 'view dialogue-shell',
    attrs: { 'aria-labelledby': 'dialogue-title' },
  });
  root.append(shell);

  const paint = () => {
    const topics = listTopicsForCharacter(caseData, characterId, getState());
    const history = getDialogueHistoryForCharacter(characterId, getState());

    clear(shell);

    const topicButtons = topics.map(({ topic, unlocked, asked, isNew }) => {
      if (!unlocked) {
        return el(
          'button',
          {
            type: 'button',
            className: 'topic-btn is-locked',
            disabled: true,
            attrs: { 'aria-label': `${topic.question}（未解锁）` },
          },
          [el('span', { text: '未解锁问题' }), el('small', { text: '需要更多线索或进展' })],
        );
      }

      return el(
        'button',
        {
          type: 'button',
          className: `topic-btn${asked ? ' is-asked' : ''}${isNew ? ' is-new' : ''}`,
          attrs: {
            'aria-label': `${topic.question}${isNew ? '（新）' : ''}${asked ? '（已问）' : ''}`,
          },
          on: {
            click: () => {
              const result = askTopic(caseData, characterId, topic.id);
              if (!result.ok) {
                showToast('现在还不能问这个问题');
                return;
              }
              saveGame();
              if (result.clues.length) {
                openModal({
                  title: '问话中获得线索',
                  bodyNodes: result.clues.map((clue) =>
                    el('article', { className: 'clue-found' }, [
                      el('h3', { text: clue.name }),
                      el('p', { text: clue.detailDescription || clue.shortDescription }),
                    ]),
                  ),
                  actions: [{ label: '继续', primary: true }],
                });
                showToast(`获得线索：${result.clues.map((c) => c.name).join('、')}`);
              }
              paint();
              const log = shell.querySelector('.dialogue-log');
              if (log) log.scrollTop = log.scrollHeight;
            },
          },
        },
        [
          el('span', {
            className: 'topic-btn__label',
            text: isNew ? `新 · ${topic.question}` : topic.question,
          }),
          el('small', { text: asked ? '已询问 · 可再次查看' : '点击询问' }),
        ],
      );
    });

    const historyNodes = history.length
      ? history.map((entry) =>
          el('article', { className: 'dialogue-entry' }, [
            el('p', { className: 'dialogue-entry__q', text: `你：${entry.question}` }),
            el('p', {
              className: 'dialogue-entry__a',
              text: `${character.name}：${entry.answer}`,
            }),
          ]),
        )
      : [el('p', { className: 'placeholder-note', text: '选择右侧问题开始询问。' })];

    shell.append(
      el('header', { className: 'dialogue-header' }, [
        el('img', {
          className: 'dialogue-portrait',
          src: assetUrl(character.portrait),
          alt: `${character.name} 肖像`,
        }),
        el('div', {}, [
          el('p', { className: 'eyebrow', text: character.role }),
          el('h1', { id: 'dialogue-title', text: character.name }),
          el('p', { text: character.bio }),
        ]),
        el(
          'button',
          {
            type: 'button',
            className: 'btn',
            on: { click: () => navigate('/people') },
          },
          '人物列表',
        ),
      ]),
      el('div', { className: 'dialogue-layout' }, [
        el('div', { className: 'dialogue-log', attrs: { 'aria-live': 'polite' } }, historyNodes),
        el('div', { className: 'dialogue-topics', attrs: { 'aria-label': '可问问题' } }, [
          el('h2', { text: '问题列表' }),
          ...topicButtons,
        ]),
      ]),
      renderGameNav('people'),
    );
  };

  paint();
  saveGame();
}
