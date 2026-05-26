import TournamentCard from "@/components/TournamentCard/TournamentCard";
import { useTournaments } from "@/hooks/useTournaments";
import { useDebounce } from "@/hooks/useDebounce";
import {useState, useEffect} from "react"
import styles from "./TournamentList.module.css";

export default function TournamentList() {
    const [sort, setSort] = useState("startDate")
    const [order, setOrder] = useState("asc");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const upcoming = useTournaments({status: "pending,in-progress" });
    const past = useTournaments({status: "finished,cancelled" });

    const { updateParams: updateUpcoming } = upcoming;
    const { updateParams: updatePast } = past;

    useEffect(()=>{
        updateUpcoming({ sort, sortOrder: order });
        updatePast({ sort, sortOrder: order });
    }, [sort, order, updateUpcoming, updatePast]);

    const filterByTitle = (list) =>
        debouncedSearch.length >= 3
            ? list.filter(t=> t.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
            : list;

    return (
        <main className={styles.list}>
            <h1 className={styles.list__title}>Tournament List</h1>

            <div className={styles.list__toolbar}>
                <label className={styles.list__field}>
                    <span>Sort by</span>
                    <select value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="startDate">Start Date</option>
                        <option value="title">Title</option>
                        <option value="playerCount">Players</option>
                    </select>
                </label>
                <label className={styles.list__field}>
                    <span>Order</span>
                    <select value={order} onChange={e => setOrder(e.target.value)}>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>
                <label className={`${styles.list__field} ${styles.list__search}`}>
                    <span>Search</span>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by title.."
                    />
                </label>
            </div>

            <Section title="Upcoming & live" state={upcoming} filter={filterByTitle}/>
            <Section title="Past tournaments" state={past} filter={filterByTitle} />
        </main>
    );
}

function Section({title, state, filter}){
    const {tournaments, loading, error, hasMore, loadMore } = state;
    const visible = filter(tournaments);
    return (
        <section className={styles.section}>
            <h2 className={styles.section__title}>{title}</h2>
            {error && <p className={styles.section__error}>Error: {error}</p>}
            {loading && tournaments.length === 0 && <p className={styles.section__status}>loading...</p>}
            {!loading && visible.length === 0 && <p className={styles.section__status}>no tournaments to show</p>}

            <div className={styles.section__grid}>
                {visible.map(t => (
                    <TournamentCard key={t.tournamentId} tournament={t} variant="list" />
                ))}
            </div>

            {hasMore && (
                <button className={styles.section__loadmore} onClick={loadMore} disabled={loading}>
                    {loading ? "Loading..." : "Load more"}
                </button>
            )}
        </section>
    );
}
