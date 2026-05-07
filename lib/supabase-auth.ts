import { api } from "./api";

export interface CreateUserDirectInput {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "employee";
  branchId: string;
}

export async function createUserDirectSupabase(
  input: CreateUserDirectInput
) {
  return api.post("/users", {
    fullName: input.fullName,
    email: input.email,
    password: input.password,
    role: input.role,
    branchId: input.branchId,
  });
}
