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
    // Only include non-empty filters to avoid creating unique cache entries
    const subject = filters.subject || undefined;
    const topic = filters.topic || undefined;

    const companions = await getCompanionsCached({
        subject,
        topic,
        page: 1,
        limit: 50,
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
            <section className="companions-grid mb-6">
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
