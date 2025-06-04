import fp from 'fastify-plugin';
import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'logs', 'requests.log');

async function loggerPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - request.startTime;
    const logEntry = {
      ip: request.ip,
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      data: request.body || {},
      query: request.query || {},
      headers: request.headers || {},
      params: request.params || {},
      responseTime:
      duration,
      timestamp: new Date().toISOString(),
    };

    const line = JSON.stringify(logEntry) + '\n';

    fs.appendFile(logFilePath, line, err => {
      if (err) console.error('Erro ao escrever log:', err);
    });
  });
}

export default fp(loggerPlugin);
