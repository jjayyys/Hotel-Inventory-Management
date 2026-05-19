# Build Verification Guide

## Quick Start Verification

### 1. **Environment Check**
```powershell
# Verify all required tools
node -v          # Should be LTS
npm -v           # Should be current
docker -v        # Docker Desktop required
docker compose version  # v2+
git --version
```

### 2. **Install Dependencies** (if needed)
```powershell
# From project root
npm install

# Verify workspace dependencies
npm list --workspace=apps/api --depth=0
npm list --workspace=apps/web --depth=0
```

### 3. **Database Setup**
```powershell
# Start PostgreSQL and Redis containers
npm run docker:up

# Verify containers are running
docker compose ps

# Run migrations
npm run db:migrate

# Seed mock data
npm run db:seed

# Verify data in Prisma Studio
npx prisma studio --schema=apps/api/prisma/schema.prisma
```

---

## Backend Verification

### 4. **Check Backend Code Compilation**
```powershell
# Build the backend
npm run build --workspace=apps/api

# Expected: Successful compilation with no errors
# Output should be in: apps/api/dist/
```

### 5. **Run Backend Linting**
```powershell
# Check for linting errors
npm run lint --workspace=apps/api

# Expected: No errors reported
```

### 6. **Run Backend Unit Tests**
```powershell
# Run all backend tests
npm run test --workspace=apps/api

# Expected test files to pass:
# - SimulationService.spec.ts
# - GlobalExceptionFilter.spec.ts
# - AI service tests
# - Replenishment service tests

# For coverage report
npm run test:cov --workspace=apps/api
```

### 7. **Start Backend Server**
```powershell
# Terminal 1: Start API development server
npm run dev:api

# Expected output:
# - Listening on port 3001
# - Swagger docs at http://localhost:3001/api/docs
```

### 8. **Verify API Endpoints** (in new terminal)
```powershell
# Test health check
curl http://localhost:3001

# Test Swagger API documentation
# Open in browser: http://localhost:3001/api/docs

# Test authentication
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.test","password":"admin123"}'

# Expected: JWT token in response
```

### 9. **Verify Key Endpoints**
```powershell
# Get a token first (from login above)
$TOKEN = "YOUR_JWT_TOKEN_HERE"

# Test Simulation endpoints
curl -X GET "http://localhost:3001/simulation/scenarios" \
  -H "Authorization: Bearer $TOKEN"

# Test Recommendations endpoint
curl -X GET "http://localhost:3001/replenishment/HOTEL_ID" \
  -H "Authorization: Bearer $TOKEN"

# Test Waste endpoint
curl -X GET "http://localhost:3001/waste" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Frontend Verification

### 10. **Check Frontend Code Compilation**
```powershell
# Build the frontend
npm run build --workspace=apps/web

# Expected: Successful build with no errors
# Output should be in: apps/web/.next/
```

### 11. **Run Frontend Linting**
```powershell
# Check for linting errors
npm run lint --workspace=apps/web

# Expected: No errors reported
```

### 12. **Start Frontend Dev Server**
```powershell
# Terminal 2: Start web development server
npm run dev:web

# Expected output:
# - Listening on http://localhost:3000
# - Ready in X.XXs
```

### 13. **Verify Frontend Pages** (Browser)
```
Open http://localhost:3000

Expected pages accessible:
✓ Login page: http://localhost:3000/login
✓ Dashboard: http://localhost:3000/dashboard
✓ Inventory: http://localhost:3000/dashboard/inventory
✓ Waste: http://localhost:3000/dashboard/waste
✓ Recommendations: http://localhost:3000/dashboard/recommendations
✓ Simulation: http://localhost:3000/dashboard/simulation
✓ SKU Detail: http://localhost:3000/skus/[id]
```

---

## Feature Verification

### 14. **Test Simulation Feature**
```
1. Go to http://localhost:3000/dashboard/simulation
2. Create a new scenario:
   - Select scenario type (e.g., "Occupancy Change")
   - Fill in parameters
   - Click "Create simulation scenario"
   
Expected:
✓ Scenario created and appears in list
✓ Can select and run simulation
✓ Results show impact charts and variance analysis
✓ Risk upgrades are highlighted
```

### 15. **Test SKU Detail Page**
```
1. Go to http://localhost:3000/dashboard/recommendations
2. Click on any SKU name to navigate to detail page
3. Should see:
   ✓ SKU overview metrics (cost, safety stock, shelf life)
   ✓ Latest recommendation with risk badge
   ✓ Waste trend chart
   ✓ Waste logs table
   ✓ Inventory batches table
   ✓ Used in recipes section
```

### 16. **Test Error Handling**
```
1. Try to access invalid route:
   http://localhost:3000/invalid-page
   Expected: Proper 404 handling

2. Make API call without token:
   curl http://localhost:3001/recommendations
   Expected: 401 Unauthorized with proper error format

3. Make API call with invalid JSON:
   curl -X POST http://localhost:3001/simulation/scenarios \
     -H "Authorization: Bearer $TOKEN" \
     -d 'invalid json'
   Expected: 400 Bad Request with error details
```

### 17. **Check API Logging**
```
1. Start API and watch console
2. Make a request: curl http://localhost:3001
3. Check backend console for:
   ✓ Request logged: "→ GET /"
   ✓ Response logged: "← GET / 200 (+XXms)"
   ✓ Timestamps and status codes present
```

---

## Type Safety & Code Quality

### 18. **Verify TypeScript Types**
```powershell
# Check for type errors
npx tsc --noEmit --workspace=apps/api
npx tsc --noEmit --workspace=apps/web

# Expected: No type errors
```

### 19. **Verify New Components Exist**
```powershell
# Check frontend components created
Test-Path "apps/web/src/components/ui/modal.tsx"
Test-Path "apps/web/src/components/ui/dialog.tsx"
Test-Path "apps/web/src/components/ui/spinner.tsx"
Test-Path "apps/web/src/components/ui/alert.tsx"

# Check backend services
Test-Path "apps/api/src/simulation/simulation.service.ts"
Test-Path "apps/api/src/simulation/simulation.controller.ts"
Test-Path "apps/api/src/common/filters/global-exception.filter.ts"
Test-Path "apps/api/src/common/interceptors/logging.interceptor.ts"
```

---

## Integration Test

### 20. **End-to-End Workflow Test**
```
1. Login:
   → Go to /login
   → Login with demo credentials
   → Verify redirect to /dashboard

2. View Dashboard:
   → See metrics cards
   → See waste trend chart
   → See recommendations list

3. Create Simulation:
   → Go to /dashboard/simulation
   → Create scenario with occupancy_change
   → Set parameters (e.g., +20% occupancy)
   → Run simulation
   → Verify results display

4. Check Inventory:
   → Go to /dashboard/inventory
   → Filter by SKU name
   → Verify batches load

5. View SKU Detail:
   → Click on any SKU link
   → Verify all sections load
   → See waste logs and inventory
```

---

## Performance Check

### 21. **Backend Performance**
```powershell
# Test response time
Measure-Command {
  curl "http://localhost:3001/replenishment/HOTEL_ID" `
    -H "Authorization: Bearer $TOKEN"
} | Select-Object TotalMilliseconds

# Expected: < 500ms for most endpoints
```

### 22. **Frontend Build Performance**
```powershell
# Check build size
Get-ChildItem apps/web/.next -Recurse | 
  Measure-Object -Sum Length | 
  Select-Object @{Name="TotalSizeMB";Expression={[math]::Round($_.Sum/1MB,2)}}

# Expected: Build should be < 100MB
```

---

## Troubleshooting Checklist

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Docker containers not starting** | `docker compose up -d` and check `docker compose logs` |
| **Database migration fails** | Ensure containers are running, try `npm run db:migrate -- --reset` |
| **API won't start** | Check port 3001 is free, verify `.env` file in `apps/api/` |
| **Frontend won't start** | Check port 3000 is free, verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local` |
| **Tests fail** | Clear node_modules and reinstall: `rm -r node_modules && npm install` |
| **Type errors** | Regenerate Prisma types: `npx prisma generate` |

---

## Success Criteria Checklist

- [ ] All dependencies install without errors
- [ ] Docker containers start and stay running
- [ ] Database migrations complete successfully
- [ ] Mock data seeds properly
- [ ] Backend builds without errors
- [ ] Backend linting passes
- [ ] Backend tests pass (18+ test cases)
- [ ] API server starts on port 3001
- [ ] Swagger documentation loads at /api/docs
- [ ] Frontend builds without errors
- [ ] Frontend linting passes
- [ ] Frontend server starts on port 3000
- [ ] All 7 pages load and are accessible
- [ ] Simulation feature works end-to-end
- [ ] SKU detail page displays all sections
- [ ] Error handling returns proper error format
- [ ] Request/response logging works
- [ ] API authentication works (JWT)
- [ ] UI components render properly
- [ ] No TypeScript errors in either app

---

## Quick Smoke Test (5 minutes)

```powershell
# Terminal 1: Start services
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev:api

# Terminal 2: Start frontend
npm run dev:web

# Browser: Test basic flow
# 1. http://localhost:3000 → should redirect to login or dashboard
# 2. http://localhost:3001/api/docs → should show Swagger UI
# 3. http://localhost:3000/dashboard/simulation → should load

# If all 3 load without errors → BUILD SUCCESSFUL ✅
```

---

## Getting Help

If verification fails:
1. Check terminal output for specific error messages
2. Review `.env` files match database credentials
3. Ensure Docker Desktop is running
4. Check console logs in both terminal windows
5. Verify no port conflicts (3000, 3001, 5432, 6379)
