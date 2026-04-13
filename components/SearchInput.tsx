"use client";

import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("topic") || "";
    const searchParamsString = searchParams.toString();

    const [searchQuery, setSearchQuery] = useState(query);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            const currentUrl = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`;

            if (searchQuery) {
                const newUrl = formUrlQuery({
                    params: searchParamsString,
                    key: "topic",
                    value: searchQuery,
                });

                if (newUrl !== currentUrl) {
                    router.push(newUrl, { scroll: false });
                }
            } else if (pathname === "/companions" && query) {
                const newUrl = removeKeysFromUrlQuery({
                    params: searchParamsString,
                    keysToRemove: ["topic"],
                });

                if (newUrl !== currentUrl) {
                    router.push(newUrl, { scroll: false });
                }
            }
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [searchQuery, router, pathname, query, searchParamsString]);

    return (
        <div className="relation border border-black rounded-lg flex items-center gap-2 px-2 py-1 h-fit">
            <Image
                src="/icons/search.svg"
                alt="Search"
                width={15}
                height={15}
            />
            <input
                type="text"
                placeholder="Search companions..."
                className="outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
}
