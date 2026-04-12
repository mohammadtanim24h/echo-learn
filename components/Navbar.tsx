import Link from "next/link";
import Image from "next/image";
import Navitems from "./Navitems";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link href={"/"}>
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <Image
                        src="/images/logo.svg"
                        alt="logo"
                        width={46}
                        height={44}
                    ></Image>
                </div>
            </Link>
            <ul className="flex items-center gap-8">
                <Navitems />
                {/* <li>
                    <Link href="/sign-in">Sign In</Link>
                </li> */}
                <Show when="signed-out">
                    <SignInButton>
                        <button className="btn-signin">Sign In</button>
                    </SignInButton>
                </Show>
                <Show when="signed-in">
                    <UserButton />
                </Show>
            </ul>
        </nav>
    );
}
