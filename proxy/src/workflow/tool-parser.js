'use strict';

/**
 * Parses tool invocations from local model text completions.
 * Supports:
 *  1. <tool_call name="...">JSON</tool_call>
 *  2. <tool_call>{"name":"...", "arguments":{...}}</tool_call>
 *  3. Fallback ```json blocks
 */
function parseToolCalls(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { valid: true, calls: [], remainingText: '' };
  }

  const calls = [];
  let remainingText = rawText;

  // Pattern 1: <tool_call name="tool_name">{args}</tool_call>
  const namedXmlRegex = /<tool_call\s+name=["']([^"']+)["']>([\s\S]*?)<\/tool_call>/gi;
  let match;
  while ((match = namedXmlRegex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const argsRaw = match[2].trim();
    try {
      const parsedArgs = argsRaw ? JSON.parse(argsRaw) : {};
      calls.push({ name, arguments: parsedArgs });
    } catch {
      calls.push({ name, arguments: { raw: argsRaw } });
    }
  }

  if (calls.length > 0) {
    remainingText = rawText.replace(namedXmlRegex, '').trim();
    return { valid: true, calls, remainingText };
  }

  // Pattern 2: <tool_call>{"name":"...", "arguments":{...}}</tool_call>
  const genericXmlRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  while ((match = genericXmlRegex.exec(rawText)) !== null) {
    const body = match[1].trim();
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed.name === 'string') {
        calls.push({
          name: parsed.name,
          arguments: parsed.arguments || parsed.parameters || {}
        });
      }
    } catch {
      // Ignore unparseable blocks
    }
  }

  if (calls.length > 0) {
    remainingText = rawText.replace(genericXmlRegex, '').trim();
    return { valid: true, calls, remainingText };
  }

  // Pattern 3: Fallback ```json code blocks with tool invocation structure
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  while ((match = jsonBlockRegex.exec(rawText)) !== null) {
    const snippet = match[1].trim();
    try {
      const parsed = JSON.parse(snippet);
      if (parsed && typeof parsed.name === 'string' && (parsed.arguments || parsed.parameters)) {
        calls.push({
          name: parsed.name,
          arguments: parsed.arguments || parsed.parameters
        });
      }
    } catch {
      // Ignore non-tool json
    }
  }

  if (calls.length > 0) {
    remainingText = rawText.replace(jsonBlockRegex, '').trim();
  }

  return { valid: true, calls, remainingText };
}

function formatToolResponse(toolName, result) {
  const content = typeof result === 'object' ? JSON.stringify(result) : String(result);
  return `<tool_response name="${toolName}">\n${content}\n</tool_response>`;
}

module.exports = {
  parseToolCalls,
  formatToolResponse
};
