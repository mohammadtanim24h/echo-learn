import CompanionCard from "@/components/CompanionCard";
import CompanionList from "@/components/CompanionList";
import CTA from "@/components/CTA";
import {
    getCompanionsCached,
    getRecentSessionsCached,
} from "@/lib/supabase/queries";
import { getSubjectColor } from "@/lib/utils";

const Page = async () => {
    // Use parallel queries to eliminate waterfall
    const [companions, recentSessions] = await Promise.all([
        getCompanionsCached({ limit: 3, page: 1 }),
        getRecentSessionsCached(10),
    ]);

    return (
        <main>
            <h1>Popular Companions</h1>
            <section className="companions-grid">
                {companions.map((companion) => (
                    <CompanionCard
                        key={companion.id}
                        {...companion}
                        color={getSubjectColor(companion.subject)}
                    />
                ))}
            </section>
            <section className="home-section mb-6">
                <CompanionList
                    title="Lessons others are taking"
                    companions={recentSessions}
                    classNames="w-2/3 max-lg:w-full"
                />
                <CTA />
            </section>
        </main>
    );
};

export default Page;
