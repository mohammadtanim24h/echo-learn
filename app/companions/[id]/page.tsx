import { getCompanion } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

interface CompanionSessionPageProps {
    params: Promise<{ id: string }>;
}

export default async function CompanionSession({
    params,
}: CompanionSessionPageProps) {
    const { id } = await params;
    const companion = await getCompanion(id);
    const user = await currentUser();

    if (!user) redirect("/sign-in");

    if (!companion) redirect("/companions");

    const { name, subject, topic, duration } = companion;

    return (
        <main>
            <article className="flex rounded-border items-center justify-between p-6 max-md:flex-col">
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center justify-center size-18 rounded-lg max-md:hidden"
                        style={{
                            backgroundColor: getSubjectColor(subject),
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
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-2xl">{name}</p>
                            <div className="subject-badge max-sm:hidden">
                                {subject}
                            </div>
                        </div>
                        <p className="text-lg">{topic}</p>
                    </div>
                </div>
                <div className="text-xl max-md:hidden">
                    {duration} minutes
                </div>
            </article>
        </main>
    );
}
