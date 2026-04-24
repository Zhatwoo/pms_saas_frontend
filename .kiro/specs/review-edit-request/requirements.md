# Requirements Document

## Introduction

This feature extends the existing customer edit request workflow by adding an **Admin Review flow**. When an employee submits a `CUSTOMER_EDIT_REQUESTED` log entry, the admin can now act on it directly from the customer activity log — clicking a "Review" button opens the customer profile modal in edit mode with the requested field highlighted and the employee's notes surfaced in a floating callout. After the admin saves, the original `CUSTOMER_EDIT_REQUESTED` log entry is **updated in-place** (not replaced with a new entry) to reflect the outcome: a green check icon, an "Edit Approved" title, the admin's name, the field reviewed, and the old → new value. The same updated entry is visible to the employee on their side.

The feature touches:
- `PMS_frontend/app/(pages)/customers/view_user/page.tsx` — activity log rendering (Review button, updated entry display)
- `PMS_frontend/components/shared/customer-profile-modal.tsx` — field highlight + floating note callout
- `PMS_backend/src/modules/customers/services/customers.service.ts` — `update()` method (in-place log update instead of new log insert)
- `PMS_backend/supabase` — no new tables; the existing `activity_logs` table is used

---

## Glossary

- **PMS**: Pawnshop Management System — the full-stack application (Next.js frontend + NestJS backend + Supabase/PostgreSQL).
- **Employee**: A PMS user with role `employee`, scoped to a single branch.
- **Admin**: A PMS user with role `admin`, scoped to a single branch.
- **Super_Admin**: A PMS user with role `super_admin`, with cross-branch visibility.
- **Activity_Log**: A row in the `activity_logs` Supabase table recording a system or user action with `action`, `details` (JSONB), `user_id`, and `branch_id`.
- **CUSTOMER_EDIT_REQUESTED**: The `action` value written to `activity_logs` when an employee submits a customer edit request. Its `details` JSON includes `customerId`, `customerName`, `notes`, `field` (optional), `mode`, `branchName`, and `actorLabel`.
- **CUSTOMER_EDIT_PROCESSED**: The `action` value that the `CUSTOMER_EDIT_REQUESTED` log entry is **updated to** after an admin reviews and saves the change. The row is mutated in-place; no new row is inserted.
- **Customer_Profile_Modal**: The shared React component at `components/shared/customer-profile-modal.tsx` that displays and edits a customer record.
- **Review_Context**: The set of data passed from the activity log entry to the Customer_Profile_Modal when the admin clicks "Review" — includes the `logId` of the originating `CUSTOMER_EDIT_REQUESTED` entry, the `field` to highlight, the employee's `notes`, and the `requestingEmployeeId`.
- **Field_Highlight**: A visual ring/border applied to the specific input field in the Customer_Profile_Modal that the employee requested be reviewed.
- **Floating_Note**: A small callout box rendered near the highlighted field showing the employee's notes from the edit request.
- **Log_Id**: The UUID primary key of the `activity_logs` row for the `CUSTOMER_EDIT_REQUESTED` entry being reviewed.
- **Requesting_Employee_Id**: The `user_id` of the employee who submitted the original edit request, stored in the `CUSTOMER_EDIT_REQUESTED` log row.
- **Old_Value**: The value of the reviewed field before the admin's edit, captured at save time.
- **New_Value**: The value of the reviewed field after the admin's edit.
- **View_User_Page**: The shared customer detail page at `app/(pages)/customers/view_user/page.tsx`, used by admin, employee, and super_admin roles.

---

## Requirements

### Requirement 1: "Review" Button on CUSTOMER_EDIT_REQUESTED Activity Log Entries (Admin View)

**User Story:** As an admin, I want a "Review" button next to each pending edit request in the customer activity log, so that I can act on it directly without navigating away.

#### Acceptance Criteria

1. WHEN the View_User_Page renders the activity log and the current user's role is `admin` or `super_admin`, THE View_User_Page SHALL display a "Review" button on each activity log entry whose `action` is `CUSTOMER_EDIT_REQUESTED`.
2. WHEN the current user's role is `employee`, THE View_User_Page SHALL NOT display a "Review" button on `CUSTOMER_EDIT_REQUESTED` log entries.
3. THE "Review" button SHALL be visually distinct from the log entry text (e.g., a small pill-shaped button) and SHALL NOT obscure the existing entry content.
4. WHEN the `CUSTOMER_EDIT_REQUESTED` log entry has already been processed (i.e., its `action` has been updated to `CUSTOMER_EDIT_PROCESSED`), THE View_User_Page SHALL NOT display a "Review" button for that entry.

---

### Requirement 2: Clicking "Review" Opens the Customer Profile Modal in Edit Mode with Field Highlighted

**User Story:** As an admin, I want clicking "Review" to open the customer profile modal already in edit mode with the relevant field highlighted, so that I can immediately see what needs to change without extra steps.

#### Acceptance Criteria

1. WHEN an admin clicks the "Review" button on a `CUSTOMER_EDIT_REQUESTED` log entry, THE View_User_Page SHALL open the Customer_Profile_Modal in edit mode (`isEditing = true`).
2. WHEN the `CUSTOMER_EDIT_REQUESTED` log entry contains a `field` value (e.g., `"contact_number"`), THE Customer_Profile_Modal SHALL apply a Field_Highlight (a visible ring or border emphasis) to the input corresponding to that field.
3. WHEN the `CUSTOMER_EDIT_REQUESTED` log entry does not contain a `field` value (free-form request), THE Customer_Profile_Modal SHALL open in edit mode without any Field_Highlight applied.
4. THE Customer_Profile_Modal SHALL receive the Review_Context (logId, field, notes, requestingEmployeeId) from the View_User_Page when opened via the "Review" button.
5. WHEN the Customer_Profile_Modal is opened via the "Review" button, THE Customer_Profile_Modal SHALL pass the `logId` of the originating `CUSTOMER_EDIT_REQUESTED` entry to the save handler so the backend can update the correct row.

---

### Requirement 3: Floating Note Box Near the Highlighted Field

**User Story:** As an admin, I want to see the employee's notes displayed near the highlighted field, so that I understand the context of the request without opening a separate view.

#### Acceptance Criteria

1. WHEN the Customer_Profile_Modal is opened via the "Review" button and the Review_Context includes `notes`, THE Customer_Profile_Modal SHALL render a Floating_Note near or above the highlighted field.
2. THE Floating_Note SHALL display the employee's notes text from the `CUSTOMER_EDIT_REQUESTED` log entry's `details.notes` field.
3. THE Floating_Note SHALL be visually distinct from the form fields (e.g., a callout box with a different background color and an icon or label such as "Employee Note").
4. WHEN the Review_Context does not include `notes` or `notes` is empty, THE Customer_Profile_Modal SHALL NOT render a Floating_Note.
5. WHEN the Customer_Profile_Modal is opened normally (not via "Review"), THE Customer_Profile_Modal SHALL NOT render a Floating_Note.

---

### Requirement 4: Admin Saves the Edit — Persisted to the Database

**User Story:** As an admin, I want saving the reviewed field to update the customer record in the database, so that the change is permanent and immediately reflected everywhere.

#### Acceptance Criteria

1. WHEN an admin edits a field in the Customer_Profile_Modal (opened via "Review") and clicks "Save Changes", THE Customer_Profile_Modal SHALL call the existing `PUT /customers/:id` endpoint with the updated field values.
2. THE save payload SHALL include the `requestingEmployeeId` from the Review_Context so the employee can be notified.
3. THE save payload SHALL include the `logId` of the originating `CUSTOMER_EDIT_REQUESTED` entry so the backend can update that row in-place.
4. WHEN the save succeeds, THE Customer_Profile_Modal SHALL close edit mode and trigger a customer data refresh (existing `onCustomerRefresh` callback).

---

### Requirement 5: CUSTOMER_EDIT_REQUESTED Log Entry Updated In-Place After Admin Saves

**User Story:** As an admin, I want the original edit request log entry to be updated (not duplicated) to show it was processed, so that the activity log stays clean and the history is clear.

#### Acceptance Criteria

1. WHEN an admin saves a customer edit via the "Review" flow and a `logId` is provided, THE Customers_Service SHALL update the existing `activity_logs` row with that `logId` rather than inserting a new row.
2. THE updated `activity_logs` row SHALL have its `action` changed from `CUSTOMER_EDIT_REQUESTED` to `CUSTOMER_EDIT_PROCESSED`.
3. THE updated `activity_logs` row SHALL have its `details` JSON updated to include: `processedAt` (ISO timestamp), `adminName` (the reviewing admin's display name), `adminId` (the reviewing admin's user ID), `reviewedField` (the field key that was reviewed, e.g., `"contact_number"`), `oldValue` (the field's value before the edit), `newValue` (the field's value after the edit), and all original fields from the `CUSTOMER_EDIT_REQUESTED` details preserved.
4. IF no `logId` is provided (admin edits a customer outside the Review flow), THE Customers_Service SHALL fall back to the existing behavior of inserting a new `CUSTOMER_EDIT_PROCESSED` log row.
5. IF the `activity_logs` row with the given `logId` does not exist or cannot be updated, THE Customers_Service SHALL log the error silently and fall back to inserting a new `CUSTOMER_EDIT_PROCESSED` row; the customer update itself SHALL NOT fail.

---

### Requirement 6: Updated Log Entry Displays "Edit Approved" State in the Activity Log (Admin View)

**User Story:** As an admin, I want the processed edit request entry in the activity log to clearly show it was approved — with a green check, the admin's name, the field reviewed, and the old → new value — so that the audit trail is immediately readable.

#### Acceptance Criteria

1. WHEN the View_User_Page renders an activity log entry whose `action` is `CUSTOMER_EDIT_PROCESSED` and whose `details` contains `reviewedField`, `oldValue`, and `newValue`, THE View_User_Page SHALL render that entry with a green check icon.
2. THE entry title SHALL be "Edit Approved".
3. THE entry SHALL display the admin's name (from `details.adminName`) and the reviewed field label (human-readable, e.g., "Contact Number" for `contact_number`).
4. THE entry SHALL display the old → new value in the format `"<oldValue> → <newValue>"` (e.g., `"09123 → 09321"`).
5. WHEN `details.oldValue` and `details.newValue` are both empty or null, THE View_User_Page SHALL display the entry without the old → new value line.
6. THE "Review" button SHALL NOT appear on entries whose `action` is `CUSTOMER_EDIT_PROCESSED`.

---

### Requirement 7: Updated Log Entry Displays "Edit Approved" State in the Activity Log (Employee View)

**User Story:** As an employee, I want to see the same updated "Edit Approved" entry in the activity log for my customer, so that I know my request was processed and what changed.

#### Acceptance Criteria

1. WHEN the View_User_Page renders an activity log entry whose `action` is `CUSTOMER_EDIT_PROCESSED` and whose `details` contains `reviewedField`, `oldValue`, and `newValue`, THE View_User_Page SHALL render that entry identically for both `admin` and `employee` roles.
2. THE entry SHALL display a green check icon, the title "Edit Approved", the admin's name, the reviewed field label, and the old → new value — regardless of whether the viewer is the admin or the employee.
3. WHEN the current user's role is `employee`, THE View_User_Page SHALL NOT display a "Review" button on `CUSTOMER_EDIT_PROCESSED` entries.

---

### Requirement 8: Employee Notification on Admin Approval

**User Story:** As an employee, I want to receive an in-app notification when the admin approves my edit request, so that I know the change has been applied.

#### Acceptance Criteria

1. WHEN the Customers_Service processes a customer edit via the Review flow (i.e., a `logId` is provided and `requestingEmployeeId` is present), THE Customers_Service SHALL create a notification targeted to the `requestingEmployeeId` with `category = "Requests"`.
2. THE notification `title` SHALL be `"Edit Approved"`.
3. THE notification `subtitle` SHALL include the admin's name, the reviewed field label, and the old → new value (e.g., `"Jeremiah (Admin) updated Contact Number: 09123 → 09321"`).
4. IF `requestingEmployeeId` is absent, THE Customers_Service SHALL NOT create an employee notification for the Review flow.
5. Notification creation failures SHALL be caught silently and SHALL NOT cause the customer update to fail.

---

### Requirement 9: Review Context Passed Correctly from Activity Log to Modal

**User Story:** As a developer, I want the Review_Context to be passed cleanly from the activity log entry to the Customer_Profile_Modal, so that the modal always has the correct logId, field, notes, and requestingEmployeeId.

#### Acceptance Criteria

1. WHEN the admin clicks "Review" on a `CUSTOMER_EDIT_REQUESTED` log entry, THE View_User_Page SHALL extract `logId` (the log row's `id`), `field` (from `details.field`), `notes` (from `details.notes`), and `requestingEmployeeId` (from the log row's `userId`) from the activity log entry.
2. THE View_User_Page SHALL pass all four Review_Context values to the Customer_Profile_Modal as props or via a state object.
3. WHEN `details.field` is absent or null, THE View_User_Page SHALL pass `field` as `null` in the Review_Context.
4. WHEN the log row's `userId` is absent or null, THE View_User_Page SHALL pass `requestingEmployeeId` as `undefined` in the Review_Context.
5. THE Customer_Profile_Modal SHALL include `logId` in the `PUT /customers/:id` request payload when `logId` is present in the Review_Context.

---

### Requirement 10: Backend Accepts and Processes logId in the Update Payload

**User Story:** As a developer, I want the backend `PUT /customers/:id` endpoint to accept an optional `logId` parameter, so that it can update the originating log entry in-place when processing a Review flow save.

#### Acceptance Criteria

1. THE `UpdateCustomerDto` SHALL include an optional `logId?: string` field.
2. WHEN `logId` is provided in the update payload, THE Customers_Service SHALL attempt to fetch the `activity_logs` row with that `id` before writing any log.
3. WHEN the fetched row exists and its `action` is `CUSTOMER_EDIT_REQUESTED`, THE Customers_Service SHALL update that row's `action` to `CUSTOMER_EDIT_PROCESSED` and merge the processed details into its `details` JSON.
4. WHEN `logId` is provided but the row does not exist or has an unexpected `action`, THE Customers_Service SHALL fall back to inserting a new `CUSTOMER_EDIT_PROCESSED` row and SHALL log a warning.
5. THE `logId` field SHALL be stripped from the Supabase `customers` table update payload (it is not a column in the `customers` table).
