'use strict';

/**
 * Estimates token count from raw text (~4 characters per token).
 */
function estimateTokens(text) {
  if (typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimates tokens for an individual chat message.
 */
function estimateMessageTokens(message) {
  if (!message || typeof message !== 'object') return 0;
  let contentTokens = 0;
  if (typeof message.content === 'string') {
    contentTokens = estimateTokens(message.content);
  } else if (Array.isArray(message.content)) {
    contentTokens = message.content.reduce((acc, part) => {
      if (typeof part === 'string') return acc + estimateTokens(part);
      if (part && typeof part.text === 'string') return acc + estimateTokens(part.text);
      return acc;
    }, 0);
  }
  return contentTokens + 4; // Overhead for role and framing
}

/**
 * Compacts a list of messages using a sliding window.
 * Keeps system prompt pinned, retains recent messages up to maxRecentTokens,
 * and summarizes trimmed historical messages.
 */
function compactMessages(messages, options = {}) {
  const {
    maxRecentTokens = 4000,
    maxTotalTokens = 8000,
    summarizer = null
  } = options;

  if (!Array.isArray(messages) || messages.length <= 2) {
    return {
      messages: Array.isArray(messages) ? [...messages] : [],
      compacted: false,
      totalTokens: (messages || []).reduce((acc, m) => acc + estimateMessageTokens(m), 0)
    };
  }

  // 1. Separate system message(s) from conversation history
  const systemMessages = messages.filter(m => m.role === 'system');
  const dialogueMessages = messages.filter(m => m.role !== 'system');

  const systemTokens = systemMessages.reduce((acc, m) => acc + estimateMessageTokens(m), 0);
  let dialogueTokens = dialogueMessages.reduce((acc, m) => acc + estimateMessageTokens(m), 0);

  // If total tokens are within allowed ceiling, return as-is
  if (systemTokens + dialogueTokens <= maxTotalTokens) {
    return {
      messages: [...messages],
      compacted: false,
      totalTokens: systemTokens + dialogueTokens
    };
  }

  // 2. Sliding window: scan backwards from most recent message
  const recentMessages = [];
  let accumulatedRecent = 0;

  for (let i = dialogueMessages.length - 1; i >= 0; i--) {
    const msg = dialogueMessages[i];
    const msgTokens = estimateMessageTokens(msg);
    if (accumulatedRecent + msgTokens <= maxRecentTokens || recentMessages.length === 0) {
      recentMessages.unshift(msg);
      accumulatedRecent += msgTokens;
    } else {
      break;
    }
  }

  const trimmedCount = dialogueMessages.length - recentMessages.length;
  if (trimmedCount <= 0) {
    return {
      messages: [...messages],
      compacted: false,
      totalTokens: systemTokens + dialogueTokens
    };
  }

  const trimmedMessages = dialogueMessages.slice(0, trimmedCount);

  // 3. Formulate compact summary of trimmed messages
  let summaryText;
  if (typeof summarizer === 'function') {
    summaryText = summarizer(trimmedMessages);
  } else {
    const overview = trimmedMessages
      .map(m => `[${m.role.toUpperCase()}]: ${typeof m.content === 'string' ? m.content.slice(0, 100) : '...'}`)
      .join('\n');
    summaryText = `[COMPACTED CONTEXT: ${trimmedCount} historical turns summarized]\n${overview}`;
  }

  const summaryMessage = {
    role: 'system',
    content: summaryText
  };

  const compactedResult = [
    ...systemMessages,
    summaryMessage,
    ...recentMessages
  ];

  const totalTokens = compactedResult.reduce((acc, m) => acc + estimateMessageTokens(m), 0);

  return {
    messages: compactedResult,
    compacted: true,
    trimmedCount,
    totalTokens
  };
}

module.exports = {
  estimateTokens,
  estimateMessageTokens,
  compactMessages
};
