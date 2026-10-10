export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Human-Powered Treasure Hunt API',
    version: '1.0.0',
    description: 'REST API backend for Human-Powered Treasure Hunt — An AI-powered real-world treasure hunt using Gemini and Google Maps Platform.',
    contact: {
      name: 'Human-Powered Treasure Hunt Team'
    }
  },
  paths: {
    '/api/generate-hunt': {
      post: {
        summary: 'Generate a new real-world treasure hunt',
        description: 'Gemini creates a multi-stop treasure hunt with physical observation clues and safe public locations.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  locationName: { type: 'string' },
                  theme: { type: 'string' },
                  durationMinutes: { type: 'number' },
                  difficulty: { type: 'string' },
                  numberOfStops: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Structured TreasureHunt object' }
        }
      }
    },
    '/api/next-clue': {
      post: {
        summary: 'Evaluate physical finding & generate next clue',
        description: 'Gemini evaluates what the user discovered at a stop and adapts feedback.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stopNumber: { type: 'number' },
                  userObservation: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Evaluation feedback & next stop details' }
        }
      }
    },
    '/api/chat': {
      post: {
        summary: 'Hunt Guide AI Chatbot',
        description: 'Conversational assistant guiding real-world treasure hunters.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Hunt Guide answer' }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'General system health check',
        responses: {
          '200': { description: 'Health status object' }
        }
      }
    },
    '/api/health/services': {
      get: {
        summary: 'Services & API configuration status',
        description: 'Returns connected/configured status for Gemini, SerpApi, Google Maps, and Browser Storage.',
        responses: {
          '200': { description: 'Structured services health breakdown' }
        }
      }
    }
  }
};

export function getSwaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Human-Powered Treasure Hunt API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #030712; color: #f3f4f6; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>`;
}
