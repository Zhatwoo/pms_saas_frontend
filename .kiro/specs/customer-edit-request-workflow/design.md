# Design Document: Customer Edit Request Workflow

## Overview

This feature refines the customer edit request workflow across three layers:

1. **Frontend UI** — Remove the "Request Edit" button from the employee customers table Actions column; move it to the customer profile modal footer; ensure the modal is read-only for employees and matches the superadmin layout.
2. **Backend audit trail** — Enrich the `CUSTOMER_EDIT_REQUESTED` log with `branchName` and `actorLabel`; write a new `CUSTOMER_EDIT_PROCESSED` log when an admin saves customer changes, capturing a `changedFields` diff, `actorName`, `actorRole`, and `branchName`.
3. **Notifications** — Notify the branch admin when an employee submits a request; notify the originating employee when the admin processes it.

The changes are surgical: no new tables, no new modules, no new API routes beyond what already exists. All work fits inside the existing `customers`, `activity-logs`, and `notifications` modules.

---

## Architecture

```mermaid
flowchart TD
    subgraph Frontend
        CT[CustomerTable\n_components/customer-table.tsx]
        CPM[ViewCustomerModal\ncomponents/shared/customer-profile-modal.tsx]
        REM[RequestCustomerEditModal\ncomponents/shared/RequestCustomerEditModal.tsx]
        ALP[AuditLogsPage\napp/audit-logs/page.tsx]
    end

    subgraph Backend - NestJS
        CC[CustomersController\nPUT /:id  POST /:id/request-edit]
        CS[CustomersService\nupdate()  requestEdit()]
        ALS[ActivityLogsService\ncreateLog()  getLogs()]
        NS[NotificationsService\ncreate()  findAll()]
    end

    subgraph Database - Supabase
        AL[(activity_logs)]
        NT[(notifications)]
        CU[(customers)]
        BR[(branches)]
        US[(users)]
    end

    CT -->|view icon only| CPM
    CPM -->|employee footer btn| REM
    REM -->|POST /customers/:id/request-edit| CC
    CPM -->|admin PUT /customers/:id| CC
    CC --> CS
    CS --> ALS
    CS --> NS
    ALS --> AL
    NS --> NT
    ALP -->|GET /activity-logs| ALS
    ALS --> AL
    ALS --> BR
    ALS --> US
```

---

## Components and Interfaces

### 1. `CustomerTable` (`_components/customer-table.tsx`)

**Change:** The Actions column currently renders an edit icon that calls `openCustomer(row.id, "edit")`. For employees, this must be replaced with a view-only eye icon that calls `openCustomer(row.id)` (no `mode` param).

The `renderCell` function is the only touch point. The `openCustomer` helper already supports being called without a mode argument.

```ts
// Before (edit icon, navigates with mode=edit)
openCustomer(row.id, "edit")

// After (eye icon, navigates without mode param)
openCustomer(row.id)
```

The eye icon SVG replaces the pencil icon SVG. No other changes to this file.

### 2. `ViewCustomerModal` (`components/shared/customer-profile-modal.tsx`)

**Changes:**

- Remove the inline "Request Edit" button from inside the "Customer Profile / Record details" card body (currently rendered when `canRequestEdit` is true).
- Add a modal footer bar visible only when `canRequestEdit` is true, containing the "Request Edit" button.
- The footer sits below the two-column body grid, inside the modal container, before the closing `</div>` of `modalClass`.
- Employee users see all fields in read-only mode (already the case when `isEditing` is false and `canEdit` is false — no change needed to field rendering logic).

Footer structure:
```tsx
{canRequestEdit && (
  <div className="border-t border-border-main px-6 py-4 flex justify-end">
    <button
      type="button"
      onClick={() => setIsRequestOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100"
    >
      {/* pencil icon */}
      Request Edit
    </button>
  </div>
)}
```

### 3. `CustomersService.requestEdit()` (`customers/services/customers.service.ts`)

**Changes:**

- Resolve `branchName` from the `branches` table using `user.branchId`.
- Add `branchName` and `actorLabel` (`"<Full Name> (Employee)"`) to the `details` JSON.
- After writing the activity log, call `NotificationsService.create()` with a branch-targeted notification (no `user_id`, `branch_id` = employee's branch).

```ts
// New details shape for CUSTOMER_EDIT_REQUESTED
{
  customerId: id,
  customerName: customer.full_name,
  notes: trimmed,
  branchName: resolvedBranchName,
  actorLabel: `${user.fullName} (Employee)`,
}
```

**Dependency injection:** `NotificationsService` must be injected into `CustomersService`. The `CustomersModule` must import `NotificationsModule`.

### 4. `CustomersService.update()` (`customers/services/customers.service.ts`)

**Changes:**

- Accept an optional `requestingEmployeeId?: string` parameter in the DTO (passed from the frontend when the admin is processing a known edit request).
- Before updating, fetch the existing customer record to capture old field values.
- After a successful update, compute `changedFields` diff.
- Write a `CUSTOMER_EDIT_PROCESSED` activity log entry.
- If `requestingEmployeeId` is present, create an employee-targeted notification.

```ts
// changedFields diff shape
changedFields: {
  full_name?: { from: string; to: string },
  contact_number?: { from: string; to: string },
  email?: { from: string; to: string },
  address?: { from: string; to: string },
  barangay?: { from: string; to: string },
  city?: { from: string; to: string },
  region?: { from: string; to: string },
}

// New details shape for CUSTOMER_EDIT_PROCESSED
{
  customerId: id,
  customerName: existing.full_name,
  changedFields,
  actorName: user.fullName,
  actorRole: "Admin",
  actorLabel: `${user.fullName} (Admin)`,
  branchName: user.branchName,
}
```

### 5. `UpdateCustomerDto` (`customers/dto/update-customer.dto.ts`)

Add optional `requestingEmployeeId?: string` field so the frontend can pass the originating employee's user ID when the admin processes a known request.

### 6. `ActivityLogsService.getLogs()` (`activity-logs/activity-logs.service.ts`)

No structural changes needed. The existing query already returns all `activity_logs` rows filtered by `branch_id` for admin/employee roles. `CUSTOMER_EDIT_PROCESSED` entries will appear automatically once they are written with the correct `branch_id`.

### 7. `AuditLogsPage` (`app/(pages)/audit-logs/page.tsx`)

**Changes to `formatActivityDescription()`:**

Add two new action handlers before the generic fallback:

```ts
if (action === "CUSTOMER_EDIT_PROCESSED" && record) {
  const customerName = typeof record.customerName === "string" ? record.customerName : "a customer";
  const actorLabel = typeof record.actorLabel === "string" ? record.actorLabel : "Admin";
  const changedFields = isRecord(record.changedFields) ? Object.keys(record.changedFields) : [];
  const fieldList = changedFields.map(titleCase).join(", ");
  return fieldList
    ? `${actorLabel} updated ${customerName}'s profile: ${fieldList}.`
    : `${actorLabel} updated ${customerName}'s profile.`;
}

if (action === "CUSTOMER_EDIT_REQUESTED" && record) {
  const customerName = typeof record.customerName === "string" ? record.customerName : "a customer";
  const actorLabel = typeof record.actorLabel === "string" ? record.actorLabel : "Employee";
  const branchName = typeof record.branchName === "string" ? record.branchName : null;
  return branchName
    ? `${actorLabel} requested an edit for ${customerName} (${branchName}).`
    : `${actorLabel} requested an edit for ${customerName}.`;
}
```

**Changes to `formatFriendlyActionLabel()`:**

```ts
if (action === "CUSTOMER_EDIT_PROCESSED") return "Customer profile update";
if (action === "CUSTOMER_EDIT_REQUESTED") return "Customer edit request";
```

### 8. `NotificationsService` (`notifications/services/notifications.service.ts`)

No changes needed. The existing `create()` method already accepts `user_id`, `branch_id`, `title`, `subtitle`, and `category`. The `findAll()` method already returns notifications matching `branch_id` or `user_id` for the requesting user.

---

## Data Models

### `activity_logs` table (existing, no schema change)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users.id |
| `branch_id` | uuid | FK → branches.id |
| `action` | text | `CUSTOMER_EDIT_REQUESTED` or `CUSTOMER_EDIT_PROCESSED` |
| `details` | text | JSON string (see shapes below) |
| `created_at` | timestamptz | auto |

**`CUSTOMER_EDIT_REQUESTED` details shape:**
```json
{
  "customerId": "uuid",
  "customerName": "Juan dela Cruz",
  "notes": "Please update the contact number.",
  "branchName": "Makati Branch",
  "actorLabel": "Maria Santos (Employee)"
}
```

**`CUSTOMER_EDIT_PROCESSED` details shape:**
```json
{
  "customerId": "uuid",
  "customerName": "Juan dela Cruz",
  "changedFields": {
    "contact_number": { "from": "09171234567", "to": "09179999999" },
    "email": { "from": "old@email.com", "to": "new@email.com" }
  },
  "actorName": "Jeremiah Reyes",
  "actorRole": "Admin",
  "actorLabel": "Jeremiah Reyes (Admin)",
  "branchName": "Makati Branch"
}
```

### `notifications` table (existing, no schema change)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | |
| `subtitle` | text | |
| `category` | text | `"Requests"` |
| `user_id` | uuid | null for branch-broadcast |
| `branch_id` | uuid | null for global |
| `is_read` | boolean | default false |
| `created_at` | timestamptz | auto |

**Admin notification (on employee request submission):**
```json
{
  "title": "Customer Edit Request",
  "subtitle": "Maria Santos (Employee) requested an edit for Juan dela Cruz",
  "category": "Requests",
  "user_id": null,
  "branch_id": "<employee_branch_id>"
}
```

**Employee notification (on admin processing):**
```json
{
  "title": "Edit Request Processed",
  "subtitle": "Jeremiah Reyes (Admin) updated Juan dela Cruz's profile",
  "category": "Requests",
  "user_id": "<originating_employee_user_id>",
  "branch_id": "<admin_branch_id>"
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CUSTOMER_EDIT_REQUESTED log is branch-scoped with required details

*For any* employee with a valid `branchId` submitting a customer edit request, the resulting `CUSTOMER_EDIT_REQUESTED` activity log entry SHALL have `branch_id` equal to the employee's `branchId`, and its `details` JSON SHALL contain `branchName` and `actorLabel` fields matching the employee's branch and identity.

**Validates: Requirements 4.1, 4.2, 7.4**

---

### Property 2: Admin notification is branch-targeted and never super_admin-targeted

*For any* employee submitting a customer edit request, the resulting notification SHALL have `branch_id` equal to the employee's `branchId`, `user_id` equal to `null`, and `category` equal to `"Requests"`. No notification with a super_admin `user_id` SHALL be created.

**Validates: Requirements 4.3, 4.4, 8.1**

---

### Property 3: Notification subtitle contains both actor and customer names

*For any* employee and customer combination, the admin notification subtitle SHALL contain the employee's name and the customer's name. For any admin and customer combination, the employee notification subtitle SHALL contain the admin's name and the customer's name.

**Validates: Requirements 8.3, 9.3**

---

### Property 4: CUSTOMER_EDIT_PROCESSED log captures complete diff and actor context

*For any* admin saving changes to a customer record, the resulting `CUSTOMER_EDIT_PROCESSED` activity log entry SHALL have `user_id` equal to the admin's ID, `branch_id` equal to the admin's `branchId`, and its `details` JSON SHALL contain `customerId`, `customerName`, `changedFields` (with `from`/`to` pairs for every modified field), `actorName`, `actorRole`, `actorLabel`, and `branchName`.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.1, 7.2**

---

### Property 5: changedFields only contains actually-changed fields

*For any* customer update, the `changedFields` object SHALL contain an entry for a field if and only if the new value differs from the old value. Fields whose values are unchanged SHALL NOT appear in `changedFields`.

**Validates: Requirements 7.2**

---

### Property 6: Audit log description for CUSTOMER_EDIT_PROCESSED contains customer name and changed fields

*For any* `CUSTOMER_EDIT_PROCESSED` log entry with a valid `details` JSON, the `formatActivityDescription` function SHALL return a string that contains the customer name and the human-readable names of all changed fields.

**Validates: Requirements 6.3, 7.3**

---

### Property 7: Audit log description for CUSTOMER_EDIT_REQUESTED contains customer name and branch name

*For any* `CUSTOMER_EDIT_REQUESTED` log entry with a valid `details` JSON containing `customerName` and `branchName`, the `formatActivityDescription` function SHALL return a string that contains both the customer name and the branch name.

**Validates: Requirements 6.4**

---

### Property 8: Employee notification is only created when an originating employee ID is present

*For any* admin save, an employee-targeted notification (with a non-null `user_id`) SHALL be created if and only if a `requestingEmployeeId` is provided. When no `requestingEmployeeId` is present, no notification with a non-null `user_id` SHALL be created.

**Validates: Requirements 9.1, 9.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `branchName` lookup fails (branch not found) | Fall back to `user.branchName` from the authenticated profile; if also null, use `"Unknown Branch"`. Never throw. |
| Activity log write fails in `requestEdit` | Re-throw `InternalServerErrorException` (existing behavior). |
| Activity log write fails in `update` | Log the error silently (same pattern as `ActivityLogsService.createLog`); do not fail the customer update. |
| Notification creation fails | Log silently; do not fail the main operation (existing `NotificationsService.create` behavior). |
| `requestingEmployeeId` provided but user not found | Skip employee notification silently; log a warning. |
| `changedFields` diff is empty (no actual changes) | Still write the `CUSTOMER_EDIT_PROCESSED` log with an empty `changedFields` object; do not skip the log. |
| Employee submits request for a customer in a different branch | Existing `findOne` scope check handles this; returns 404. |

---

## Testing Strategy

### Unit Tests (example-based)

**`CustomerTable` component:**
- Renders only the eye/view icon in the Actions column (no edit/request button).
- Clicking the view icon navigates without `mode=request` or `mode=edit` query params.

**`ViewCustomerModal` component:**
- With `userRole="employee"`: footer contains "Request Edit" button; card body does not.
- With `userRole="admin"` or `"super_admin"`: footer does not contain "Request Edit" button; "Edit Profile" button is present.
- All profile fields render as read-only divs (not inputs) when `userRole="employee"`.
- Clicking the footer "Request Edit" button opens `RequestCustomerEditModal`.

**`formatActivityDescription` (pure function):**
- `CUSTOMER_EDIT_PROCESSED` entry → description includes customer name and changed field names.
- `CUSTOMER_EDIT_REQUESTED` entry → description includes customer name and branch name.
- Entries with missing/null details fields → graceful fallback strings, no crash.

**`CustomersService.requestEdit` (unit, mocked Supabase):**
- Writes log with correct `branch_id`, `branchName`, and `actorLabel`.
- Creates branch-targeted notification with `user_id=null`.
- Does not create a super_admin notification.

**`CustomersService.update` (unit, mocked Supabase):**
- Writes `CUSTOMER_EDIT_PROCESSED` log with correct `user_id`, `branch_id`, and `changedFields` diff.
- Creates employee notification when `requestingEmployeeId` is provided.
- Does not create employee notification when `requestingEmployeeId` is absent.
- `changedFields` contains only fields that actually changed.

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check) for TypeScript.

Each property test runs a minimum of **100 iterations**.

**Property 1 — CUSTOMER_EDIT_REQUESTED log is branch-scoped with required details**
- Generator: random employee profile (id, fullName, branchId, branchName), random customerId, random notes string.
- Assert: resulting log has `branch_id === employee.branchId`, `details.branchName === employee.branchName`, `details.actorLabel === "${employee.fullName} (Employee)"`.
- Tag: `Feature: customer-edit-request-workflow, Property 1: CUSTOMER_EDIT_REQUESTED log is branch-scoped with required details`

**Property 2 — Admin notification is branch-targeted and never super_admin-targeted**
- Generator: random employee profile, random customer.
- Assert: notification has `branch_id === employee.branchId`, `user_id === null`, `category === "Requests"`.
- Tag: `Feature: customer-edit-request-workflow, Property 2: Admin notification is branch-targeted and never super_admin-targeted`

**Property 3 — Notification subtitle contains both actor and customer names**
- Generator: random employee name, random customer name (for admin notification); random admin name, random customer name (for employee notification).
- Assert: subtitle string contains both names.
- Tag: `Feature: customer-edit-request-workflow, Property 3: Notification subtitle contains both actor and customer names`

**Property 4 — CUSTOMER_EDIT_PROCESSED log captures complete diff and actor context**
- Generator: random admin profile, random existing customer record, random update DTO with a subset of fields changed.
- Assert: log has `user_id === admin.id`, `branch_id === admin.branchId`, `details` contains all required keys, `details.changedFields` has `from`/`to` for each changed field.
- Tag: `Feature: customer-edit-request-workflow, Property 4: CUSTOMER_EDIT_PROCESSED log captures complete diff and actor context`

**Property 5 — changedFields only contains actually-changed fields**
- Generator: random existing customer record, random update DTO (may overlap or differ on any subset of fields).
- Assert: `changedFields` keys are exactly the set of fields where `updateDto[field] !== existing[field]`.
- Tag: `Feature: customer-edit-request-workflow, Property 5: changedFields only contains actually-changed fields`

**Property 6 — Audit log description for CUSTOMER_EDIT_PROCESSED contains customer name and changed fields**
- Generator: random `CUSTOMER_EDIT_PROCESSED` details object (random customerName, random changedFields with 1–5 keys).
- Assert: `formatActivityDescription("CUSTOMER_EDIT_PROCESSED", JSON.stringify(details), [], new Map())` contains `customerName` and each changed field key (humanized).
- Tag: `Feature: customer-edit-request-workflow, Property 6: Audit log description for CUSTOMER_EDIT_PROCESSED contains customer name and changed fields`

**Property 7 — Audit log description for CUSTOMER_EDIT_REQUESTED contains customer name and branch name**
- Generator: random `CUSTOMER_EDIT_REQUESTED` details object (random customerName, random branchName).
- Assert: `formatActivityDescription("CUSTOMER_EDIT_REQUESTED", JSON.stringify(details), [], new Map())` contains `customerName` and `branchName`.
- Tag: `Feature: customer-edit-request-workflow, Property 7: Audit log description for CUSTOMER_EDIT_REQUESTED contains customer name and branch name`

**Property 8 — Employee notification is only created when an originating employee ID is present**
- Generator: random admin profile, random customer, random boolean for whether `requestingEmployeeId` is present.
- Assert: employee notification (non-null `user_id`) is created iff `requestingEmployeeId` is present.
- Tag: `Feature: customer-edit-request-workflow, Property 8: Employee notification is only created when an originating employee ID is present`

### Integration Tests

- `GET /activity-logs` as admin returns only logs with matching `branch_id` (including `CUSTOMER_EDIT_PROCESSED`).
- `GET /activity-logs` as super_admin returns logs from all branches.
- `POST /customers/:id/request-edit` as employee creates both the activity log row and the notification row in Supabase.
- `PUT /customers/:id` as admin creates the `CUSTOMER_EDIT_PROCESSED` log row and (when `requestingEmployeeId` is provided) the employee notification row.
