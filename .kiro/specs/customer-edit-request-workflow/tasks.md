# Implementation Plan: Customer Edit Request Workflow

## Overview

Incremental implementation across frontend (Next.js/TypeScript) and backend (NestJS). Each task builds on the previous, ending with full integration. All changes are surgical — no new tables, modules, or API routes beyond what already exists.

## Tasks

- [x] 1. Update `UpdateCustomerDto` to accept optional `requestingEmployeeId`
  - In `PMS_backend/src/customers/dto/update-customer.dto.ts`, add `@IsOptional() @IsString() requestingEmployeeId?: string`
  - _Requirements: 9.1_

- [x] 2. Import `NotificationsModule` into `CustomersModule`
  - In `PMS_backend/src/customers/customers.module.ts`, add `NotificationsModule` to the `imports` array so `NotificationsService` can be injected into `CustomersService`
  - _Requirements: 4.3, 8.1_

- [x] 3. Enrich `CustomersService.requestEdit()` with branch name, actor label, and admin notification
  - In `PMS_backend/src/customers/services/customers.service.ts`:
    - Inject `NotificationsService` via constructor
    - Query the `branches` table for `name` using `user.branchId`; fall back to `user.branchName` then `"Unknown Branch"` if not found
    - Add `branchName` and `actorLabel` (`"<fullName> (Employee)"`) to the `details` JSON of the `CUSTOMER_EDIT_REQUESTED` log
    - After writing the activity log, call `NotificationsService.create()` with `{ title: "Customer Edit Request", subtitle: "<actorLabel> requested an edit for <customerName>", category: "Requests", user_id: null, branch_id: user.branchId }`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.4, 8.1, 8.2, 8.3_

  - [ ]* 3.1 Write property test — Property 1: CUSTOMER_EDIT_REQUESTED log is branch-scoped with required details
    - Using `fast-check`, generate random employee profiles and assert the resulting log has `branch_id === employee.branchId`, `details.branchName === employee.branchName`, `details.actorLabel === "${employee.fullName} (Employee)"`
    - **Property 1: CUSTOMER_EDIT_REQUESTED log is branch-scoped with required details**
    - **Validates: Requirements 4.1, 4.2, 7.4**

  - [ ]* 3.2 Write property test — Property 2: Admin notification is branch-targeted and never super_admin-targeted
    - Using `fast-check`, generate random employee profiles and assert notification has `branch_id === employee.branchId`, `user_id === null`, `category === "Requests"`
    - **Property 2: Admin notification is branch-targeted and never super_admin-targeted**
    - **Validates: Requirements 4.3, 4.4, 8.1**

  - [ ]* 3.3 Write property test — Property 3: Notification subtitle contains both actor and customer names
    - Using `fast-check`, generate random employee names and customer names; assert admin notification subtitle contains both
    - **Property 3: Notification subtitle contains both actor and customer names**
    - **Validates: Requirements 8.3, 9.3**

- [x] 4. Enrich `CustomersService.update()` with changedFields diff, CUSTOMER_EDIT_PROCESSED log, and employee notification
  - In `PMS_backend/src/customers/services/customers.service.ts`:
    - Before updating, fetch the existing customer record to capture old field values
    - After a successful update, compute `changedFields` diff (only fields where `newValue !== oldValue`)
    - Write a `CUSTOMER_EDIT_PROCESSED` activity log with `user_id = admin.id`, `branch_id = admin.branchId`, and `details` containing `customerId`, `customerName`, `changedFields`, `actorName`, `actorRole: "Admin"`, `actorLabel: "<fullName> (Admin)"`, `branchName`
    - If `requestingEmployeeId` is present in the DTO, call `NotificationsService.create()` with `{ title: "Edit Request Processed", subtitle: "<actorLabel> updated <customerName>'s profile", category: "Requests", user_id: requestingEmployeeId, branch_id: admin.branchId }`; if employee not found, skip silently with a warning log
    - Activity log write failures must be caught and logged silently (do not fail the update); notification failures are already silent
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 4.1 Write property test — Property 4: CUSTOMER_EDIT_PROCESSED log captures complete diff and actor context
    - Using `fast-check`, generate random admin profiles, existing customer records, and update DTOs; assert log has correct `user_id`, `branch_id`, and all required `details` keys with `from`/`to` pairs
    - **Property 4: CUSTOMER_EDIT_PROCESSED log captures complete diff and actor context**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.1, 7.2**

  - [ ]* 4.2 Write property test — Property 5: changedFields only contains actually-changed fields
    - Using `fast-check`, generate random existing customer records and update DTOs; assert `changedFields` keys are exactly the set of fields where `updateDto[field] !== existing[field]`
    - **Property 5: changedFields only contains actually-changed fields**
    - **Validates: Requirements 7.2**

  - [ ]* 4.3 Write property test — Property 8: Employee notification is only created when an originating employee ID is present
    - Using `fast-check`, generate random admin profiles, customers, and a boolean for whether `requestingEmployeeId` is present; assert employee notification (non-null `user_id`) is created iff `requestingEmployeeId` is present
    - **Property 8: Employee notification is only created when an originating employee ID is present**
    - **Validates: Requirements 9.1, 9.4**

- [x] 5. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add `formatActivityDescription` and `formatFriendlyActionLabel` handlers in `AuditLogsPage`
  - In `PMS_frontend/app/(pages)/audit-logs/page.tsx`:
    - Add `CUSTOMER_EDIT_PROCESSED` handler: build description from `actorLabel`, `customerName`, and humanized `changedFields` keys
    - Add `CUSTOMER_EDIT_REQUESTED` handler: build description from `actorLabel`, `customerName`, and `branchName`
    - Add `formatFriendlyActionLabel` entries: `"CUSTOMER_EDIT_PROCESSED"` → `"Customer profile update"`, `"CUSTOMER_EDIT_REQUESTED"` → `"Customer edit request"`
  - _Requirements: 6.3, 6.4, 7.3_

  - [ ]* 6.1 Write property test — Property 6: Audit log description for CUSTOMER_EDIT_PROCESSED contains customer name and changed fields
    - Using `fast-check`, generate random `CUSTOMER_EDIT_PROCESSED` details objects (random `customerName`, 1–5 random `changedFields` keys); assert `formatActivityDescription` output contains `customerName` and each humanized field key
    - **Property 6: Audit log description for CUSTOMER_EDIT_PROCESSED contains customer name and changed fields**
    - **Validates: Requirements 6.3, 7.3**

  - [ ]* 6.2 Write property test — Property 7: Audit log description for CUSTOMER_EDIT_REQUESTED contains customer name and branch name
    - Using `fast-check`, generate random `CUSTOMER_EDIT_REQUESTED` details objects (random `customerName`, random `branchName`); assert `formatActivityDescription` output contains both
    - **Property 7: Audit log description for CUSTOMER_EDIT_REQUESTED contains customer name and branch name**
    - **Validates: Requirements 6.4**

- [x] 7. Update `CustomerTable` — replace edit icon with eye/view icon for employees
  - In the employee customers table component (`_components/customer-table.tsx` or equivalent), update the `renderCell` function for the Actions column:
    - Replace the pencil/edit icon with an eye/view SVG icon
    - Change the click handler from `openCustomer(row.id, "edit")` to `openCustomer(row.id)` (no mode param)
    - Remove any "Request Edit" button from the Actions column
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Update `ViewCustomerModal` — move "Request Edit" to footer, remove from card body
  - In `PMS_frontend/components/shared/customer-profile-modal.tsx`:
    - Remove the inline "Request Edit" button from inside the "Customer Profile / Record details" card body (the block guarded by `canRequestEdit`)
    - Add a footer bar below the two-column body grid, inside the modal container, visible only when `canRequestEdit` is true:
      ```tsx
      {canRequestEdit && (
        <div className="border-t border-border-main px-6 py-4 flex justify-end">
          <button type="button" onClick={() => setIsRequestOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100">
            {/* pencil icon SVG */}
            Request Edit
          </button>
        </div>
      )}
      ```
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 9. Wire `requestingEmployeeId` from frontend to backend on admin save
  - In `PMS_frontend/lib/api.ts` (or wherever `updateCustomer` is defined), update the payload type to include optional `requestingEmployeeId?: string`
  - In `ViewCustomerModal.handleSave()`, pass `requestingEmployeeId` from props or context if available (e.g., from the `initialAction === "request"` flow or a prop passed by the parent page)
  - _Requirements: 9.1, 9.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already a common choice for TypeScript PBT)
- Notification failures are always silent — never fail the main operation
- `changedFields` diff compares only the 7 editable fields: `full_name`, `contact_number`, `email`, `address`, `barangay`, `city`, `region`
