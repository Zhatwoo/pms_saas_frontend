"use client";

import { useState } from "react";
import { FilterSelect } from "@/components/shared/filter-select";

const branchOptions = [
  { value: "all", label: "All" },
  { value: "taguig", label: "Taguig" },
  { value: "makati", label: "Makati" },
  { value: "pasay", label: "Pasay" },
];

const categoryOptions = [
  { value: "all", label: "All" },
  { value: "electronics", label: "Electronics" },
  { value: "jewellery", label: "Jewellery" },
];

const statusOptions = [
  { value: "all", label: "All" },
  { value: "pawned", label: "Pawned" },
  { value: "for-sale", label: "For Sale" },
  { value: "sold", label: "Sold" },
];

export function InventoryFilters() {
  const [branch, setBranch] = useState("taguig");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-4">
      <div className="w-full sm:w-auto">
        <FilterSelect
          label="Branch"
          options={branchOptions}
          value={branch}
          onChange={setBranch}
        />
      </div>
      <div className="w-full sm:w-auto">
        <FilterSelect
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />
      </div>
      <div className="w-full sm:w-auto">
        <FilterSelect
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </div>
    </div>
  );
}
