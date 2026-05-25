"use client";

import { ChevronDown } from "lucide-react";
import { useRef } from "react";

type StoreOption = { storeId: string; name: string };

type Props = {
  stores: StoreOption[];
  activeStoreId: string;
  switchAction: (formData: FormData) => Promise<void>;
};

export function StoreSwitcher({ stores, activeStoreId, switchAction }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchAction} className="mt-2">
      <label className="block text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
        Local activo
      </label>
      <div className="relative">
        <select
          name="storeId"
          defaultValue={activeStoreId}
          onChange={() => formRef.current?.requestSubmit()}
          className="w-full appearance-none bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-body-sm font-medium px-3 py-1.5 pr-7 rounded-md border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer truncate"
        >
          {stores.map((s) => (
            <option key={s.storeId} value={s.storeId}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
      </div>
    </form>
  );
}
