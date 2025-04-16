// NoCodeBackend API Documentation
// Source: https://api.nocodebackend.com/api-docs/?Instance=43023_windsurf
// Generated on: 2025-04-16

// This file contains information about the APIs available from NoCodeBackend for the football analytics platform.

// Note: The actual API endpoints, parameters, and responses will need to be manually extracted from the documentation URL.
// The secret key for API access is stored securely in memory and should not be hardcoded here.

// TODO: Manually update this file with specific API endpoints and descriptions after reviewing the documentation.

export interface NoCodeBackendApi {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  response: {
    description: string;
    example: any;
  };
}

// // example for create a note 
// ..curl -X 'POST' \
// 'https://api.nocodebackend.com/create/tasks?Instance=43023_windsurf' \
// -H 'accept: application/json' \
// -H 'Content-Type: application/json' \
// -d '{
// "taskdescription": "string",
// "tasknotes": "string",
// "taskduedate": "2025-04-16",
// "assigned": "string",
// "private": 0,
// "complete": 0,
// "category": "string"
// }'

// Placeholder for API list
const apiList: NoCodeBackendApi[] = [
  {
    endpoint: "/api/v1/plays",
    method: "GET",
    description: "Retrieve a list of all plays for analysis.",
    parameters: [
      { name: "gameId", type: "string", required: false, description: "Filter plays by specific game ID." },
      { name: "teamId", type: "string", required: false, description: "Filter plays by specific team ID." },
      { name: "playType", type: "string", required: false, description: "Filter by play type (run/pass)." },
      { name: "limit", type: "number", required: false, description: "Limit the number of results returned." }
    ],
    response: {
      description: "Returns an array of play objects with details such as formation, concept, down, distance, and yards gained.",
      example: {
        plays: [
          {
            id: "play_12345",
            gameId: "game_2023_09_01",
            teamId: "team_abc",
            playType: "run",
            formation: "Shotgun",
            concept: "Inside Zone",
            down: 1,
            distance: 10,
            yardsGained: 4
          }
        ]
      }
    }
  },
  {
    endpoint: "/api/v1/plays/{id}",
    method: "GET",
    description: "Retrieve detailed information about a specific play.",
    parameters: [
      { name: "id", type: "string", required: true, description: "The unique identifier of the play." }
    ],
    response: {
      description: "Returns a detailed play object including video URL if available.",
      example: {
        id: "play_12345",
        gameId: "game_2023_09_01",
        teamId: "team_abc",
        playType: "run",
        formation: "Shotgun",
        concept: "Inside Zone",
        down: 1,
        distance: 10,
        yardsGained: 4,
        videoUrl: "https://example.com/video/play_12345"
      }
    }
  },
  {
    endpoint: "/api/v1/analytics/summary",
    method: "GET",
    description: "Get summary analytics for play performance by formation or concept.",
    parameters: [
      { name: "filterBy", type: "string", required: false, description: "Filter summary by 'formation' or 'concept'. Default is overall summary." },
      { name: "startDate", type: "string", required: false, description: "Start date for data range (YYYY-MM-DD)." },
      { name: "endDate", type: "string", required: false, description: "End date for data range (YYYY-MM-DD)." }
    ],
    response: {
      description: "Returns summary statistics including success rates and average yards per play type or formation.",
      example: {
        summaryType: "formation",
        data: [
          {
            formation: "Shotgun",
            totalPlays: 120,
            runPlays: 70,
            passPlays: 50,
            avgYardsRun: 4.5,
            avgYardsPass: 7.2,
            successRateRun: 0.48,
            successRatePass: 0.55
          }
        ]
      }
    }
  },
  {
    endpoint: "/api/v1/plays",
    method: "POST",
    description: "Upload a new play or batch of plays for analysis.",
    parameters: [
      { name: "plays", type: "array", required: true, description: "Array of play objects to upload." }
    ],
    response: {
      description: "Returns confirmation of upload with IDs for newly created play records.",
      example: {
        status: "success",
        uploadedCount: 10,
        playIds: ["play_12346", "play_12347"]
      }
    }
  },
  {
    endpoint: "/create/tasks",
    method: "POST",
    description: "Create a new task/note in the system.",
    parameters: [
      { name: "taskdescription", type: "string", required: true, description: "Description of the task." },
      { name: "tasknotes", type: "string", required: false, description: "Additional notes for the task." },
      { name: "taskduedate", type: "string", required: false, description: "Due date for the task in YYYY-MM-DD format." },
      { name: "assigned", type: "string", required: false, description: "Person assigned to the task." },
      { name: "private", type: "number", required: false, description: "Privacy setting (0 for public, 1 for private)." },
      { name: "complete", type: "number", required: false, description: "Completion status (0 for incomplete, 1 for complete)." },
      { name: "category", type: "string", required: false, description: "Category of the task." },
      { name: "Instance", type: "string", required: true, description: "Instance identifier (e.g., 43023_windsurf)." }
    ],
    response: {
      description: "Returns confirmation of task creation with the new task ID.",
      example: {
        status: "success",
        taskId: "task_12345"
      }
    }
  },
  {
    endpoint: "/read/tasks",
    method: "GET",
    description: "Retrieve a list of tasks/notes.",
    parameters: [
      { name: "Instance", type: "string", required: true, description: "Instance identifier (e.g., 43023_windsurf)." },
      { name: "page", type: "number", required: false, description: "Page number for pagination." },
      { name: "limit", type: "number", required: false, description: "Number of tasks per page." }
    ],
    response: {
      description: "Returns a list of tasks/notes with pagination information.",
      example: {
        tasks: [
          {
            id: "task_12345",
            taskdescription: "Review game footage",
            tasknotes: "Focus on defensive formations",
            taskduedate: "2025-04-20",
            assigned: "Coach Smith",
            private: 0,
            complete: 0,
            category: "Analysis"
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 48
        }
      }
    }
  }
];

// Example commands for testing API integration in the app
// These commands assume the use of a HTTP client like Angular's HttpClient or tools like curl for testing.

/*
1. Fetch all plays for a specific game:
   curl -X GET "https://api.nocodebackend.com/api/v1/plays?gameId=game_2023_09_01" \
   -H "Authorization: Bearer <your-secure-api-key>"

   Angular HttpClient example:
   this.http.get('/api/v1/plays', { params: { gameId: 'game_2023_09_01' } })
     .subscribe(response => console.log('Plays:', response));

2. Get details for a specific play:
   curl -X GET "https://api.nocodebackend.com/api/v1/plays/play_12345" \
   -H "Authorization: Bearer <your-secure-api-key>"

   Angular HttpClient example:
   this.http.get('/api/v1/plays/play_12345')
     .subscribe(response => console.log('Play Details:', response));

3. Fetch analytics summary by formation for a date range:
   curl -X GET "https://api.nocodebackend.com/api/v1/analytics/summary?filterBy=formation&startDate=2023-09-01&endDate=2023-12-31" \
   -H "Authorization: Bearer <your-secure-api-key>"

   Angular HttpClient example:
   this.http.get('/api/v1/analytics/summary', { params: { filterBy: 'formation', startDate: '2023-09-01', endDate: '2023-12-31' } })
     .subscribe(response => console.log('Analytics Summary:', response));

4. Upload new play data (example with JSON payload):
   curl -X POST "https://api.nocodebackend.com/api/v1/plays" \
   -H "Authorization: Bearer <your-secure-api-key>" \
   -H "Content-Type: application/json" \
   -d '[{"gameId": "game_2023_09_01", "teamId": "team_abc", "playType": "run", "formation": "Shotgun", "concept": "Inside Zone", "down": 1, "distance": 10, "yardsGained": 4}]'

   Angular HttpClient example:
   const newPlays = [{ gameId: 'game_2023_09_01', teamId: 'team_abc', playType: 'run', formation: 'Shotgun', concept: 'Inside Zone', down: 1, distance: 10, yardsGained: 4 }];
   this.http.post('/api/v1/plays', newPlays)
     .subscribe(response => console.log('Upload Response:', response));
*/

export default apiList;
