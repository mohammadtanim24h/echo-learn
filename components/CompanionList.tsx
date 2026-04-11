import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, getSubjectColor } from "@/lib/utils";
import { Companion } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface CompanionListProps {
    title: string;
    companions?: Companion[];
    classNames?: string;
}

export default function CompanionList({
    title,
    companions,
    classNames,
}: CompanionListProps) {
    return (
        <article className={cn("companion-list", classNames)}>
            <h2 className="font-bold text-3xl">{title}</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/3 text-lg">Lessons</TableHead>
                        <TableHead className="text-lg">Subject</TableHead>
                        <TableHead className="text-lg text-right">
                            Duration
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companions?.map(
                        ({ id, subject, name, topic, duration }) => (
                            <TableRow key={id}>
                                <TableCell>
                                    <Link href={`/companions/${id}`}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="size-18 flex justify-center items-center rounded-lg max-md:hidden"
                                                style={{
                                                    backgroundColor:
                                                        getSubjectColor(
                                                            subject,
                                                        ),
                                                }}
                                            >
                                                <Image
                                                    src={`/icons/${subject}.svg`}
                                                    alt={subject}
                                                    width={35}
                                                    height={35}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="font-bold text-2xl">
                                                    {name}
                                                </p>
                                                <p className="text-lg">
                                                    {topic}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="subject-badge w-fit max-md:hidden">
                                        {subject}
                                    </div>
                                    <div
                                        className="flex justify-center items-center rounded-lg w-fit p-2 md:hidden"
                                        style={{
                                            backgroundColor:
                                                getSubjectColor(subject),
                                        }}
                                    >
                                        <Image
                                            src={`/icons/${subject}.svg`}
                                            alt={subject}
                                            width={18}
                                            height={18}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end items-center gap-2 w-full">
                                        <p className="text-lg">
                                            {duration}{" "}
                                            <span className="max-md:hidden">
                                                minutes
                                            </span>
                                        </p>
                                        <Image
                                            src="/icons/clock.svg"
                                            alt="minutes"
                                            width={14}
                                            height={14}
                                            className="md:hidden"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ),
                    )}
                </TableBody>
            </Table>
        </article>
    );
}
