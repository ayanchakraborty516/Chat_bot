/**
 * Chat & Gemini Streaming Routes
 * 
 * Provides real-time SSE streaming for Gemini chat completions directly from Express.
 * Keeps GEMINI_API_KEY secure on the server side.
 * Pure JavaScript - No TypeScript.
 */

import express from 'express';
import { backendGeminiService } from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /api/chat/stream
 * Server-Sent Events (SSE) streaming endpoint
 */
router.post('/stream', async (req, res) => {
  const {
    prompt,
    messages = [],
    attachments = [],
    modelId,
    apiKey, // optional client override from settings
    systemInstruction,
    temperature,
    searchContext = '',
    sources = [],
  } = req.body;

  if (!prompt && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Prompt or attachments are required' });
  }

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable proxy buffering on Render / Nginx
  });

  const abortController = new AbortController();

  // If client disconnects early before response finishes
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const finalCompletedText = await backendGeminiService.streamChat({
      prompt,
      messages,
      attachments,
      modelId,
      apiKey,
      systemInstruction,
      temperature,
      searchContext,
      sources,
      signal: abortController.signal,
      onModelUsed: (modelUsed) => {
        res.write(`data: ${JSON.stringify({ type: 'model', model: modelUsed })}\n\n`);
      },
      onChunk: (chunkText) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'done', fullText: finalCompletedText })}\n\n`);
    res.end();
  } catch (error) {
    if (abortController.signal.aborted) {
      return res.end();
    }

    console.error('[Chat API] Stream error:', error.message);
    const friendlyMessage =
      error.message?.includes('temporarily busy') || error.message?.includes('503')
        ? 'Ayan AI is temporarily busy. Please try again in a few seconds.'
        : error.message || 'Failed to generate response.';

    res.write(`data: ${JSON.stringify({ type: 'error', error: friendlyMessage })}\n\n`);
    res.end();
  }
});

export default router;
