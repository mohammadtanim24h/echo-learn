"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        label: "Home",
        href: "/",
    },
    {
        label: "Companions",
        href: "/companions",
    },
    {
        label: "My Journey",
        href: "/my-journey",
    },
];

interface NavitemsProps {
    setIsOpen?: (open: boolean) => void;
}

export default function Navitems({ setIsOpen }: NavitemsProps) {
    const pathname = usePathname();
    return (
        <>
            {navItems.map(({ href, label }) => (
                <li key={label}>
                    <Link
                        href={href}
                        onClick={() => setIsOpen?.(false)}
                        className={cn(
                            pathname === href && "text-primary font-semibold",
                        )}
                    >
                        {label}
                    </Link>
                </li>
            ))}
        </>
    );
}
