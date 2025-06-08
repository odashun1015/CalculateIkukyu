# CLAUDE.md
以後必ず日本語で回答してください
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese parental leave benefit calculator (育児休業給付金計算機) that calculates:
- Standard childcare leave benefits (育児休業給付金)
- New Postpartum Work Absence Support Grant/PWASG (出生後休業支援給付金) - effective April 2025

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
npm run test:ui    # Run tests with UI
```

## Architecture

### Core Calculation Logic
The main calculation service (`services/CalculatorService.ts`) implements Japan's childcare benefit system:
- **67% salary** for first 180 days, **50%** thereafter
- Monthly caps: ¥310,143 (first period), ¥231,450 (second period)  
- **PWASG**: Additional 13% top-up for up to 28 days with spouse conditions

### Component Structure
- `App.vue` - Main container with reactive form state management
- `MonthlySalariesInput.vue` - Dynamically labeled month inputs based on leave dates
- `CalculationResultDisplay.vue` - Complex breakdown showing standard + PWASG results
- `PostpartumSupportGrantCheckbox.vue` & `SpousePwasgConditionCheckbox.vue` - PWASG eligibility controls

### Key Types
All interfaces are in `types.ts`:
- `CalculationParams` - Input parameters including monthly salaries and dates
- `CalculationResult` - Comprehensive results with period breakdowns and PWASG details
- `PeriodDetail` & `PwasgDetails` - Granular calculation breakdowns

### Data Flow
1. User inputs collected in reactive Vue components with v-model
2. Parameters passed to `CalculatorService.calculateBenefit()`
3. Results displayed with detailed breakdown and assumptions
4. Month-by-month calculation respecting calendar boundaries and caps

## Testing

### Test Coverage
- **CalculatorService**: Comprehensive unit tests covering all calculation scenarios
- **Date Utilities**: Tests for calendar calculations and boundary conditions  
- **Edge Cases**: Boundary value testing, extreme inputs, and error conditions
- **PWASG Logic**: Complete testing of postpartum support grant calculations

### Test Categories
- Basic calculation scenarios (standard 6-month leave, short/long periods)
- Wage cap boundary testing (upper/lower limits)
- Monthly benefit cap applications
- PWASG eligibility and calculation logic
- Complex date patterns (leap years, month boundaries, multi-year spans)
- Numerical precision and edge cases

### Key Test Files
- `src/services/__tests__/CalculatorService.test.ts` - Core calculation logic
- `src/services/__tests__/dateUtils.test.ts` - Date calculation utilities
- `src/services/__tests__/CalculatorServiceEdgeCases.test.ts` - Edge cases and boundaries

## Important Implementation Details

- Month calculations use calendar boundaries, not 30-day periods
- PWASG requires minimum 14-day leave and spouse conditions 
- All text constants centralized in `constants.ts`
- Currency formatting uses Japanese Yen with proper comma separators
- Date handling accounts for inclusive day counting
- Validation includes Japanese error messages and comprehensive form checks

## Tech Stack
- Vue.js 3 + TypeScript with strict configuration
- Vite for build tooling
- SCSS for styling with custom variables and components
- Vitest for unit testing with comprehensive coverage
- No external UI libraries - custom components only
