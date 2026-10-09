'use strict';

function mapFinishReason(reason) {
  switch (reason) {
    case 'stop':
      return 'end_turn';
    case 'tool_calls':
    case 'function_call':
      return 'tool_use';
    case 'length':
      return 'max_tokens';
    default:
      return reason ? 'end_turn' : null;
  }
}

function translateOpenAIToAnthropic(openAiRes, requestedModel) {
  if (!openAiRes || typeof openAiRes !== 'object') {
    throw new Error('Malformed upstream response: not an object');
  }

  const choice = openAiRes.choices && openAiRes.choices[0];
  if (!choice || !choice.message) {
    throw new Error('Malformed upstream response: choices array empty or invalid');
  }

  const contentBlocks = [];
  const message = choice.message;

  if (message.content && typeof message.content === 'string') {
    contentBlocks.push({
      type: 'text',
      text: message.content
    });
  }

  if (Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      let parsedArgs = {};
      try {
        if (tc.function && tc.function.arguments) {
          parsedArgs = JSON.parse(tc.function.arguments);
        }
      } catch {
        parsedArgs = { raw: tc.function.arguments };
      }

      contentBlocks.push({
        type: 'tool_use',
        id: tc.id || `call_${Math.random().toString(36).slice(2, 10)}`,
        name: tc.function ? tc.function.name : 'unknown',
        input: parsedArgs
      });
    }
  }

  if (contentBlocks.length === 0) {
    contentBlocks.push({ type: 'text', text: '' });
  }

  return {
    id: openAiRes.id || `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: contentBlocks,
    model: openAiRes.model || requestedModel || 'unknown',
    stop_reason: mapFinishReason(choice.finish_reason),
    stop_sequence: null,
    usage: {
      input_tokens: openAiRes.usage ? openAiRes.usage.prompt_tokens || 0 : 0,
      output_tokens: openAiRes.usage ? openAiRes.usage.completion_tokens || 0 : 0
    }
  };
}

module.exports = { mapFinishReason, translateOpenAIToAnthropic };
