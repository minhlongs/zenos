'use strict';

function extractSystemMessage(system) {
  if (!system) return null;
  if (typeof system === 'string') {
    return { role: 'system', content: system };
  }
  if (Array.isArray(system)) {
    const textParts = [];
    for (const block of system) {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        textParts.push(block.text);
      } else {
        throw new Error(`Unsupported system block type: ${block ? block.type : 'unknown'}`);
      }
    }
    return { role: 'system', content: textParts.join('\n\n') };
  }
  throw new Error('System prompt must be a string or array of text blocks');
}

function translateContentBlocks(content, role) {
  if (typeof content === 'string') {
    return { text: content, toolCalls: null, toolResults: null };
  }
  if (!Array.isArray(content)) {
    throw new Error('Content must be a string or an array of content blocks');
  }

  const textParts = [];
  const toolCalls = [];
  const toolResults = [];

  for (const block of content) {
    if (!block || typeof block !== 'object') throw new Error('Invalid content block format');
    switch (block.type) {
      case 'text':
        if (typeof block.text !== 'string') throw new Error('Text block missing string text property');
        textParts.push(block.text);
        break;
      case 'image':
        if (role !== 'user') throw new Error('Image blocks are only supported in user messages');
        if (!block.source || block.source.type !== 'base64' || !block.source.data) {
          throw new Error('Invalid image block source');
        }
        textParts.push({
          type: 'image_url',
          image_url: { url: `data:${block.source.media_type || 'image/jpeg'};base64,${block.source.data}` }
        });
        break;
      case 'tool_use':
        if (role !== 'assistant') throw new Error('tool_use blocks are only valid in assistant messages');
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: typeof block.input === 'string' ? block.input : JSON.stringify(block.input || {})
          }
        });
        break;
      case 'tool_result':
        if (role !== 'user') throw new Error('tool_result blocks are only valid in user messages');
        toolResults.push({
          role: 'tool',
          tool_call_id: block.tool_use_id,
          content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '')
        });
        break;
      default:
        throw new Error(`Unsupported content block type: ${block.type}`);
    }
  }

  return {
    text: textParts.length === 1 && typeof textParts[0] === 'string' ? textParts[0] : (textParts.length > 0 ? textParts : ''),
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
    toolResults: toolResults.length > 0 ? toolResults : null
  };
}

function translateAnthropicToOpenAI(anthropicReq) {
  if (!anthropicReq || typeof anthropicReq !== 'object') throw new Error('Request body must be a JSON object');
  if (!anthropicReq.model || typeof anthropicReq.model !== 'string') throw new Error('Missing required field: model');
  if (!Array.isArray(anthropicReq.messages) || anthropicReq.messages.length === 0) {
    throw new Error('Missing or empty required field: messages');
  }

  const openAiMessages = [];
  const systemMsg = extractSystemMessage(anthropicReq.system);
  if (systemMsg) openAiMessages.push(systemMsg);

  for (const msg of anthropicReq.messages) {
    if (!msg || (msg.role !== 'user' && msg.role !== 'assistant')) {
      throw new Error(`Invalid message role: ${msg ? msg.role : 'undefined'}`);
    }
    const { text, toolCalls, toolResults } = translateContentBlocks(msg.content, msg.role);
    if (toolResults) {
      for (const tr of toolResults) openAiMessages.push(tr);
    }
    const hasText = (typeof text === 'string' && text.length > 0) || (Array.isArray(text) && text.length > 0);
    const hasTools = Boolean(toolCalls && toolCalls.length > 0);
    const hasResults = Boolean(toolResults && toolResults.length > 0);

    if (hasText || hasTools || !hasResults) {
      const outMsg = { role: msg.role };
      if (hasText) outMsg.content = text;
      else if (!hasTools) outMsg.content = '';
      if (hasTools) outMsg.tool_calls = toolCalls;
      openAiMessages.push(outMsg);
    }
  }

  const openAiReq = {
    model: anthropicReq.model,
    messages: openAiMessages,
    stream: Boolean(anthropicReq.stream)
  };

  if (anthropicReq.max_tokens !== undefined) openAiReq.max_tokens = anthropicReq.max_tokens;
  if (anthropicReq.temperature !== undefined) openAiReq.temperature = anthropicReq.temperature;
  if (anthropicReq.top_p !== undefined) openAiReq.top_p = anthropicReq.top_p;
  if (Array.isArray(anthropicReq.stop_sequences)) openAiReq.stop = anthropicReq.stop_sequences;

  if (Array.isArray(anthropicReq.tools) && anthropicReq.tools.length > 0) {
    openAiReq.tools = anthropicReq.tools.map(tool => {
      if (!tool.name || typeof tool.name !== 'string') throw new Error('Tool definition missing name property');
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.input_schema || { type: 'object', properties: {} }
        }
      };
    });
  }

  return openAiReq;
}

module.exports = { translateAnthropicToOpenAI, extractSystemMessage, translateContentBlocks };
