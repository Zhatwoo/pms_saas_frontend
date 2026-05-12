export interface EmployeeActivityLog {
  id: string;
  userId: string;
  branchId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  userFullName: string;
  userRole: string;
  branchName: string;
}

export interface DisplayEmployeeActivityLog extends EmployeeActivityLog {
  dateLabel: string;
  timeLabel: string;
  actionLabel: string;
  description: string;
  reference: string;
  status: "Success" | "Pending" | "Failed";
}
