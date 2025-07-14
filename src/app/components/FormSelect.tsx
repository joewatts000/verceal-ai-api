import React from 'react';

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

export function FormSelect({ children, ...props }: FormSelectProps) {
  return (
    <select
      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
      {...props}
    >
      {children}
    </select>
  );
}
