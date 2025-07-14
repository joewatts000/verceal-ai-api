import React from 'react';

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FormTextarea(props: FormTextareaProps) {
  return (
    <textarea
      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
      {...props}
    />
  );
}
