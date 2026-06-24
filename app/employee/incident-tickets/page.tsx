import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function withSearchParams(path: string, searchParams: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export default async function EmployeeIncidentTicketsRedirect({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  redirect(withSearchParams("/employee/incident-report", (await searchParams) ?? {}));
}
