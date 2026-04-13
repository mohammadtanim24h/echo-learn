"use client";

import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { subjects } from "@/constants";

export default function SubjectFilter() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjectQuery = searchParams.get("subject") || "";
    const searchParamsString = searchParams.toString();
    const normalizedSubject = subjectQuery || "all";
    const [selectedSubject, setSelectedSubject] = useState(normalizedSubject);

    useEffect(() => {
        setSelectedSubject(normalizedSubject);
    }, [normalizedSubject]);

    useEffect(() => {
        if (selectedSubject === normalizedSubject) {
            return;
        }

        const currentUrl = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`;

        if (selectedSubject === "all") {
            if (subjectQuery) {
                const newUrl = removeKeysFromUrlQuery({
                    params: searchParamsString,
                    keysToRemove: ["subject"],
                });

                if (newUrl !== currentUrl) {
                    router.push(newUrl, { scroll: false });
                }
            }

            return;
        }

        const newUrl = formUrlQuery({
            params: searchParamsString,
            key: "subject",
            value: selectedSubject,
        });

        if (newUrl !== currentUrl) {
            router.push(newUrl, { scroll: false });
        }
    }, [
        selectedSubject,
        normalizedSubject,
        subjectQuery,
        router,
        pathname,
        searchParamsString,
    ]);

    return (
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="input">
                <SelectValue placeholder="Select the subject" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="all" className="capitalize">
                        All Subjects
                    </SelectItem>
                    {subjects.map((subject) => (
                        <SelectItem
                            value={subject}
                            key={subject}
                            className="capitalize"
                        >
                            {subject}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
