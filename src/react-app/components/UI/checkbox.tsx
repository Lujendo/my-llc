import * as React from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
	disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onCheckedChange?.(e.target.checked);
		};

		return (
			<input
				type="checkbox"
				checked={checked}
				onChange={handleChange}
				disabled={disabled}
				className={cn(
					"h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all duration-200 hover:scale-110",
					disabled && "opacity-50 cursor-not-allowed",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
