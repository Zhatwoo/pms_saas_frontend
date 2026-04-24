# Requirements Document

## Introduction

This feature refines the customer edit request workflow in the Pawnshop Management System (PMS). It covers three areas:

1. **Employee side UI** — Move the "Request Edit" action out of the customers table's Actions column and into the customer profile modal footer. The modal should match the updated superadmin UI. Edit requests must be routed to the admin only and must carry the originating branch name.

2. **Admin side audit trail** — After an admin processes a customer edit request, a structured activity log entry must be written that records what changed and who made the change (with role label). These entries must surface in the branch audit logs and the superadmin audit logs.

3. **Notifications** — The admin receives an in-app notification when an employee submits a request. The employee receives an in-app notification when the admin processes their request.

---

## Glossary

- **PMS**: Pawnshop Management System — the full-stack application (Next.js frontend + NestJS backend + Supabase/PostgreSQL).
- **Employee**: A PMS user with role `employee`, scoped to a single branch.
- **Admin**: A PMS user with role `admin`, scoped to a single branch.
- **Super_Admin**: A PMS user with role `super_admin`, with cross-branch visibility.
- **Customer_Profile_Modal**: The shared React component at `components/shared/customer-profile-modal.tsx` that displays and edits a customer record.
- **Request_Edit_Modal**: The shared React component at `components/shared/RequestCustomerEditModal.tsx` used by employees to compose and submit a customer edit request.
- **Activity_Log**: A row in the `activity_logs` Supabase table recording a system or user action with `action`, `details` (JSON), `user_id`, and `branch_id`.
- **Audit_Logs_Page**: The frontend page (`app/(pages)/audit-logs/page.tsx`) shared by admin and superadmin that renders activity log entries.
- **Notification**: A row in the `notifications` Supabase table with `title`, `subtitle`, `category`, `user_id`, and/or `branch_id`.
- **Branch_Name**: The human-readable name of the branch (e.g., "Makati Branch") stored in the `branches` table.
- **CUSTOMER_EDIT_REQUESTED**: The `action` string written to `activity_logs` when an employee submits a customer edit request.
- **CUSTOMER_EDIT_PROCESSED**: The `action` string written to `activity_logs` when an admin saves changes to a customer record in response to an edit request.

---

## Requirements

### Requirement 1: Remove "Request Edit" from the Employee Customers Table

**User Story:** As an employee, I want the customers table to show only a view icon in the Actions column, so that the table is uncluttered and the edit request action is discoverable in the correct place.

#### Acceptance Criteria

1. THE Employee_Customer_Table SHALL render the Actions column with only a view/eye icon button per row.
2. WHEN an employee clicks the view icon in the Actions column, THE Employee_Customer_Table SHALL navigate to the customer detail page in view-only mode (no `mode=request` query parameter).
3. THE Employee_Customer_Table SHALL NOT render a "Request Edit" button in the Actions column.

---

### Requirement 2: "Request Edit" Button in the Customer Profile Modal Footer (Employee)

**User Story:** As an employee, I want a "Request Edit" button in the footer of the customer profile modal, so that I can submit an edit request from within the full profile view.

#### Acceptance Criteria

1. WHEN the Customer_Profile_Modal is rendered for a user with role `employee`, THE Customer_Profile_Modal SHALL display a "Request Edit" button in the modal footer area.
2. WHEN an employee clicks the "Request Edit" button in the modal footer, THE Customer_Profile_Modal SHALL open the Request_Edit_Modal.
3. THE Customer_Profile_Modal SHALL NOT display the "Request Edit" button inline inside the "Customer Profile / Record details" card body when the user role is `employee`.
4. WHEN the user role is `admin` or `super_admin`, THE Customer_Profile_Modal SHALL NOT display the "Request Edit" button in the modal footer.

---

### Requirement 3: Employee-Side Modal UI Matches Superadmin UI

**User Story:** As an employee, I want the customer profile modal to display the same updated layout as the superadmin side, so that the experience is consistent across roles.

#### Acceptance Criteria

1. THE Customer_Profile_Modal SHALL render the same card layout, field arrangement, and identity media section for all roles (`employee`, `admin`, `super_admin`).
2. WHEN the user role is `employee`, THE Customer_Profile_Modal SHALL display all profile fields in read-only mode (no inline edit inputs).
3. WHEN the user role is `admin` or `super_admin`, THE Customer_Profile_Modal SHALL display the "Edit Profile" button and allow inline editing of customer fields.

---

### Requirement 4: Edit Request Routed to Admin Only with Branch Name

**User Story:** As an employee, I want my edit request to be sent to the admin of my branch (not the superadmin), so that the correct person reviews it, and I want the branch name included so the admin knows where the request originated.

#### Acceptance Criteria

1. WHEN an employee submits a customer edit request, THE Customers_Service SHALL write a `CUSTOMER_EDIT_REQUESTED` activity log entry with `branch_id` set to the employee's branch ID.
2. THE Customers_Service SHALL include `branchName` in the `details` JSON of the `CUSTOMER_EDIT_REQUESTED` log entry.
3. WHEN an employee submits a customer edit request, THE Notifications_Service SHALL create a notification targeted to the admin of the employee's branch (i.e., `branch_id` set to the employee's branch ID, `user_id` null) with category `Requests`.
4. THE Notifications_Service SHALL NOT create a notification targeted to the super_admin when an employee submits a customer edit request.

---

### Requirement 5: Activity Log Entry After Admin Processes an Edit Request

**User Story:** As an admin, I want every customer profile update I make to be recorded in the activity log with a clear description of what changed and who made the change, so that there is a full audit trail.

#### Acceptance Criteria

1. WHEN an admin saves changes to a customer record via the Customer_Profile_Modal, THE Customers_Service SHALL write a `CUSTOMER_EDIT_PROCESSED` activity log entry to the `activity_logs` table.
2. THE `CUSTOMER_EDIT_PROCESSED` log entry SHALL include in its `details` JSON: `customerId`, `customerName`, `changedFields` (an object mapping each changed field name to `{ from: <old_value>, to: <new_value> }`), `actorName`, `actorRole`, and `branchName`.
3. THE `CUSTOMER_EDIT_PROCESSED` log entry SHALL set `branch_id` to the admin's branch ID.
4. THE `CUSTOMER_EDIT_PROCESSED` log entry SHALL set `user_id` to the admin's user ID.

---

### Requirement 6: Activity Log Entry Visible in Branch and Superadmin Audit Logs

**User Story:** As an admin or superadmin, I want customer edit activity log entries to appear in the audit logs page, so that I can review all changes made to customer records.

#### Acceptance Criteria

1. WHEN the Audit_Logs_Page is viewed by an admin, THE Audit_Logs_Page SHALL display `CUSTOMER_EDIT_PROCESSED` log entries that belong to the admin's branch.
2. WHEN the Audit_Logs_Page is viewed by a super_admin, THE Audit_Logs_Page SHALL display `CUSTOMER_EDIT_PROCESSED` log entries from all branches.
3. THE Audit_Logs_Page SHALL render a human-readable description for `CUSTOMER_EDIT_PROCESSED` entries that includes the customer name and the list of changed fields.
4. THE Audit_Logs_Page SHALL render a human-readable description for `CUSTOMER_EDIT_REQUESTED` entries that includes the customer name and the originating branch name.

---

### Requirement 7: Activity Log Entry Displays What Changed and Who Made the Change

**User Story:** As an admin or superadmin reviewing audit logs, I want each customer edit log entry to clearly show what fields were changed and who made the change with their role, so that I can understand the full context of every modification.

#### Acceptance Criteria

1. THE `CUSTOMER_EDIT_PROCESSED` activity log entry SHALL record the actor's display name and role in the format `"<Full Name> (<Role>)"` (e.g., `"Jeremiah (Admin)"`).
2. THE `CUSTOMER_EDIT_PROCESSED` activity log entry SHALL record each changed field as a before/after pair in `changedFields`.
3. WHEN the Audit_Logs_Page renders a `CUSTOMER_EDIT_PROCESSED` entry, THE Audit_Logs_Page SHALL display the actor label (name + role) and the list of changed fields with their old and new values.
4. THE `CUSTOMER_EDIT_REQUESTED` activity log entry SHALL record the requesting employee's display name and role in the format `"<Full Name> (Employee)"` in the `details` JSON field `actorLabel`.

---

### Requirement 8: Admin Notification on Employee Edit Request Submission

**User Story:** As an admin, I want to receive an in-app notification when an employee from my branch submits a customer edit request, so that I can review and process it promptly.

#### Acceptance Criteria

1. WHEN an employee submits a customer edit request, THE Notifications_Service SHALL insert a notification row with `category` = `"Requests"`, `branch_id` = the employee's branch ID, and `user_id` = null.
2. THE notification `title` SHALL be `"Customer Edit Request"`.
3. THE notification `subtitle` SHALL include the customer's name and the requesting employee's name (e.g., `"Jeremiah (Employee) requested an edit for Juan dela Cruz"`).
4. WHEN the admin's notification panel fetches notifications, THE Notifications_Service SHALL return the notification created in AC1 for the admin's branch.

---

### Requirement 9: Employee Notification on Admin Processing of Edit Request

**User Story:** As an employee, I want to receive an in-app notification when the admin has processed my customer edit request, so that I know the update has been applied.

#### Acceptance Criteria

1. WHEN an admin saves changes to a customer record via the Customer_Profile_Modal, THE Notifications_Service SHALL insert a notification row with `category` = `"Requests"`, `user_id` = the ID of the employee who originally submitted the edit request, and `branch_id` = the admin's branch ID.
2. THE notification `title` SHALL be `"Edit Request Processed"`.
3. THE notification `subtitle` SHALL include the customer's name and the admin's name (e.g., `"Jeremiah (Admin) updated Juan dela Cruz's profile"`).
4. IF no originating employee user ID is available (e.g., the admin edits without a prior request), THE Notifications_Service SHALL NOT send an employee notification.
5. WHEN the employee's notification panel fetches notifications, THE Notifications_Service SHALL return the notification created in AC1 for that specific employee's `user_id`.
