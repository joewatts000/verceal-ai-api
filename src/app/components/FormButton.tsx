import { ReactNode, ButtonHTMLAttributes } from "react";

type FormButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function FormButton({ children, ...props }: FormButtonProps) {
  return (
    <button
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}
