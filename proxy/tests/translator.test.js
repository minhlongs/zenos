'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  translateAnthropicToOpenAI,
  translateOpenAIToAnthropic,
  mapFinishReason
} = require('../src/translator');

describe('Translator — Anthropic to OpenAI Request', () => {
  it('translates basic user message with model and text', () => {
    const input = {
      model: 'qwen2.5-coder',
      messages: [{ role: 'user', content: 'Hello world' }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.model, 'qwen2.5-coder');
    assert.equal(output.stream, false);
    assert.deepEqual(output.messages, [{ role: 'user', content: 'Hello world' }]);
  });

  it('translates system prompt string into system message', () => {
    const input = {
      model: 'qwen2.5-coder',
      system: 'You are an assistant',
      messages: [{ role: 'user', content: 'Hi' }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.messages.length, 2);
    assert.deepEqual(output.messages[0], { role: 'system', content: 'You are an assistant' });
  });

  it('translates system prompt array of text blocks', () => {
    const input = {
      model: 'qwen2.5-coder',
      system: [{ type: 'text', text: 'Part 1' }, { type: 'text', text: 'Part 2' }],
      messages: [{ role: 'user', content: 'Hi' }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.messages[0].content, 'Part 1\n\nPart 2');
  });

  it('translates tools definition to OpenAI functions', () => {
    const input = {
      model: 'qwen2.5-coder',
      messages: [{ role: 'user', content: 'Call tool' }],
      tools: [{
        name: 'get_weather',
        description: 'Get weather in city',
        input_schema: { type: 'object', properties: { city: { type: 'string' } } }
      }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.tools.length, 1);
    assert.equal(output.tools[0].type, 'function');
    assert.equal(output.tools[0].function.name, 'get_weather');
  });

  it('translates assistant tool_use content blocks to tool_calls', () => {
    const input = {
      model: 'qwen2.5-coder',
      messages: [{
        role: 'assistant',
        content: [
          { type: 'text', text: 'Checking weather' },
          { type: 'tool_use', id: 'call_123', name: 'get_weather', input: { city: 'Hanoi' } }
        ]
      }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.messages.length, 1);
    assert.equal(output.messages[0].content, 'Checking weather');
    assert.deepEqual(output.messages[0].tool_calls, [{
      id: 'call_123',
      type: 'function',
      function: { name: 'get_weather', arguments: '{"city":"Hanoi"}' }
    }]);
  });

  it('translates user tool_result blocks to role tool messages', () => {
    const input = {
      model: 'qwen2.5-coder',
      messages: [{
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'call_123', content: 'Sunny 28C' }
        ]
      }]
    };
    const output = translateAnthropicToOpenAI(input);
    assert.equal(output.messages.length, 1);
    assert.equal(output.messages[0].role, 'tool');
    assert.equal(output.messages[0].tool_call_id, 'call_123');
    assert.equal(output.messages[0].content, 'Sunny 28C');
  });

  it('rejects unsupported content block types with explicit error', () => {
    const input = {
      model: 'qwen2.5-coder',
      messages: [{
        role: 'user',
        content: [{ type: 'unknown_block_xyz', data: 'test' }]
      }]
    };
    assert.throws(() => translateAnthropicToOpenAI(input), /Unsupported content block type: unknown_block_xyz/);
  });

  it('rejects missing model or messages', () => {
    assert.throws(() => translateAnthropicToOpenAI({}), /Missing required field: model/);
    assert.throws(() => translateAnthropicToOpenAI({ model: 'test' }), /Missing or empty required field: messages/);
    assert.throws(() => translateAnthropicToOpenAI({ model: 'test', messages: [] }), /Missing or empty required field: messages/);
  });
});

describe('Translator — OpenAI to Anthropic Response', () => {
  it('translates text response correctly', () => {
    const openAiRes = {
      id: 'chatcmpl-1',
      model: 'qwen2.5-coder',
      choices: [{
        message: { role: 'assistant', content: 'Hello!' },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 15, completion_tokens: 5 }
    };
    const output = translateOpenAIToAnthropic(openAiRes, 'qwen2.5-coder');
    assert.equal(output.id, 'chatcmpl-1');
    assert.equal(output.type, 'message');
    assert.equal(output.role, 'assistant');
    assert.equal(output.content.length, 1);
    assert.deepEqual(output.content[0], { type: 'text', text: 'Hello!' });
    assert.equal(output.stop_reason, 'end_turn');
    assert.deepEqual(output.usage, { input_tokens: 15, output_tokens: 5 });
  });

  it('translates tool_calls in OpenAI response to Anthropic tool_use blocks', () => {
    const openAiRes = {
      id: 'chatcmpl-2',
      model: 'qwen2.5-coder',
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_99',
            type: 'function',
            function: { name: 'get_weather', arguments: '{"city":"Saigon"}' }
          }]
        },
        finish_reason: 'tool_calls'
      }]
    };
    const output = translateOpenAIToAnthropic(openAiRes, 'qwen2.5-coder');
    assert.equal(output.stop_reason, 'tool_use');
    assert.equal(output.content.length, 1);
    assert.deepEqual(output.content[0], {
      type: 'tool_use',
      id: 'call_99',
      name: 'get_weather',
      input: { city: 'Saigon' }
    });
  });

  it('maps finish reasons properly', () => {
    assert.equal(mapFinishReason('stop'), 'end_turn');
    assert.equal(mapFinishReason('length'), 'max_tokens');
    assert.equal(mapFinishReason('tool_calls'), 'tool_use');
    assert.equal(mapFinishReason('function_call'), 'tool_use');
    assert.equal(mapFinishReason(null), null);
  });
});
