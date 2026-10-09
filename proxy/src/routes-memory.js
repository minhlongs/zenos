'use strict';

const express = require('express');
const { saveMarkdownMemory, listMarkdownMemories, loadMarkdownMemory } = require('./markdown-memory');

function createMemoryRouter({ taskStore, markdownDir }) {
  const router = express.Router();

  // Sessions
  router.post('/sessions', (req, res) => {
    const session = taskStore.createSession(req.body || {});
    res.status(201).json(session);
  });

  router.get('/sessions', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    res.status(200).json(taskStore.listSessions(limit));
  });

  router.get('/sessions/:id', (req, res) => {
    const session = taskStore.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json(session);
  });

  // Tasks
  router.post('/tasks', (req, res) => {
    const task = taskStore.createTask(req.body || {});
    res.status(201).json(task);
  });

  router.get('/tasks', (req, res) => {
    const sessionId = req.query.session_id || null;
    const limit = parseInt(req.query.limit, 10) || 50;
    res.status(200).json(taskStore.listTasks(sessionId, limit));
  });

  router.get('/tasks/:id', (req, res) => {
    const task = taskStore.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  });

  router.patch('/tasks/:id', (req, res) => {
    try {
      const { status, output, error } = req.body || {};
      const updated = taskStore.updateTaskStatus(req.params.id, status, { output, error });
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Memory
  router.post('/memory', (req, res) => {
    try {
      const { name, description, metadata, content } = req.body || {};
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Missing required field: name' });
      }
      saveMarkdownMemory(markdownDir, { name, description, metadata, content });
      res.status(201).json({ status: 'saved', name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/memory', (req, res) => {
    res.status(200).json(listMarkdownMemories(markdownDir));
  });

  router.get('/memory/:name', (req, res) => {
    const memory = loadMarkdownMemory(markdownDir, req.params.name);
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.status(200).json(memory);
  });

  return router;
}

module.exports = { createMemoryRouter };
