import * as React from "react";
import { cn } from "../../lib/utils";

// ponytail: hand-rolled modal a11y (Escape, focus trap, focus restore) — no Radix.
// Ceiling: single-level dialogs only; add a stack manager if nested dialogs appear.
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Called on Escape (and typically the overlay click). */
	onClose?: () => void;
}

// The title element's id is shared with DialogContent so `aria-labelledby`
// always points at a real node without the call site wiring it by hand.
const DialogTitleIdContext = React.createContext<string | undefined>(undefined);

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
	({ className, onClose, children, ...props }, ref) => {
		const titleId = React.useId();
		const nodeRef = React.useRef<HTMLDivElement | null>(null);
		// Captured during render — before React's autoFocus moves focus on commit.
		const previouslyFocused = React.useRef<HTMLElement | null>(
			typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
		);
		// Keep the latest onClose without re-subscribing (re-running the effect
		// would restore focus to the trigger while the dialog is still open).
		const onCloseRef = React.useRef(onClose);
		onCloseRef.current = onClose;

		const setRefs = React.useCallback(
			(node: HTMLDivElement | null) => {
				nodeRef.current = node;
				if (typeof ref === "function") ref(node);
				else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
			},
			[ref]
		);

		React.useEffect(() => {
			const node = nodeRef.current;
			const focusables = () =>
				node
					? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
							(el) => el.offsetParent !== null
						)
					: [];

			// If nothing inside is focused yet (no autoFocus), pull focus in.
			if (node && !node.contains(document.activeElement)) {
				(focusables()[0] ?? node).focus();
			}

			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onCloseRef.current?.();
					return;
				}
				if (e.key !== "Tab") return;
				const list = focusables();
				if (!list.length) {
					e.preventDefault();
					node?.focus();
					return;
				}
				const first = list[0];
				const last = list[list.length - 1];
				const active = document.activeElement;
				if (e.shiftKey && (active === first || !node?.contains(active))) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && active === last) {
					e.preventDefault();
					first.focus();
				}
			};

			document.addEventListener("keydown", onKeyDown, true);
			return () => {
				document.removeEventListener("keydown", onKeyDown, true);
				previouslyFocused.current?.focus?.();
			};
		}, []);

		return (
			<div
				ref={setRefs}
				tabIndex={-1}
				className={cn("fixed inset-0 z-50 flex items-center justify-center outline-none", className)}
				{...props}
			>
				<DialogTitleIdContext.Provider value={titleId}>{children}</DialogTitleIdContext.Provider>
			</div>
		);
	}
);
Dialog.displayName = "Dialog";

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm", className)}
			{...props}
		/>
	)
);
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, role, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
		const titleId = React.useContext(DialogTitleIdContext);
		return (
			<div
				ref={ref}
				role={role ?? "dialog"}
				aria-modal="true"
				aria-labelledby={ariaLabelledBy ?? titleId}
				className={cn(
					"relative w-full max-w-lg rounded-lg bg-background p-6 shadow-lg",
					className
				)}
				{...props}
			/>
		);
	}
);
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
	)
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, id, ...props }, ref) => {
		const titleId = React.useContext(DialogTitleIdContext);
		return (
			<h2
				ref={ref}
				id={id ?? titleId}
				className={cn("text-lg font-semibold leading-none tracking-tight", className)}
				{...props}
			/>
		);
	}
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
	)
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
			{...props}
		/>
	)
);
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
