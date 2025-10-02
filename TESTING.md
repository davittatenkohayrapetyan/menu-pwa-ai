# Test Suite Documentation

This directory contains comprehensive unit tests for the menu-pwa-ai application using Jest and React Testing Library.

## Test Coverage

**Overall Coverage:**
- Statements: 66.82%
- Branches: 56.17%
- Functions: 55.26%
- Lines: 67.69%

**55 Total Tests across 7 Test Suites** ✅ All Passing

## Test Suites

### 1. UI Components Tests (28 tests)

#### `camera-gallery-capture.test.tsx` (7 tests)
Tests for the main camera and gallery capture component:
- Initial selection mode rendering
- Camera mode activation and getUserMedia calls
- Camera permission denial handling with fallback to gallery
- No camera found error handling
- Gallery mode selection
- File selection from gallery
- Navigation back to selection mode

#### `button.test.tsx` (7 tests)
Tests for the Button component:
- Default variant rendering
- Different variants (destructive, outline, ghost)
- Different sizes (sm, lg, icon)
- Disabled state
- Click event handling
- Custom className support

#### `card.test.tsx` (8 tests)
Tests for Card components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter):
- Individual component rendering
- Custom className support
- Complete card structure integration

#### `input.test.tsx` (6 tests)
Tests for the Input component:
- Input element rendering
- Different input types (text, email, password)
- Value changes
- onChange callback
- Disabled state
- Custom className and placeholder support

### 2. Utility Functions Tests (8 tests)

#### `utils.test.ts` (8 tests)
Tests for the `cn` utility function (Tailwind class merger):
- Class name merging
- Conditional classes
- Handling undefined/null values
- Empty string handling
- Tailwind class conflict resolution
- Array of classes
- Object with conditional classes
- Empty arguments handling

### 3. Database Operations Tests (6 tests)

#### `db.test.ts` (6 tests)
Tests for the MenuDatabase (Dexie wrapper):
- Adding pending uploads with correct structure
- Getting pending uploads ordered by date
- Removing pending uploads
- Syncing when online with server
- Handling failed sync with retry counter
- Network error handling

### 4. API Route Tests (11 tests)

#### `parse-menu/route.test.ts` (11 tests)
Tests for the menu parsing API endpoint:
- API key configuration validation
- Missing image data validation
- Successful menu parsing with image data
- Successful menu parsing with image URL
- Markdown-wrapped JSON response handling
- Items without optional fields handling
- OpenAI no content error handling
- Invalid JSON response handling
- Invalid data structure handling
- OpenAI API errors
- API key specific errors

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Configuration

- **Jest Configuration**: `jest.config.js`
- **Test Setup**: `jest.setup.js`
- **Test Environment**: jsdom (for React components)
- **Testing Libraries**: 
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`

## Mocking Strategy

### Global Mocks (jest.setup.js)
- `navigator.mediaDevices.getUserMedia` - for camera tests
- `FileReader` - for file upload tests

### Test-Specific Mocks
- **OpenAI API**: Mocked in API route tests
- **Dexie Database**: Mocked with Jest in database tests
- **Next.js Server Components**: Mocked in API route tests
- **console.error**: Suppressed in tests that expect errors

## Coverage Highlights

**Fully Covered (100%):**
- API route handler (`route.ts`)
- Card components (`card.tsx`)
- Input component (`input.tsx`)
- Utils function (`utils.ts`)

**Well Covered (>85%):**
- Button component (`button.tsx`) - 90%
- Database operations (`db.ts`) - 87.5%

**Good Coverage (>60%):**
- Camera/Gallery capture (`camera-gallery-capture.tsx`) - 65.51%

## Best Practices Applied

1. ✅ **Proper TypeScript Types**: No `any` types, all mocks properly typed
2. ✅ **Cleanup**: All tests clean up after themselves (timers, mocks, DOM)
3. ✅ **Isolation**: Each test is independent and doesn't affect others
4. ✅ **Meaningful Assertions**: Tests verify actual behavior, not implementation
5. ✅ **Coverage**: High coverage of critical paths and error handling
6. ✅ **Accessibility**: Using `getByRole` and proper ARIA labels in tests

## Future Test Improvements

- Add integration tests for full user workflows
- Increase coverage for `page.tsx` and `layout.tsx`
- Add E2E tests using Playwright for critical user paths
- Add visual regression tests for UI components
- Add performance tests for image processing
