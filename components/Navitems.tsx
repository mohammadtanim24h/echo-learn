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

export default function Navitems() {
    const pathname = usePathname();
    return (
        <>
            {navItems.map(({ href, label }) => (
                <li key={label}>
                    <Link
                        href={href}
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
