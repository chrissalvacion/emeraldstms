# Prepaid Package Billing System Implementation

## Overview
The tutorials model has been enhanced to support two billing types: **Per-Session** (existing) and **Prepaid Package** (new). When a tutorial uses the prepaid package option, the system automatically calculates remaining hours based on the prepaid amount and attendance records.

## Changes Made

### 1. Database Migration
**File:** `database/migrations/2026_02_15_add_billing_to_tutorials.php`

Added two new columns to the `tutorials` table:
- `billing_type` (string, default: 'per-session'): Either 'per-session' or 'prepaid-package'
- `prepaid_amount` (decimal, nullable): Total amount paid for prepaid package

### 2. Tutorials Model Updates
**File:** `app/Models/Tutorials.php`

#### Updated Fillable Fields
Added 'billing_type' and 'prepaid_amount' to the fillable array.

#### Updated Casts
Added 'prepaid_amount' => 'decimal:2' to ensure proper data type handling.

#### New Methods

**`getTotalPrepaidHours(): ?float`**
- Calculates total hours from the prepaid package
- Formula: `total_hours = prepaid_amount / hourly_rate`
- Returns null if billing type is not 'prepaid-package' or if hourly rate is not set

**`getRemainingPrepaidHours(): ?int`**
- Calculates remaining hours after attendance
- Formula: `remaining_hours = total_hours - hours_used_in_attendance` (rounded to whole number)
- Queries all attendance records for the tutorial
- Calculates hours used from time_in and time_out
- Returns the rounded remaining hours

**`timeToMinutes(?string $time): ?int`** (private)
- Helper method to convert time strings (HH:mm) to minutes
- Used internally by getRemainingPrepaidHours()

### 3. Controller Updates
**File:** `app/Http/Controllers/TutorialsController.php`

#### Store Method Validation
- Added validation for 'billing_type' (nullable, in: per-session,prepaid-package)
- Added validation for 'prepaid_amount' (nullable, numeric, min:0)
- Added logic to validate that prepaid_amount is required when billing_type is 'prepaid-package'

#### Show Method
- Added billing_type, prepaid_amount, total_prepaid_hours, and remaining_prepaid_hours to the tutorial data returned to the view

#### Edit Method
- Updated tutorial data to include billing_type and prepaid_amount

#### Update Method
- Added billing_type and prepaid_amount validation
- Added similar billing type validation logic as store method

### 4. Frontend - Create Form
**File:** `resources/js/pages/tutorials/create.tsx`

- Added state variables: `billingType` and `prepaidAmount`
- Added "Billing Type" dropdown field with options: Per-Session and Prepaid Package
- Added conditional "Prepaid Amount" input field that only shows when billing type is 'prepaid-package'
- Updated form submission to include billing_type and prepaid_amount

### 5. Frontend - Show Page
**File:** `resources/js/pages/tutorials/show.tsx`

- Added prepaid package details section that displays when billing_type is 'prepaid-package'
- Shows:
  - Prepaid Amount (₱)
  - Hourly Rate (₱)
  - Total Hours (calculated from prepaid_amount / hourly_rate)
  - Hours Used (calculated from attendance records)
  - Remaining Hours (highlighted in primary color)

### 6. Frontend - Edit Form
**File:** `resources/js/pages/tutorials/edit.tsx`

- Added state variables: `billingType` and `prepaidAmount`
- Added "Billing Type" dropdown field linked to tutorial's current billing_type
- Added conditional "Prepaid Amount" input field
- Updated form submission to include billing_type and prepaid_amount

## Usage

### Creating a Tutorial with Prepaid Package
1. Go to Create Tutorial page
2. Fill in student, tutor, schedule, education level, and grade level
3. Select "Prepaid Package" from the Billing Type dropdown
4. Enter the total prepaid amount in the Prepaid Amount field
5. Click Create

### Example Calculation
- Prepaid Amount: ₱2,000
- Hourly Rate: ₱500 (from settings)
- Total Hours: 2,000 ÷ 500 = 4.0 hours
- If 2 attendance records exist:
  - Attendance 1: 09:00 to 10:30 = 1.5 hours
  - Attendance 2: 14:00 to 15:00 = 1.0 hour
  - Total Hours Used: 2.5 hours
  - Remaining Hours: 4.0 - 2.5 = 1.5 hours → rounds to 2 hours

## Validation
- When billing_type is 'prepaid-package', prepaid_amount is required and must be > 0
- When billing_type is 'per-session', prepaid_amount is set to null
- Both create and update operations validate these rules

## To Deploy
1. Run migration: `php artisan migrate`
2. Clear cache if needed: `php artisan cache:clear`
3. Build frontend: `npm run build`
