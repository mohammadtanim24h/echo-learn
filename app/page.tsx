import CompanionCard from "@/components/CompanionCard";
import CompanionList from "@/components/CompanionList";
import CTA from "@/components/CTA";

const companions = [
    {
        id: "1",
        title: "Companion 1",
        topic: "Description for Companion 1",
        subject: "Science",
        duration: 45,
        color: "#fdf393",
    },
    {
        id: "2",
        title: "Companion 2",
        topic: "Description for Companion 2",
        subject: "Business",
        duration: 30,
        color: "#e2fdf3",
    },
    {
        id: "3",
        title: "Companion 3",
        topic: "Description for Companion 3",
        subject: "Mathematics",
        duration: 15,
        color: "#cdf1d3",
    },
];

const Page = () => {
    return (
        <main>
            <h1>Popular Companions</h1>
            <section className="home-section">
                {companions.map((companion) => (
                    <CompanionCard key={companion.id} {...companion} />
                ))}
            </section>
            <section className="home-section">
                <CompanionList />
                <CTA />
            </section>
        </main>
    );
};

export default Page;
