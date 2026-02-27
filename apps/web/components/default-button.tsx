import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;

}

export function DefaultButton({ children, className, ...props }: ButtonProps) {
    return (
        <Button
            className={cn("w-full hover:cursor-pointer mt-4", className)}
            {...props}
        >
            {children}
        </Button>
    )
}