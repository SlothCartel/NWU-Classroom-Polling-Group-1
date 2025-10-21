import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NWU Live Poll API',
      version: '1.0.0',
      description: `
        Real-time classroom polling system API for the North-West University.

        ## Features
        - JWT-based authentication for lecturers and students
        - Real-time poll management with WebSocket support
        - Live student participation and answer tracking
        - Comprehensive analytics and statistics
        - Export capabilities for poll results

        ## Authentication
        Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
        \`Authorization: Bearer <your_jwt_token>\`

        Tokens are obtained through login endpoints and expire after 7 days.
      `,
      contact: {
        name: 'NWU Development Team',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://nwu-live-poll-api.azurewebsites.net',
        description: 'Production server (Azure)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login endpoints',
        },
      },
      schemas: {
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Dr. John Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.smith@nwu.ac.za',
            },
            role: {
              type: 'string',
              enum: ['student', 'lecturer'],
              example: 'lecturer',
            },
            studentNumber: {
              type: 'string',
              example: '12345678',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Auth Response
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        // Option Schema
        Option: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            text: {
              type: 'string',
              example: '299,792,458 m/s',
            },
            index: {
              type: 'integer',
              example: 0,
              description: 'Option index (A=0, B=1, C=2, D=3)',
            },
          },
        },
        // Question Schema
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            text: {
              type: 'string',
              example: 'What is the speed of light?',
            },
            correctIndex: {
              type: 'integer',
              example: 2,
              nullable: true,
              description: 'Index of correct answer (only visible to lecturers)',
            },
            options: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Option',
              },
            },
          },
        },
        // Poll Schema
        Poll: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '1',
            },
            title: {
              type: 'string',
              example: 'Introduction to Physics Quiz',
            },
            description: {
              type: 'string',
              example: 'Test your basic physics knowledge',
              nullable: true,
            },
            joinCode: {
              type: 'string',
              example: 'ABC123',
              description: '6-character join code for students',
            },
            status: {
              type: 'string',
              enum: ['draft', 'open', 'live', 'closed'],
              example: 'draft',
            },
            timerSeconds: {
              type: 'integer',
              example: 300,
              description: 'Timer duration in seconds',
            },
            securityCode: {
              type: 'string',
              example: '1234',
              nullable: true,
              description: 'Optional 4-digit security code',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            questions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Question',
              },
            },
            submissionCount: {
              type: 'integer',
              example: 0,
            },
          },
        },
        // Create Poll Request
        CreatePollRequest: {
          type: 'object',
          required: ['title', 'questions'],
          properties: {
            title: {
              type: 'string',
              example: 'Introduction to Physics Quiz',
            },
            description: {
              type: 'string',
              example: 'Test your basic physics knowledge',
            },
            questions: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['text', 'options', 'correctIndex'],
                properties: {
                  text: {
                    type: 'string',
                    example: 'What is the speed of light?',
                  },
                  correctIndex: {
                    type: 'integer',
                    example: 2,
                    minimum: 0,
                  },
                  options: {
                    type: 'array',
                    minItems: 2,
                    items: {
                      type: 'object',
                      required: ['text', 'index'],
                      properties: {
                        text: {
                          type: 'string',
                          example: '299,792,458 m/s',
                        },
                        index: {
                          type: 'integer',
                          example: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            timerSeconds: {
              type: 'integer',
              example: 300,
              default: 30,
            },
            securityCode: {
              type: 'string',
              example: '1234',
            },
          },
        },
        // Join Poll Request
        JoinPollRequest: {
          type: 'object',
          required: ['joinCode', 'studentNumber'],
          properties: {
            joinCode: {
              type: 'string',
              example: 'ABC123',
            },
            studentNumber: {
              type: 'string',
              example: '12345678',
            },
            securityCode: {
              type: 'string',
              example: '1234',
            },
          },
        },
        // Submit Answers Request
        SubmitAnswersRequest: {
          type: 'object',
          required: ['answers'],
          properties: {
            answers: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['questionId', 'optionIndex'],
                properties: {
                  questionId: {
                    type: 'integer',
                    example: 1,
                  },
                  optionIndex: {
                    type: 'integer',
                    example: 2,
                  },
                },
              },
            },
          },
        },
        // Submission Feedback
        SubmissionFeedback: {
          type: 'object',
          properties: {
            questionIndex: {
              type: 'integer',
              example: 0,
            },
            questionText: {
              type: 'string',
              example: 'What is the speed of light?',
            },
            studentChoice: {
              type: 'string',
              example: '299,792,458 m/s',
            },
            correctChoice: {
              type: 'string',
              example: '299,792,458 m/s',
            },
            isCorrect: {
              type: 'boolean',
              example: true,
            },
          },
        },
        // Submit Response
        SubmitResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                score: {
                  type: 'integer',
                  example: 1,
                },
                total: {
                  type: 'integer',
                  example: 2,
                },
                feedback: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/SubmissionFeedback',
                  },
                },
              },
            },
          },
        },
        // Lobby Entry
        LobbyEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 2,
            },
            name: {
              type: 'string',
              example: 'Jane Doe',
            },
            studentNumber: {
              type: 'string',
              example: '12345678',
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Poll Statistics
        PollStatistics: {
          type: 'object',
          properties: {
            pollId: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Introduction to Physics Quiz',
            },
            status: {
              type: 'string',
              example: 'closed',
            },
            totalSubmissions: {
              type: 'integer',
              example: 25,
            },
            averageScore: {
              type: 'number',
              format: 'float',
              example: 1.8,
            },
            averagePercentage: {
              type: 'number',
              format: 'float',
              example: 90.0,
            },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: {
                    type: 'integer',
                    example: 1,
                  },
                  questionText: {
                    type: 'string',
                    example: 'What is the speed of light?',
                  },
                  totalAnswers: {
                    type: 'integer',
                    example: 25,
                  },
                  correctAnswers: {
                    type: 'integer',
                    example: 23,
                  },
                  correctPercentage: {
                    type: 'number',
                    format: 'float',
                    example: 92.0,
                  },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        text: {
                          type: 'string',
                        },
                        index: {
                          type: 'integer',
                        },
                        count: {
                          type: 'integer',
                        },
                        percentage: {
                          type: 'number',
                          format: 'float',
                        },
                        isCorrect: {
                          type: 'boolean',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // Student Submission History
        StudentSubmission: {
          type: 'object',
          properties: {
            pollId: {
              type: 'string',
              example: '1',
            },
            pollTitle: {
              type: 'string',
              example: 'Introduction to Physics Quiz',
            },
            score: {
              type: 'integer',
              example: 1,
            },
            total: {
              type: 'integer',
              example: 2,
            },
            percentage: {
              type: 'number',
              format: 'float',
              example: 50,
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
            },
            feedback: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionText: {
                    type: 'string',
                  },
                  studentChoice: {
                    type: 'string',
                  },
                  isCorrect: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health & Info',
        description: 'API health check and information endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Poll Management',
        description: 'CRUD operations for polls (lecturer-only)',
      },
      {
        name: 'Poll Lifecycle',
        description: 'Poll status management endpoints (open/start/close)',
      },
      {
        name: 'Student Participation',
        description: 'Student poll joining and submission endpoints',
      },
      {
        name: 'Lobby Management',
        description: 'Poll lobby and participant management',
      },
      {
        name: 'Analytics & Statistics',
        description: 'Poll analytics, statistics, and export endpoints',
      },
      {
        name: 'Student Submissions',
        description: 'Student submission history and management',
      },
    ],
  },
  apis: [
    './src/app.ts',
    './src/routes/**/*.ts',
    './src/types/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
