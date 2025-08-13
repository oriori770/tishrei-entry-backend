import { Request, Response } from 'express';

type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

interface ClientLog {
  level?: ClientLogLevel;
  message: string;
  meta?: Record<string, unknown>;
  context?: any; // alias from frontend
  timestamp?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
}

function safeConsole(level: ClientLogLevel) {
  switch (level) {
    case 'debug':
      return console.debug.bind(console);
    case 'info':
      return console.info.bind(console);
    case 'warn':
      return console.warn.bind(console);
    case 'error':
      return console.error.bind(console);
    default:
      return console.log.bind(console);
  }
}

function normalizePayload(payload: ClientLog): ClientLog {
  if (!payload) return payload;
  if (payload.context && !payload.meta) {
    payload.meta = payload.context as any;
  }
  return payload;
}

function printLog(req: Request, payload: ClientLog) {
  const normalized = normalizePayload(payload);
  const { level = 'log', message, meta, timestamp, userId, url, userAgent } = normalized || {};
  const log = safeConsole(level);

  const base = {
    source: 'client',
    level,
    message,
    timestamp: timestamp || new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: userId || null,
  } as Record<string, unknown>;

  if (meta && typeof meta === 'object') {
    base.meta = meta;
  }

  if (url) base.clientUrl = url;
  if (userAgent) base.clientUserAgent = userAgent;

  log('[client-log]', base);
}

export async function receiveLog(req: Request, res: Response) {
  try {
    const body = req.body as ClientLog | ClientLog[];

    if (!body) {
      return res.status(400).json({ success: false, error: 'Missing body' });
    }

    if (Array.isArray(body)) {
      for (const item of body) {
        if (item && typeof (item as any).message === 'string') {
          printLog(req, item);
        }
      }
    } else if (typeof body === 'object') {
      if (!('message' in body) || typeof body.message !== 'string') {
        return res.status(400).json({ success: false, error: 'Missing "message" field' });
      }
      printLog(req, body as ClientLog);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling client log:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}


