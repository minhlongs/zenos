'use strict';

const { mapFinishReason } = require('./response-translator');

function sendEvent(res, eventName, data) {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function handleStreamingResponse(upstreamResponse, res, req, requestedModel) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const msgId = `msg_${Date.now()}`;
  let hasClosed = false;
  const cleanup = () => { hasClosed = true; };
  req.on('close', cleanup);

  sendEvent(res, 'message_start', {
    type: 'message_start',
    message: {
      id: msgId,
      type: 'message',
      role: 'assistant',
      content: [],
      model: requestedModel,
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 }
    }
  });

  let currentBlockType = null;
  let currentBlockIndex = -1;
  let totalOutputTokens = 0;
  let finishReason = 'end_turn';
  const openToolCalls = new Map();

  const reader = upstreamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (!hasClosed) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payloadStr = trimmed.slice(5).trim();
        if (payloadStr === '[DONE]') continue;

        let parsed;
        try { parsed = JSON.parse(payloadStr); } catch { continue; }
        const choice = parsed.choices && parsed.choices[0];
        if (!choice) continue;

        if (choice.finish_reason) {
          finishReason = mapFinishReason(choice.finish_reason) || 'end_turn';
        }

        const delta = choice.delta;
        if (!delta) continue;

        if (delta.content) {
          if (currentBlockType !== 'text') {
            if (currentBlockType !== null) {
              sendEvent(res, 'content_block_stop', { type: 'content_block_stop', index: currentBlockIndex });
            }
            currentBlockIndex++;
            currentBlockType = 'text';
            sendEvent(res, 'content_block_start', {
              type: 'content_block_start',
              index: currentBlockIndex,
              content_block: { type: 'text', text: '' }
            });
          }
          totalOutputTokens++;
          sendEvent(res, 'content_block_delta', {
            type: 'content_block_delta',
            index: currentBlockIndex,
            delta: { type: 'text_delta', text: delta.content }
          });
        }

        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!openToolCalls.has(idx)) {
              if (currentBlockType !== null) {
                sendEvent(res, 'content_block_stop', { type: 'content_block_stop', index: currentBlockIndex });
              }
              currentBlockIndex++;
              currentBlockType = 'tool_use';
              const toolId = tc.id || `call_${Date.now()}_${idx}`;
              const toolName = tc.function?.name || 'tool';
              openToolCalls.set(idx, { id: toolId, name: toolName, blockIndex: currentBlockIndex });
              sendEvent(res, 'content_block_start', {
                type: 'content_block_start',
                index: currentBlockIndex,
                content_block: { type: 'tool_use', id: toolId, name: toolName, input: {} }
              });
            }
            if (tc.function?.arguments) {
              const active = openToolCalls.get(idx);
              sendEvent(res, 'content_block_delta', {
                type: 'content_block_delta',
                index: active.blockIndex,
                delta: { type: 'input_json_delta', partial_json: tc.function.arguments }
              });
            }
          }
        }
      }
    }

    if (currentBlockType !== null) {
      sendEvent(res, 'content_block_stop', { type: 'content_block_stop', index: currentBlockIndex });
    }

    sendEvent(res, 'message_delta', {
      type: 'message_delta',
      delta: { stop_reason: finishReason, stop_sequence: null },
      usage: { output_tokens: totalOutputTokens }
    });
    sendEvent(res, 'message_stop', { type: 'message_stop' });
    res.end();
  } catch (err) {
    if (!hasClosed) {
      sendEvent(res, 'error', {
        type: 'error',
        error: { type: 'api_error', message: err.message }
      });
      res.end();
    }
  } finally {
    req.off('close', cleanup);
  }
}

module.exports = { sendEvent, handleStreamingResponse };
