# Implementation Plan: review-edit-request

## Overview

Extend the existing customer edit request workflow with an Admin Review flow. The backend gains in-place log mutation (`CUSTOMER_EDIT_REQUESTED` → `CUSTOMER_EDIT_PROCESSED`) and a targeted employee notification. The frontend gains a "Review" button on pending edit entries, an "Edit Approved" display for processed entries, and a highlighted-field + floating-note experience inside the customer profile modal.

## Tasks

- [x] 1. Backend — extend `UpdateCustomerDto` with `logId`
  - Add `@IsOptional() @IsString() logId?: string;` to `PMS_backend/src/modules/customers/dto/update-customer.dto.ts`
  - _Requirements: 10.1, 10.5_

- [x] 2. Backend — update `CustomersService.update()` for the Review flow
  - [x] 2.1 Strip `logId` from the Supabase customers payload
    - Destructure `logId` alongside `requestingEmployeeId` before the `client.from('customers').update(...)` call so neither field reaches the DB column update
    - _Requirements: 10.5_

  - [x] 2.2 Add in-place log update branch when `logId` is provided
    - After the customer row is updated and `changedFields` is computed, add a conditional block: if `logId` is truthy, fetch the `activity_logs` row by `id = logId`
    - If the row exists and `row.action === 'CUSTOMER_EDIT_REQUESTED'`, build `mergedDetails` by spreading the original `details` JSON and adding `processedAt`, `adminName`, `adminId`, `reviewedField` (first key of `changedFields` or `null`), `oldValue`, `newValue`
    - Call `UPDATE activity_logs SET action='CUSTOMER_EDIT_PROCESSED', details=mergedDetails WHERE id=logId`
    - If the row is missing or has an unexpected action, log a warning and fall back to the existing `INSERT` path
    - Wrap the entire block in try/catch; on DB error, log silently and fall back to INSERT; the customer update must not fail
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.2, 10.3, 10.4_

  - [ ]* 2.3 Write property test for in-place log update (Property 5)
    - **Property 5: Log update in-place when logId is valid**
    - Mock Supabase; generate random `logId` UUIDs with matching `CUSTOMER_EDIT_REQUESTED` rows; assert UPDATE is called (not INSERT) with `action = CUSTOMER_EDIT_PROCESSED` and merged details
    - **Validates: Requirements 5.1, 5.2, 5.3, 10.2, 10.3**
    - Tag: `// Feature: review-edit-request, Property 5: Log update in-place when logId is valid`

  - [ ]* 2.4 Write property test for details merge preserving original fields (Property 6)
    - **Property 6: Details merge preserves all original fields**
    - Generate random original details objects with arbitrary keys; assert merged details is a superset of the original
    - **Validates: Requirements 5.3**
    - Tag: `// Feature: review-edit-request, Property 6: Details merge preserves all original fields`

  - [ ]* 2.5 Write property test for fallback to insert when logId absent or row not found (Property 7)
    - **Property 7: Fallback to insert when logId is absent or row not found**
    - Mock Supabase to return no row for any `logId`; assert service returns success and INSERT is called
    - **Validates: Requirements 5.4, 5.5, 10.4**
    - Tag: `// Feature: review-edit-request, Property 7: Fallback to insert when logId is absent or row not found`

  - [x] 2.6 Update employee notification subtitle for the Review flow
    - When `logId` is present and `requestingEmployeeId` is present, change the notification `title` to `"Edit Approved"` and build the subtitle using the `fieldLabelMap` and `changedFields` diff: `"<actorName> (Admin) updated <fieldLabel>: <oldValue> → <newValue>"` (omit the value part when both are absent)
    - Keep the existing notification path (no `logId`) unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 2.7 Write property test for notification subtitle format (Property 9)
    - **Property 9: Employee notification subtitle format**
    - Generate random `adminName`, `fieldLabel`, `oldValue`, `newValue` strings; assert subtitle matches the expected format string
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Tag: `// Feature: review-edit-request, Property 9: Employee notification subtitle format`

  - [ ]* 2.8 Write property test for notification failure not failing the update (Property 10)
    - **Property 10: Notification failure does not fail the update**
    - Mock `NotificationsService.create()` to throw; assert `update()` still returns `{ message: "Customer updated successfully" }`
    - **Validates: Requirements 8.5**
    - Tag: `// Feature: review-edit-request, Property 10: Notification failure does not fail the update`

- [x] 3. Checkpoint — backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Frontend — update `updateCustomer` in `lib/api.ts`
  - Add `logId?: string` to the `data` parameter type of `updateCustomer`
  - Pass it through in the PUT body alongside the existing fields
  - _Requirements: 9.5, 10.1_

- [-] 5. Frontend — add `ReviewContext` type and state to `view_user/page.tsx`
  - [ ] 5.1 Define `ReviewContext` type and add `reviewContext` state
    - Add `type ReviewContext = { logId: string; field: string | null; notes: string; requestingEmployeeId?: string; }` near the top of the file
    - Add `const [reviewContext, setReviewContext] = useState<ReviewContext | null>(null);` alongside the other state declarations
    - _Requirements: 9.1, 9.2_

  - [ ] 5.2 Add `handleReview` function
    - Implement `function handleReview(log: BackendActivityLog)` that reads `log.details`, builds a `ReviewContext`, calls `setReviewContext(...)`, and calls `setIsViewOpen(true)`
    - Extract `field` from `d.field` (string or null), `notes` from `d.notes` (string or ""), `requestingEmployeeId` from `log.userId ?? undefined`
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 5.3 Write property test for Review button visibility (Property 1)
    - **Property 1: Review button visibility is role- and action-gated**
    - Generate random arrays of log entries with random actions and random roles; assert Review button presence matches `action === CUSTOMER_EDIT_REQUESTED && (role === admin || role === super_admin)`
    - **Validates: Requirements 1.1, 1.2, 1.4**
    - Tag: `// Feature: review-edit-request, Property 1: Review button visibility is role- and action-gated`

- [-] 6. Frontend — render "Review" button on `CUSTOMER_EDIT_REQUESTED` feed items
  - Inside the `edit_request` branch of the feed render loop in `view_user/page.tsx`, add a "Review" pill button after the existing entry content
  - Only render the button when `(user?.role === "admin" || user?.role === "super_admin")` — the entry's action is already `CUSTOMER_EDIT_REQUESTED` by being in this branch
  - On click, call `handleReview` with the matching `activityLogs` entry (look up by `item.key` which equals `log.id`)
  - Style: small pill, e.g. `rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800 hover:bg-blue-100`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 7. Frontend — render "Edit Approved" for `CUSTOMER_EDIT_PROCESSED` entries
  - [ ] 7.1 Add `CUSTOMER_EDIT_PROCESSED` to the feed-building loop
    - When `log.action === "CUSTOMER_EDIT_PROCESSED"`, push a feed item with `kind: "edit_approved"` (new kind), carrying `rawDetails: d`
    - Add the `edit_approved` icon to `iconMap`: green check circle (`bg-emerald-100 text-emerald-700`)
    - _Requirements: 6.1, 6.2, 7.1_

  - [ ] 7.2 Render the "Edit Approved" feed item
    - In the `sorted.map(...)` render, add a branch for `item.kind === "edit_approved"` that shows:
      - Green check icon
      - Title: "Edit Approved"
      - Subtitle line: `<details.adminName>` and human-readable field label (use the same `fieldMap` already in the file, extended with `barangay`, `city`, `region`)
      - Value line: `<oldValue> → <newValue>` (omit when both are empty/null)
    - No "Review" button on these entries (they are already processed)
    - Render identically regardless of `user?.role`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

  - [ ]* 7.3 Write property test for "Edit Approved" rendering role-invariance (Property 8)
    - **Property 8: "Edit Approved" rendering is role-invariant**
    - Generate random `CUSTOMER_EDIT_PROCESSED` log entries with random `reviewedField`/`oldValue`/`newValue`; assert rendered output is identical across `admin`, `employee`, and `super_admin` roles
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2**
    - Tag: `// Feature: review-edit-request, Property 8: "Edit Approved" rendering is role-invariant`

- [~] 8. Frontend — update `ViewCustomerModal` props and wire `reviewContext`
  - [ ] 8.1 Add `reviewContext` prop to `ViewCustomerModalProps`
    - Add `reviewContext?: ReviewContext;` to the interface in `customer-profile-modal.tsx`
    - Import or inline the `ReviewContext` type (can be a local inline type since it's small)
    - _Requirements: 2.4_

  - [ ] 8.2 Pass `reviewContext` from `view_user/page.tsx` to `ViewCustomerModal`
    - Update the `<ViewCustomerModal ... />` JSX to pass `reviewContext={reviewContext ?? undefined}`
    - Update `onClose` to also call `setReviewContext(null)`
    - _Requirements: 2.4, 9.2_

- [~] 9. Frontend — auto-enter edit mode and highlight field in `customer-profile-modal.tsx`
  - [ ] 9.1 Auto-enter edit mode when `reviewContext` is present
    - Add a `useEffect` that sets `setIsEditing(true)` and marks `appliedInitialAction.current = true` when `reviewContext` is truthy (runs once on mount / when reviewContext changes)
    - _Requirements: 2.1_

  - [ ] 9.2 Add `highlighted` prop to `EditableField` and apply amber ring
    - Add `highlighted?: boolean` to `EditableField`'s props
    - When `highlighted` is true, add `ring-2 ring-amber-400 border-amber-400` to the `<input>` className
    - _Requirements: 2.2, 2.3_

  - [ ] 9.3 Pass `highlighted` to the correct `EditableField` instances
    - Compute `const highlightedField = reviewContext?.field ?? null;`
    - Pass `highlighted={highlightedField === "full_name"}` to the Full Name field, `highlighted={highlightedField === "contact_number"}` to Contact Number, `highlighted={highlightedField === "email"}` to Email Address
    - For address sub-fields (`address`, `barangay`, `city`, `region`) inside `PhilippineAddressFields`, pass a `highlightedField` prop if the component supports it, or wrap with a visual indicator if not
    - _Requirements: 2.2, 2.3_

  - [ ]* 9.4 Write property test for field highlight matching reviewContext.field (Property 2)
    - **Property 2: Field highlight matches reviewContext.field**
    - Generate random field keys from the known set plus null; assert highlight class appears on exactly the matching input and no other
    - **Validates: Requirements 2.2, 2.3**
    - Tag: `// Feature: review-edit-request, Property 2: Field highlight matches reviewContext.field`

- [~] 10. Frontend — render floating employee note callout
  - In `customer-profile-modal.tsx`, render the `Floating_Note` callout above the fields section when `reviewContext?.notes` is a non-empty string (after trimming)
  - Callout markup: amber-tinted box with a pencil icon, "Employee Note" label, and the notes text
  - Do not render when `reviewContext` is absent or `notes` is empty/whitespace
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 10.1 Write property test for floating note render condition (Property 4)
    - **Property 4: Floating note renders iff notes is non-empty**
    - Generate random notes strings (empty, whitespace-only, non-empty); assert Floating_Note presence matches `notes.trim().length > 0`
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
    - Tag: `// Feature: review-edit-request, Property 4: Floating note renders iff notes is non-empty`

- [~] 11. Frontend — include `logId` in the save payload
  - In `handleSave` inside `customer-profile-modal.tsx`, spread `...(reviewContext?.logId ? { logId: reviewContext.logId } : {})` into the `updateCustomer` call alongside the existing `requestingEmployeeId` spread
  - _Requirements: 2.5, 4.2, 4.3, 9.5_

  - [ ]* 11.1 Write property test for save payload including logId and requestingEmployeeId (Property 3)
    - **Property 3: Save payload includes logId and requestingEmployeeId from reviewContext**
    - Generate random `logId` strings and `requestingEmployeeId` strings; assert both appear verbatim in the `updateCustomer` call payload
    - **Validates: Requirements 2.5, 4.2, 4.3, 9.5**
    - Tag: `// Feature: review-edit-request, Property 3: Save payload includes logId and requestingEmployeeId from reviewContext`

- [~] 12. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Backend tasks (1–3) should be completed before frontend tasks (4–12) to avoid integration mismatches
- The `logId` field must be stripped from the Supabase `customers` update payload in the same destructure step as `requestingEmployeeId`
- Property tests should run a minimum of 100 iterations each
- The `CUSTOMER_EDIT_PROCESSED` feed kind is new — add it to the `FeedItem` union type in `view_user/page.tsx`
