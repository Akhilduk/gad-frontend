'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  className = '',
  menuClassName = '',
  searchPlaceholder = 'Search...',
  getOptionLabel,
  getOptionValue,
  allowEmptyOption = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const resolveLabel = (option) => {
    if (typeof getOptionLabel === 'function') return String(getOptionLabel(option) ?? '');
    if (typeof option === 'string' || typeof option === 'number') return String(option);
    return String(option?.label ?? option?.name ?? option?.value ?? '');
  };

  const resolveValue = (option) => {
    if (typeof getOptionValue === 'function') return String(getOptionValue(option) ?? '');
    if (typeof option === 'string' || typeof option === 'number') return String(option);
    return String(option?.value ?? option?.id ?? '');
  };

  const normalizedValue = value === null || value === undefined ? '' : String(value);

  const selectedOption = useMemo(
    () => options.find((option) => resolveValue(option) === normalizedValue),
    [options, normalizedValue]
  );

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => resolveLabel(option).toLowerCase().includes(query));
  }, [options, searchTerm]);

  const emitChange = (nextValue) => {
    if (typeof onChange === 'function') {
      onChange({ target: { name, value: nextValue } });
    }
  };

  const handleSelect = (nextValue) => {
    emitChange(nextValue);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white dark:border-gray-300 ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {selectedOption ? resolveLabel(selectedOption) : placeholder}
        </span>
        <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700 ${menuClassName}`}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <ul className="max-h-56 overflow-auto py-1" role="listbox">
            {allowEmptyOption && (
              <li>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleSelect('')}
                >
                  {placeholder}
                </button>
              </li>
            )}
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
            )}
            {filteredOptions.map((option) => {
              const optionValue = resolveValue(option);
              const optionLabel = resolveLabel(option);
              return (
                <li key={optionValue}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      optionValue === normalizedValue ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                    onClick={() => handleSelect(optionValue)}
                  >
                    {optionLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
