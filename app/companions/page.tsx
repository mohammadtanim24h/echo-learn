import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { getCompanionsCached } from "@/lib/supabase/queries";
import { getSubjectColor } from "@/lib/utils";
import { SearchParams } from "@/types";

export default async function CompanionsLibrary({
    searchParams,
}: SearchParams) {
    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : "";
    const topic = filters.topic ? filters.topic : "";

    const companions = await getCompanionsCached({
        subject,
        topic,
        page: 1,
        limit: 50, // Adjust based on needs
    });

    return (
        <main>
            <section className="flex justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
                <div className="flex gap-4">
                    <SearchInput />
                    <SubjectFilter />
                </div>
            </section>
            <section className="companions-grid">
                {companions.map((companion) => (
                    <CompanionCard
                        key={companion.id}
                        {...companion}
                        color={getSubjectColor(companion.subject)}
                    />
                ))}
            </section>
        </main>
    );
}
