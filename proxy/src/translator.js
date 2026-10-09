'use strict';

const { translateAnthropicToOpenAI, extractSystemMessage, translateContentBlocks } = require('./request-translator');
const { translateOpenAIToAnthropic, mapFinishReason } = require('./response-translator');

module.exports = {
  translateAnthropicToOpenAI,
  extractSystemMessage,
  translateContentBlocks,
  translateOpenAIToAnthropic,
  mapFinishReason
};
