"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navitems from "./Navitems";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="navbar">
            <Link href={"/"} onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="logo"
                        width={130}
                        height={44}
                    ></Image>
                </div>
            </Link>

            {/* Desktop Menu */}
            <ul className="hidden md:flex items-center gap-8">
                <Navitems />
                <Show when="signed-out">
                    <SignInButton>
                        <button className="btn-signin">Sign In</button>
                    </SignInButton>
                </Show>
                <Show when="signed-in">
                    <UserButton />
                </Show>
            </ul>

            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-2"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 md:hidden flex flex-col gap-4 p-4 shadow-lg">
                    <ul className="flex flex-col gap-4">
                        <Navitems setIsOpen={setIsOpen} />
                        <Show when="signed-out">
                            <SignInButton>
                                <button className="btn-signin w-full justify-center">
                                    Sign In
                                </button>
                            </SignInButton>
                        </Show>
                        <Show when="signed-in">
                            <div className="flex justify-center">
                                <UserButton />
                            </div>
                        </Show>
                    </ul>
                </div>
            )}
        </nav>
    );
}
