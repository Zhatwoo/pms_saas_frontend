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
  province: string;
};

interface PhilippineAddressFieldsProps {
  value: AddressValue;
  disabled?: boolean;
  onFieldChange: (field: keyof AddressValue, value: string) => void;
}

const fieldClass =
  "h-11 w-full rounded-2xl border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-surface-secondary";

const baseUrl = "https://psgc.gitlab.io/api";

async function fetchOptions(path: string): Promise<AddressOption[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load address options from ${path}`);
  }

  return (await response.json()) as AddressOption[];
}

function toOption(option: AddressOption) {
  return option.name;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function PhilippineAddressFields({
  value,
  disabled = false,
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

  useEffect(() => {
    let isActive = true;

    async function loadRegions() {
      try {
        const nextRegions = await fetchOptions("/regions/");
        if (isActive) {
          setRegions(nextRegions);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      }
    }

    void loadRegions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (hasHydratedInitialAddress.current) {
      return;
    }

    const hasExistingAddress = Boolean(value.province || value.city || value.barangay || value.address);
    if (!hasExistingAddress) {
      hasHydratedInitialAddress.current = true;
      return;
    }

    let isActive = true;

    async function hydrateExistingAddress() {
      try {
        const allProvinces = await fetchOptions("/provinces/");
        const provinceName = normalizeText(value.province);
        const cityName = normalizeText(value.city);
        const barangayName = normalizeText(value.barangay);

        const matchingProvince = provinceName
          ? allProvinces.find((option) => normalizeText(option.name) === provinceName)
          : null;

        if (matchingProvince) {
          if (!isActive) return;

          setRegionCode(matchingProvince.regionCode);
          setProvinceCode(matchingProvince.code);
          setAddressMode("province");

          const provinceCities = await fetchOptions(`/provinces/${matchingProvince.code}/cities-municipalities/`);
          if (!isActive) return;

          setCities(provinceCities);

          const matchingCity = cityName
            ? provinceCities.find((option) => normalizeText(option.name) === cityName)
            : null;

          if (matchingCity) {
            if (!isActive) return;

            setCityCode(matchingCity.code);

            const nextBarangays = await fetchOptions(`/cities-municipalities/${matchingCity.code}/barangays/`);
            if (!isActive) return;

            setBarangays(nextBarangays);

            const matchingBarangay = barangayName
              ? nextBarangays.find((option) => normalizeText(option.name) === barangayName)
              : null;

            if (matchingBarangay) {
              setBarangayCode(matchingBarangay.code);
            }
          }
        } else if (cityName) {
          const allRegions = regions.length > 0 ? regions : await fetchOptions("/regions/");

          for (const region of allRegions) {
            const regionCities = await fetchOptions(`/regions/${region.code}/cities-municipalities/`);
            const matchingCity = regionCities.find((option) => normalizeText(option.name) === cityName);

            if (matchingCity) {
              if (!isActive) return;

              setRegionCode(region.code);
              setAddressMode("region");
              setCities(regionCities);
              setCityCode(matchingCity.code);

              const nextBarangays = await fetchOptions(`/cities-municipalities/${matchingCity.code}/barangays/`);
              if (!isActive) return;

              setBarangays(nextBarangays);

              const matchingBarangay = barangayName
                ? nextBarangays.find((option) => normalizeText(option.name) === barangayName)
                : null;

              if (matchingBarangay) {
                setBarangayCode(matchingBarangay.code);
              }

              break;
            }
          }
        }
      } catch {
        if (isActive) {
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      } finally {
        if (isActive) {
          hasHydratedInitialAddress.current = true;
        }
      }
    }

    void hydrateExistingAddress();

    return () => {
      isActive = false;
    };
  }, [regions, value.address, value.barangay, value.city, value.province]);

  useEffect(() => {
    let isActive = true;

    async function loadProvinces() {
      if (!regionCode) {
        setProvinces([]);
        setCities([]);
        setBarangays([]);
        setAddressMode("province");
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
            if (isActive) {
              setCities(nextCities);
              setBarangays([]);
            }
          } else {
            setCities([]);
            setBarangays([]);
          }
        }
      } catch {
        if (isActive) {
          setProvinces([]);
          setCities([]);
          setBarangays([]);
          setAddressMode("province");
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      }
    }

    void loadProvinces();

    return () => {
      isActive = false;
    };
  }, [regionCode]);

  useEffect(() => {
    let isActive = true;

    async function loadCities() {
      if (!provinceCode) {
        setCities([]);
        setBarangays([]);
        return;
      }

      try {
        const nextCities = await fetchOptions(`/provinces/${provinceCode}/cities-municipalities/`);
        if (isActive) {
          setCities(nextCities);
          setError(null);
        }
      } catch {
        if (isActive) {
          setCities([]);
          setBarangays([]);
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      }
    }

    void loadCities();

    return () => {
      isActive = false;
    };
  }, [provinceCode]);

  useEffect(() => {
    let isActive = true;

    async function loadBarangays() {
      if (!cityCode) {
        setBarangays([]);
        return;
      }

      try {
        const nextBarangays = await fetchOptions(`/cities-municipalities/${cityCode}/barangays/`);
        if (isActive) {
          setBarangays(nextBarangays);
          setError(null);
        }
      } catch {
        if (isActive) {
          setBarangays([]);
          setError("Philippines address dropdowns are temporarily unavailable.");
        }
      }
    }

    void loadBarangays();

    return () => {
      isActive = false;
    };
  }, [cityCode]);

  function handleRegionChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextRegionCode = event.target.value;
    setRegionCode(nextRegionCode);
    setAddressMode("province");
    setProvinceCode("");
    setCityCode("");
    setBarangayCode("");
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    onFieldChange("province", "");
    onFieldChange("city", "");
    onFieldChange("barangay", "");
  }

  function handleProvinceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const selectedProvince = provinces.find((option) => option.code === selectedValue);
    const nextProvince = selectedProvince?.name || selectedValue;

    setProvinceCode(selectedValue);
    setCityCode("");
    setBarangayCode("");
    setCities([]);
    setBarangays([]);
    onFieldChange("province", nextProvince);
    onFieldChange("city", "");
    onFieldChange("barangay", "");
  }

  function handleCityChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const selectedCity = cities.find((option) => option.code === selectedValue);
    const nextCity = selectedCity?.name || selectedValue;

    setCityCode(selectedValue);
    setBarangayCode("");
    setBarangays([]);
    onFieldChange("city", nextCity);
    onFieldChange("barangay", "");
  }

  function handleBarangayChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const selectedBarangay = barangays.find((option) => option.code === selectedValue);
    setBarangayCode(selectedValue);
    onFieldChange("barangay", selectedBarangay?.name || selectedValue);
  }

  const selectedRegion = regions.find((option) => option.code === regionCode);
  const provinceFieldDisabled = disabled || !regions.length || addressMode === "region";
  const cityFieldDisabled = disabled || (addressMode === "province" ? !provinceCode : !regionCode);

  return (
    <div className="space-y-4 rounded-[1.35rem] border border-border-main bg-surface-secondary p-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
          Street / Subdivision / Compound
        </label>
        <input
          type="text"
          value={value.address}
          onChange={(event) => onFieldChange("address", event.target.value)}
          className={fieldClass}
          placeholder="Street or house number"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
            Region
          </label>
          <select
            value={regionCode}
            onChange={handleRegionChange}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Select region</option>
            {regions.map((option) => (
              <option key={option.code} value={option.code}>
                {toOption(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
            Province / District
          </label>
          <select
            value={provinceCode}
            onChange={handleProvinceChange}
            disabled={provinceFieldDisabled}
            className={fieldClass}
          >
            <option value="">{addressMode === "region" ? "No province for this region" : "Select province"}</option>
            {value.province && !provinces.some((option) => option.name === value.province) && (
              <option value={value.province}>{value.province}</option>
            )}
            {provinces.map((option) => (
              <option key={option.code} value={option.code}>
                {toOption(option)}
              </option>
            ))}
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
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
            City / Municipality
          </label>
          <select
            value={cityCode}
            onChange={handleCityChange}
            disabled={cityFieldDisabled}
            className={fieldClass}
          >
            <option value="">Select city / municipality</option>
            {value.city && !cities.some((option) => option.name === value.city) && (
              <option value={value.city}>{value.city}</option>
            )}
            {cities.map((option) => (
              <option key={option.code} value={option.code}>
                {toOption(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
            Barangay
          </label>
          <select
            value={barangayCode}
            onChange={handleBarangayChange}
            disabled={disabled || !cityCode}
            className={fieldClass}
          >
            <option value="">Select barangay</option>
            {value.barangay && !barangays.some((option) => option.name === value.barangay) && (
              <option value={value.barangay}>{value.barangay}</option>
            )}
            {barangays.map((option) => (
              <option key={option.code} value={option.code}>
                {toOption(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-amber-700">{error}</p>}
    </div>
  );
}