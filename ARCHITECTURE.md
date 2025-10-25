## Project Architecture

This project follows a modular, NestJS-inspired architecture for better organization and maintainability.

## Folder Structure

```
src/
├── index.ts                 # Main entry point (old - to be replaced)
├── index.new.ts            # New modular entry point
├── config/                 # Configuration files
│   ├── constants.ts        # Application constants
│   └── openapi.config.ts   # OpenAPI/Swagger configuration
├── controllers/            # Route controllers (like NestJS controllers)
│   ├── health.controller.ts
│   ├── test.controller.ts
│   └── docs.controller.ts
├── services/               # Business logic (like NestJS services)
│   └── health.service.ts
├── middleware/             # Middleware functions
│   ├── auth.middleware.ts
│   ├── debug.middleware.ts
│   └── monitoring.middleware.ts
├── handlers/               # Special handlers
│   ├── error.handler.ts
│   └── scheduled.handler.ts
├── routes/                 # Route registration
│   └── index.ts
├── types/                  # TypeScript types and interfaces
│   └── index.ts
└── utils/                  # Utility functions
    └── helpers.ts
```

## Architecture Layers

### 1. **Entry Point** (`index.new.ts`)
- Initializes the Hono app
- Registers global middleware
- Registers routes
- Sets up error handling
- Exports fetch and scheduled handlers

### 2. **Routes** (`routes/`)
- Registers all application routes
- Connects controllers to endpoints
- Applies route-specific middleware

### 3. **Controllers** (`controllers/`)
- Handle HTTP requests
- Validate input
- Call services for business logic
- Format responses
- Similar to NestJS controllers

### 4. **Services** (`services/`)
- Contain business logic
- Reusable across controllers
- No direct HTTP knowledge
- Similar to NestJS services

### 5. **Middleware** (`middleware/`)
- Authentication
- Logging
- Monitoring
- Debug mode

### 6. **Handlers** (`handlers/`)
- Error handling
- Scheduled/cron jobs
- Special event handlers

### 7. **Configuration** (`config/`)
- Application constants
- OpenAPI specification
- Environment-specific config

### 8. **Types** (`types/`)
- TypeScript interfaces
- Type definitions
- Shared types

### 9. **Utils** (`utils/`)
- Helper functions
- Utility methods
- Pure functions

## Key Principles

### Separation of Concerns
- Each module has a single responsibility
- Controllers handle HTTP, services handle logic
- Middleware handles cross-cutting concerns

### Dependency Injection
- Services are injected into controllers
- App instance passed to services that need it
- Similar to NestJS DI pattern

### Modularity
- Easy to add new features
- Easy to test individual components
- Easy to maintain and refactor

### Type Safety
- Strong TypeScript typing throughout
- Shared types in `types/` folder
- Context types for Hono

## Migration Guide

### Old Structure (index.ts)
```typescript
// Everything in one file
const app = new Hono()
app.use('*', middleware)
app.get('/endpoint', handler)
// 500+ lines of code
```

### New Structure (index.new.ts)
```typescript
// Clean entry point
import { registerRoutes } from './routes'
const app = new Hono()
app.use('*', middleware)
registerRoutes(app)
// ~30 lines of code
```

## Adding New Features

### 1. Add a New Endpoint

**Step 1:** Create a controller
```typescript
// src/controllers/user.controller.ts
export class UserController {
  async getUser(c: Context) {
    return c.json({ user: 'data' })
  }
}
```

**Step 2:** Register route
```typescript
// src/routes/index.ts
const userController = new UserController()
app.get('/api/users/:id', (c) => userController.getUser(c))
```

### 2. Add Business Logic

**Step 1:** Create a service
```typescript
// src/services/user.service.ts
export class UserService {
  async findUser(id: string) {
    // Business logic here
    return { id, name: 'John' }
  }
}
```

**Step 2:** Use in controller
```typescript
// src/controllers/user.controller.ts
export class UserController {
  constructor(private userService: UserService) {}
  
  async getUser(c: Context) {
    const user = await this.userService.findUser(c.req.param('id'))
    return c.json(user)
  }
}
```

### 3. Add Middleware

**Step 1:** Create middleware
```typescript
// src/middleware/rate-limit.middleware.ts
export const rateLimit = async (c: Context, next: Next) => {
  // Rate limiting logic
  await next()
}
```

**Step 2:** Apply middleware
```typescript
// src/index.new.ts or routes/index.ts
app.use('*', rateLimit)
// or
app.get('/api/endpoint', rateLimit, handler)
```

## Testing Strategy

### Unit Tests
- Test services independently
- Mock dependencies
- Test pure functions in utils

### Integration Tests
- Test controllers with mocked services
- Test middleware behavior
- Test route registration

### E2E Tests
- Test full request/response cycle
- Test with real dependencies
- Test error scenarios

## Benefits of This Architecture

✅ **Maintainability** - Easy to find and modify code  
✅ **Scalability** - Easy to add new features  
✅ **Testability** - Easy to test individual components  
✅ **Readability** - Clear structure and organization  
✅ **Reusability** - Services can be reused across controllers  
✅ **Type Safety** - Strong typing throughout  
✅ **Separation of Concerns** - Each module has one job  

## Comparison with NestJS

| Feature | NestJS | This Project |
|---------|--------|--------------|
| Controllers | ✅ | ✅ |
| Services | ✅ | ✅ |
| Middleware | ✅ | ✅ |
| Dependency Injection | Decorators | Constructor |
| Modules | ✅ | Manual registration |
| Guards | ✅ | Middleware |
| Interceptors | ✅ | Middleware |
| Pipes | ✅ | Utils/Validators |

## Next Steps

1. **Backup old index.ts**
2. **Rename index.new.ts to index.ts**
3. **Test all endpoints**
4. **Add unit tests**
5. **Add more features using this structure**
