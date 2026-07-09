"use client";

import { useEffect, useRef, useState } from "react";

type AddressOption = {
  code: string;
  name: string;
};

type AddressValue = {
  address: string;
  barangay: string;
  city: string;
  region: string;
};

interface PhilippineAddressFieldsProps {
  value: AddressValue;
  disabled?: boolean;
  highlightedField?: keyof AddressValue | null;
  onFieldChange: (field: keyof AddressValue, value: string) => void;
}

const fieldClass =
  "h-11 w-full rounded-2xl border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-surface-secondary";

const baseUrl = "https://psgc.gitlab.io/api";

async function fetchOptions(path: string): Promise<AddressOption[]> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Failed to load address options from ${path}`);
  return (await response.json()) as AddressOption[];
}

function toOption(option: AddressOption) {
  return option.name.replace(/National Capital Region\s*\(NCR\)/i, "Metro Manila");
}

function normalizeRegionName(name: string) {
  return name.replace(/National Capital Region\s*\(NCR\)/i, "Metro Manila");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function PhilippineAddressFields({
  value,
  disabled = false,
  highlightedField = null,
  onFieldChange,
}: PhilippineAddressFieldsProps) {
  const [regions, setRegions] = useState<AddressOption[]>([]);
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [barangays, setBarangays] = useState<AddressOption[]>([]);
  const [addressMode, setAddressMode] = useState<"province" | "region">("province");
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasHydratedInitialAddress = useRef(false);

  // Load regions on mount
  useEffect(() => {
    let isActive = true;
    async function loadRegions() {
      try {
        const nextRegions = await fetchOptions("/regions/");
        if (isActive) { setRegions(nextRegions); setError(null); }
      } catch {
        if (isActive) setError("Philippines address dropdowns are temporarily unavailable.");
      }
    }
    void loadRegions();
    return () => { isActive = false; };
  }, []);

  // Hydrate existing address — match by region name first, then fall back to city search
  useEffect(() => {
    if (hasHydratedInitialAddress.current) return;

    const hasExistingAddress = Boolean(value.region || value.city || value.barangay || value.address);
    if (!hasExistingAddress) { hasHydratedInitialAddress.current = true; return; }

    let isActive = true;

    async function hydrateExistingAddress() {
      try {
        const allRegions = regions.length > 0 ? regions : await fetchOptions("/regions/");
        const regionName = normalizeText(value.region);
        const cityName = normalizeText(value.city);
        const barangayName = normalizeText(value.barangay);

        // Try to match by stored region name (also handles "Metro Manila" → NCR)
        const matchingRegion = regionName
          ? allRegions.find((r) =>
              normalizeText(r.name) === regionName ||
              normalizeText(normalizeRegionName(r.name)) === regionName
            )
          : null;

        if (matchingRegion) {
          if (!isActive) return;
          setRegionCode(matchingRegion.code);

          const nextProvinces = await fetchOptions(`/regions/${matchingRegion.code}/provinces/`);
          if (!isActive) return;

          if (nextProvinces.length > 0) {
            setProvinces(nextProvinces);
            setAddressMode("province");
            // Load cities for first province that has a matching city
            for (const prov of nextProvinces) {
              const provCities = await fetchOptions(`/provinces/${prov.code}/cities-municipalities/`);
              const matchingCity = cityName ? provCities.find((c) => normalizeText(c.name) === cityName) : null;
              if (matchingCity) {
                if (!isActive) return;
                setProvinceCode(prov.code);
                setCities(provCities);
                setCityCode(matchingCity.code);
                const nextBarangays = await fetchOptions(`/cities-municipalities/${matchingCity.code}/barangays/`);
                if (!isActive) return;
                setBarangays(nextBarangays);
                const matchingBarangay = barangayName ? nextBarangays.find((b) => normalizeText(b.name) === barangayName) : null;
                if (matchingBarangay) setBarangayCode(matchingBarangay.code);
                break;
              }
            }
          } else {
            // Region with no provinces (e.g. NCR)
            setAddressMode("region");
            const regionCities = await fetchOptions(`/regions/${matchingRegion.code}/cities-municipalities/`);
            if (!isActive) return;
            setCities(regionCities);
            const matchingCity = cityName ? regionCities.find((c) => normalizeText(c.name) === cityName) : null;
            if (matchingCity) {
              setCityCode(matchingCity.code);
              const nextBarangays = await fetchOptions(`/cities-municipalities/${matchingCity.code}/barangays/`);
              if (!isActive) return;
              setBarangays(nextBarangays);
              const matchingBarangay = barangayName ? nextBarangays.find((b) => normalizeText(b.name) === barangayName) : null;
              if (matchingBarangay) setBarangayCode(matchingBarangay.code);
            }
          }
        } else if (cityName) {
          // Fallback: search all regions for the city
          for (const region of allRegions) {
            const regionCities = await fetchOptions(`/regions/${region.code}/cities-municipalities/`);
            const matchingCity = regionCities.find((c) => normalizeText(c.name) === cityName);
            if (matchingCity) {
              if (!isActive) return;
              setRegionCode(region.code);
              setAddressMode("region");
              setCities(regionCities);
              setCityCode(matchingCity.code);
              onFieldChange("region", normalizeRegionName(region.name));
              const nextBarangays = await fetchOptions(`/cities-municipalities/${matchingCity.code}/barangays/`);
              if (!isActive) return;
              setBarangays(nextBarangays);
              const matchingBarangay = barangayName ? nextBarangays.find((b) => normalizeText(b.name) === barangayName) : null;
              if (matchingBarangay) setBarangayCode(matchingBarangay.code);
              break;
            }
          }
        }
      } catch {
        if (isActive) setError("Philippines address dropdowns are temporarily unavailable.");
      } finally {
        if (isActive) hasHydratedInitialAddress.current = true;
      }
    }

    void hydrateExistingAddress();
    return () => { isActive = false; };
  }, [regions, value.address, value.barangay, value.city, value.region, onFieldChange]);

  // Load provinces when region changes
  useEffect(() => {
    let isActive = true;
    async function loadProvinces() {
      if (!regionCode) {
        setProvinces([]); setCities([]); setBarangays([]); setAddressMode("province");
        return;
      }
      try {
        const nextProvinces = await fetchOptions(`/regions/${regionCode}/provinces/`);
        if (isActive) {
          setProvinces(nextProvinces);
          setAddressMode(nextProvinces.length > 0 ? "province" : "region");
          setError(null);
          if (nextProvinces.length === 0) {
            const nextCities = await fetchOptions(`/regions/${regionCode}/cities-municipalities/`);
            if (isActive) { setCities(nextCities); setBarangays([]); }
          } else {
            setCities([]); setBarangays([]);
          }
        }
      } catch {
        if (isActive) {
          setProvinces([]); setCities([]); setBarangays([]); setAddressMode("province");
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      }
    }
    void loadProvinces();
    return () => { isActive = false; };
  }, [regionCode]);

  // Load cities when province changes
  useEffect(() => {
    let isActive = true;
    async function loadCities() {
      if (!provinceCode) { setCities([]); setBarangays([]); return; }
      try {
        const nextCities = await fetchOptions(`/provinces/${provinceCode}/cities-municipalities/`);
        if (isActive) { setCities(nextCities); setError(null); }
      } catch {
        if (isActive) { setCities([]); setBarangays([]); setError("Philippines address dropdowns are temporarily unavailable."); }
      }
    }
    void loadCities();
    return () => { isActive = false; };
  }, [provinceCode]);

  // Load barangays when city changes
  useEffect(() => {
    let isActive = true;
    async function loadBarangays() {
      if (!cityCode) { setBarangays([]); return; }
      try {
        const nextBarangays = await fetchOptions(`/cities-municipalities/${cityCode}/barangays/`);
        if (isActive) { setBarangays(nextBarangays); setError(null); }
      } catch {
        if (isActive) { setBarangays([]); setError("Philippines address dropdowns are temporarily unavailable."); }
      }
    }
    void loadBarangays();
    return () => { isActive = false; };
  }, [cityCode]);

  function handleRegionChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCode = event.target.value;
    const nextName = normalizeRegionName(regions.find((r) => r.code === nextCode)?.name || "");
    setRegionCode(nextCode);
    setAddressMode("province");
    setProvinceCode(""); setCityCode(""); setBarangayCode("");
    setProvinces([]); setCities([]); setBarangays([]);
    onFieldChange("region", nextName);
    onFieldChange("city", "");
    onFieldChange("barangay", "");
  }

  function handleProvinceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    setProvinceCode(selectedValue);
    setCityCode(""); setBarangayCode("");
    setCities([]); setBarangays([]);
    onFieldChange("city", "");
    onFieldChange("barangay", "");
  }

  function handleCityChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const selectedCity = cities.find((c) => c.code === selectedValue);
    setCityCode(selectedValue);
    setBarangayCode(""); setBarangays([]);
    onFieldChange("city", selectedCity?.name || selectedValue);
    onFieldChange("barangay", "");
  }

  function handleBarangayChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const selectedBarangay = barangays.find((b) => b.code === selectedValue);
    setBarangayCode(selectedValue);
    onFieldChange("barangay", selectedBarangay?.name || selectedValue);
  }

  const selectedRegion = regions.find((r) => r.code === regionCode);
  const provinceFieldDisabled = disabled || !regions.length || addressMode === "region";
  const cityFieldDisabled = disabled || (addressMode === "province" ? !provinceCode : !regionCode);
  const highlightClasses = "border-amber-400 ring-2 ring-amber-400/20";

  return (
    <div className="space-y-4 rounded-[1.35rem] border border-border-main bg-surface-secondary p-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-300">
          Street / Subdivision / Compound
        </label>
        <input
          type="text"
          value={value.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          className={`${fieldClass} ${highlightedField === "address" ? highlightClasses : ""}`}
          placeholder="Street or house number"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-300">Region</label>
          <select value={regionCode} onChange={handleRegionChange} disabled={disabled} className={`${fieldClass} ${highlightedField === "region" ? highlightClasses : ""}`}>
            <option value="">Select region</option>
            {regions.map((r) => <option key={r.code} value={r.code}>{toOption(r)}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-300">Province / District</label>
          <select value={provinceCode} onChange={handleProvinceChange} disabled={provinceFieldDisabled} className={`${fieldClass} ${highlightedField === "address" ? highlightClasses : highlightedField === "region" ? highlightClasses : ""}`}>
            <option value="">{addressMode === "region" ? "No province for this region" : "Select province"}</option>
            {provinces.map((p) => <option key={p.code} value={p.code}>{toOption(p)}</option>)}
          </select>
          {addressMode === "region" && selectedRegion && (
            <p className="text-[11px] font-medium leading-5 text-text-secondary">
              {selectedRegion.name} uses cities and municipalities directly, so province is not applicable.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-300">City / Municipality</label>
          <select value={cityCode} onChange={handleCityChange} disabled={cityFieldDisabled} className={`${fieldClass} ${highlightedField === "city" ? highlightClasses : ""}`}>
            <option value="">Select city / municipality</option>
            {value.city && !cities.some((c) => c.name === value.city) && (
              <option value={value.city}>{value.city}</option>
            )}
            {cities.map((c) => <option key={c.code} value={c.code}>{toOption(c)}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-300">Barangay</label>
          <select value={barangayCode} onChange={handleBarangayChange} disabled={disabled || !cityCode} className={`${fieldClass} ${highlightedField === "barangay" ? highlightClasses : ""}`}>
            <option value="">Select barangay</option>
            {value.barangay && !barangays.some((b) => b.name === value.barangay) && (
              <option value={value.barangay}>{value.barangay}</option>
            )}
            {barangays.map((b) => <option key={b.code} value={b.code}>{toOption(b)}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{error}</p>}
    </div>
  );
}
