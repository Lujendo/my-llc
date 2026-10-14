import * as React from "react";
import { cn } from "../../lib/utils";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
	value: string;
	onValueChange: (value: string) => void;
}

interface TabsContextValue {
	value: string;
	onValueChange: (value: string) => void;
	baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabs = () => {
	const context = React.useContext(TabsContext);
	if (!context) throw new Error("Tabs components must be used within Tabs");
	return context;
};

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
	({ className, value, onValueChange, children, ...props }, ref) => {
		const baseId = React.useId();
		const contextValue = React.useMemo(
			() => ({ value, onValueChange, baseId }),
			[value, onValueChange, baseId]
		);

		return (
			<div ref={ref} className={cn("w-full", className)} {...props}>
				<TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
			</div>
		);
	}
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, onKeyDown, ...props }, ref) => {
		const { onValueChange } = useTabs();

		// Automatic activation: arrows move focus AND select (WAI-ARIA tabs pattern).
		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			onKeyDown?.(e);
			if (e.defaultPrevented) return;
			if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
			const tabs = Array.from(
				e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
			);
			if (!tabs.length) return;
			const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
			let next = current;
			if (e.key === "ArrowLeft") next = current <= 0 ? tabs.length - 1 : current - 1;
			else if (e.key === "ArrowRight") next = current === tabs.length - 1 ? 0 : current + 1;
			else if (e.key === "Home") next = 0;
			else if (e.key === "End") next = tabs.length - 1;
			const target = tabs[next];
			if (!target) return;
			e.preventDefault();
			target.focus();
			const val = target.dataset.value;
			if (val != null) onValueChange(val);
		};

		return (
			<div
				ref={ref}
				role="tablist"
				onKeyDown={handleKeyDown}
				className={cn(
					"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
					className
				)}
				{...props}
			/>
		);
	}
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
	({ className, value, disabled, onClick, ...props }, ref) => {
		const { value: activeValue, onValueChange, baseId } = useTabs();
		const isActive = activeValue === value;

		return (
			<button
				ref={ref}
				type="button"
				role="tab"
				id={`${baseId}-tab-${value}`}
				aria-selected={isActive}
				aria-controls={`${baseId}-panel-${value}`}
				tabIndex={isActive ? 0 : -1}
				data-value={value}
				disabled={disabled}
				onClick={(e) => {
					onClick?.(e);
					if (!disabled) onValueChange(value);
				}}
				className={cn(
					"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
					disabled && "opacity-50 cursor-not-allowed",
					className
				)}
				{...props}
			/>
		);
	}
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
	value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
	({ className, value, ...props }, ref) => {
		const { value: activeValue, baseId } = useTabs();

		if (activeValue !== value) return null;

		return (
			<div
				ref={ref}
				role="tabpanel"
				id={`${baseId}-panel-${value}`}
				aria-labelledby={`${baseId}-tab-${value}`}
				tabIndex={0}
				className={cn(
					"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					className
				)}
				{...props}
			/>
		);
	}
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
