export interface CustomerDetail {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  address: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  profilePhoto: string | null;
  idFrontPhoto: string | null;
  idBackPhoto: string | null;
  matchingCustomerCount?: number;
  matchingBranchCount?: number;
  matchingCustomerIds?: string[];
  createdAt: string;
  branch: string;
  totalItemsPawned: number;
  activePawned: number;
  totalLoanValue: number;
  overduePayments: number;
  loyaltyPoints: number;
  loyaltyMax: number;
  transactions: Transaction[];
  rewards: Reward[];
  deadlines: Deadline[];
  activityLog: ActivityEntry[];
}

export interface Transaction {
  date: string;
  item: string;
  amount: number;
  status: string;
  branch: string;
}

export interface Reward {
  label: string;
  points: number;
}

export interface Deadline {
  date: string;
  label: string;
  variant: "warning" | "danger";
}

export interface ActivityEntry {
  title: string;
  date: string;
  description: string;
  color: string;
}
