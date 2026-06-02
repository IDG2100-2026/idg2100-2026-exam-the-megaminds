import { connectDB, disconnectDB } from "../configs/db.js";
import { User } from "../models/users.js";
import { Game } from "../models/games.js";
import { Tournament } from "../models/tournaments.js";
import { Comment } from "../models/comments.js";

async function seed() {
    await connectDB();

    await Promise.all([
        User.deleteMany({}),
        Game.deleteMany({}),
        Tournament.deleteMany({}),
        Comment.deleteMany({})
    ]);
    console.log("Cleared existing data.");

    const users = await User.create([
        { username: "PokerKing88",    email: "pokerking@mail.no",      pwd: "Dice1234", age: 28, isAdmin: true, emailVerified: true },
        { username: "RobinHeimdal",   email: "Robin@gmail.no",         pwd: "Heimdalingen123", age: 22, isAdmin: true, emailVerified: true},
        { username: "LuckyRoller",    email: "luckyroller@mail.no",    pwd: "Dice1234", age: 24, emailVerified: true },
        { username: "DiceWitch99",    email: "dicewitch@mail.no",      pwd: "Dice1234", age: 31, emailVerified: true },
        { username: "NordicAce42",    email: "nordicace@mail.no",      pwd: "Dice1234", age: 42, emailVerified: true },
        { username: "BluffMaster7",   email: "bluffmaster@mail.no",    pwd: "Dice1234", age: 19, emailVerified: true },
        { username: "CasinoQueen1",   email: "casinoqueen@mail.no",    pwd: "Dice1234", age: 35, emailVerified: true },
        { username: "RollOrNot99",    email: "rollornot@mail.no",      pwd: "Dice1234", age: 27, emailVerified: true },
        { username: "StraightShot",   email: "straightshot@mail.no",   pwd: "Dice1234", age: 22, emailVerified: true },
        { username: "HighRoller5",    email: "highroller@mail.no",     pwd: "Dice1234", age: 30, emailVerified: true },
        { username: "DiceDevil666",   email: "dicedevil@mail.no",      pwd: "Dice1234", age: 25, emailVerified: true },
        { username: "AceOfDiceGame",  email: "aceofdice@mail.no",      pwd: "Dice1234", age: 33, emailVerified: true },
        { username: "PokerFace99",    email: "pokerface@mail.no",      pwd: "Dice1234", age: 21, emailVerified: true }
    ]);

    console.log("Created users:", users.map(u => `${u.username} (userId: ${u.userId})`).join(", "));

    const [u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11, u12] = users;

    const games = await Game.create([

        {
            gameId: "game-001",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u1.userId, score: 2 }, { userId: u2.userId, score: 1 }],
            winnerId: u1.userId, status: "finished"
        },
        {
            gameId: "game-002",
            rules: { bestof: 5, straightallowed: false, roundTime: 30, numPlayers: 2, buyIn: 10 },
            players: [{ userId: u3.userId, score: 3 }, { userId: u4.userId, score: 2 }],
            winnerId: u3.userId, status: "finished"
        },
        {
            gameId: "game-003",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u2.userId, score: 2 }, { userId: u5.userId, score: 0 }],
            winnerId: u2.userId, status: "finished"
        },
        {
            gameId: "game-004",
            rules: { bestof: 7, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 50 },
            players: [{ userId: u6.userId, score: 4 }, { userId: u1.userId, score: 0 }],
            winnerId: u6.userId, status: "finished"
        },
        {
            gameId: "game-005",
            rules: { bestof: 3, straightallowed: false, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u7.userId, score: 2 }, { userId: u8.userId, score: 1 }],
            winnerId: u7.userId, status: "finished"
        },
        {
            gameId: "game-006",
            rules: { bestof: 5, straightallowed: true, roundTime: 30, numPlayers: 2, buyIn: 10 },
            players: [{ userId: u3.userId, score: 3 }, { userId: u6.userId, score: 1 }],
            winnerId: u3.userId, status: "finished"
        },
        {
            gameId: "game-007",
            rules: { bestof: 7, straightallowed: false, roundTime: 10, numPlayers: 2, buyIn: 50 },
            players: [{ userId: u9.userId, score: 4 }, { userId: u10.userId, score: 1 }],
            winnerId: u9.userId, status: "finished"
        },
        {
            gameId: "game-008",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u7.userId, score: 2 }, { userId: u10.userId, score: 0 }],
            winnerId: u7.userId, status: "finished"
        },
        {
            gameId: "game-009",
            rules: { bestof: 5, straightallowed: false, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u1.userId, score: 3 }, { userId: u8.userId, score: 2 }],
            winnerId: u1.userId, status: "finished"
        },
        {
            gameId: "game-010",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u12.userId, score: 2 }, { userId: u4.userId, score: 0 }],
            winnerId: u12.userId, status: "finished"
        },

        {
            gameId: "game-011",
            rules: { bestof: 5, straightallowed: false, roundTime: 30, numPlayers: 2, buyIn: 10 },
            players: [{ userId: u4.userId }, { userId: u6.userId }],
            status: "in-progress"
        },
        {
            gameId: "game-012",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u11.userId }, { userId: u9.userId }],
            status: "in-progress"
        },

        {
            gameId: "game-013",
            rules: { bestof: 3, straightallowed: false, roundTime: 10, numPlayers: 2, buyIn: 1 },
            players: [{ userId: u3.userId }],
            status: "pending"
        },
        {
            gameId: "game-014",
            rules: { bestof: 5, straightallowed: true, roundTime: 30, numPlayers: 2, buyIn: 10 },
            players: [{ userId: u5.userId }],
            status: "pending"
        },
        {
            gameId: "game-015",
            rules: { bestof: 7, straightallowed: false, roundTime: 90, numPlayers: 2, buyIn: 50 },
            players: [{ userId: u7.userId }],
            status: "pending"
        },
        {
            gameId: "game-016",
            rules: { bestof: 3, straightallowed: true, roundTime: 10, numPlayers: 3, buyIn: 1 },
            players: [{ userId: u2.userId }, { userId: u4.userId }],
            status: "pending"
        },
        {
            gameId: "game-017",
            rules: { bestof: 5, straightallowed: false, roundTime: 30, numPlayers: 3, buyIn: 10 },
            players: [{ userId: u6.userId }, { userId: u8.userId }],
            status: "pending"
        },

        {
            gameId: "t-tournament-002-r1-0",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u1.userId, score: 2 }, { userId: u3.userId, score: 3 }],
            winnerId: u3.userId, status: "finished",
            tournamentId: "tournament-002"
        },
        {
            gameId: "t-tournament-002-r1-1",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u4.userId, score: 1 }, { userId: u6.userId, score: 2 }],
            status: "in-progress",
            tournamentId: "tournament-002"
        },

        {
            gameId: "t-tournament-003-r1-0",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u1.userId, score: 4 }, { userId: u2.userId, score: 1 }],
            winnerId: u1.userId, status: "finished", tournamentId: "tournament-003"
        },
        {
            gameId: "t-tournament-003-r1-1",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u3.userId, score: 4 }, { userId: u4.userId, score: 2 }],
            winnerId: u3.userId, status: "finished", tournamentId: "tournament-003"
        },
        {
            gameId: "t-tournament-003-r1-2",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u5.userId, score: 0 }, { userId: u6.userId, score: 4 }],
            winnerId: u6.userId, status: "finished", tournamentId: "tournament-003"
        },
        {
            gameId: "t-tournament-003-r1-3",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u7.userId, score: 4 }, { userId: u8.userId, score: 2 }],
            winnerId: u7.userId, status: "finished", tournamentId: "tournament-003"
        },

        {
            gameId: "t-tournament-003-r2-0",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u1.userId, score: 4 }, { userId: u3.userId, score: 2 }],
            winnerId: u1.userId, status: "finished", tournamentId: "tournament-003"
        },
        {
            gameId: "t-tournament-003-r2-1",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u6.userId, score: 3 }, { userId: u7.userId, score: 4 }],
            winnerId: u7.userId, status: "finished", tournamentId: "tournament-003"
        },

        {
            gameId: "t-tournament-003-r3-0",
            rules: { bestof: 7, straightallowed: true, roundTime: 90 },
            players: [{ userId: u1.userId, score: 4 }, { userId: u7.userId, score: 1 }],
            winnerId: u1.userId, status: "finished", tournamentId: "tournament-003"
        }
    ]);
    console.log("Created games.");

    await Promise.all([
        User.findOneAndUpdate({ userId: u1.userId  }, { elo: 1048, wins: 2, losses: 1, totalGames: 3, winPercentage: 2/3, eloChangeLastWeek: 32 }),
        User.findOneAndUpdate({ userId: u2.userId  }, { elo: 1000, wins: 1, losses: 1, totalGames: 2, winPercentage: 0.5, eloChangeLastWeek: 0  }),
        User.findOneAndUpdate({ userId: u3.userId  }, { elo: 1064, wins: 3, losses: 0, totalGames: 3, winPercentage: 1,   eloChangeLastWeek: 64 }),
        User.findOneAndUpdate({ userId: u4.userId  }, { elo: 952,  wins: 0, losses: 2, totalGames: 2, winPercentage: 0,   eloChangeLastWeek: -48 }),
        User.findOneAndUpdate({ userId: u5.userId  }, { elo: 984,  wins: 0, losses: 1, totalGames: 1, winPercentage: 0,   eloChangeLastWeek: -16 }),
        User.findOneAndUpdate({ userId: u6.userId  }, { elo: 1000, wins: 1, losses: 1, totalGames: 2, winPercentage: 0.5, eloChangeLastWeek: 0  }),
        User.findOneAndUpdate({ userId: u7.userId  }, { elo: 1048, wins: 2, losses: 0, totalGames: 2, winPercentage: 1,   eloChangeLastWeek: 48 }),
        User.findOneAndUpdate({ userId: u8.userId  }, { elo: 952,  wins: 0, losses: 2, totalGames: 2, winPercentage: 0,   eloChangeLastWeek: -48 }),
        User.findOneAndUpdate({ userId: u9.userId  }, { elo: 1032, wins: 1, losses: 0, totalGames: 1, winPercentage: 1,   eloChangeLastWeek: 32 }),
        User.findOneAndUpdate({ userId: u10.userId }, { elo: 936,  wins: 0, losses: 2, totalGames: 2, winPercentage: 0,   eloChangeLastWeek: -64 }),
        User.findOneAndUpdate({ userId: u11.userId }, { elo: 1000, wins: 0, losses: 0, totalGames: 0, winPercentage: 0,   eloChangeLastWeek: 0  }),
        User.findOneAndUpdate({ userId: u12.userId }, { elo: 1016, wins: 1, losses: 0, totalGames: 1, winPercentage: 1,   eloChangeLastWeek: 16 })
    ]);
    console.log("Updated user ELO and stats.");

    const tournaments = await Tournament.create([
        {
            tournamentId: "tournament-001",
            title: "Spring Dice Open",
            description: "The premier Spanish Poker Dice tournament of the spring season. Open to all skill levels.",
            format: { bestof: 5, straightallowed: true, roundTime: 10 },
            minPlayers: 4,
            maxPlayers: 16,
            startDate: new Date("2026-04-15"),
            status: "pending",
            participants: [u1.userId, u2.userId, u3.userId, u7.userId, u9.userId, u12.userId],
            trophy: { title: "Spring Champion Trophy" },
            createdBy: u1.userId
        },
        {
            tournamentId: "tournament-002",
            title: "Nordic Masters Cup",
            description: "An elite invitational tournament for top-ranked players in the Nordic region. Straight hands are allowed.",
            format: { bestof: 7, straightallowed: true, roundTime: 30 },
            minPlayers: 2,
            maxPlayers: 8,
            startDate: new Date("2026-04-02"),
            status: "in-progress",
            participants: [u1.userId, u3.userId, u4.userId, u6.userId],
            buyIn: 50,
            eloRange: { min: 1500, max: null },
            games: ["t-tournament-002-r1-0", "t-tournament-002-r1-1"],
            currentRound: 1,
            rounds: [
                { roundNumber: 1, games: ["t-tournament-002-r1-0", "t-tournament-002-r1-1"], byeUserId: null }
            ],
            trophy: { title: "Nordic Masters Trophy" },
            createdBy: u1.userId
        },
        {
            tournamentId: "tournament-003",
            title: "Winter Dice Championship",
            description: "A completed 8-player single-elimination championship — every round played out to a champion.",
            format: { bestof: 7, straightallowed: true, roundTime: 90 },
            minPlayers: 8,
            maxPlayers: 8,
            startDate: new Date("2026-05-20"),
            status: "finished",
            participants: [u1.userId, u2.userId, u3.userId, u4.userId, u5.userId, u6.userId, u7.userId, u8.userId],
            buyIn: 0,
            eloRange: { min: null, max: null },
            games: [
                "t-tournament-003-r1-0", "t-tournament-003-r1-1", "t-tournament-003-r1-2", "t-tournament-003-r1-3",
                "t-tournament-003-r2-0", "t-tournament-003-r2-1",
                "t-tournament-003-r3-0"
            ],
            currentRound: 3,
            rounds: [
                { roundNumber: 1, games: ["t-tournament-003-r1-0", "t-tournament-003-r1-1", "t-tournament-003-r1-2", "t-tournament-003-r1-3"], byeUserId: null },
                { roundNumber: 2, games: ["t-tournament-003-r2-0", "t-tournament-003-r2-1"], byeUserId: null },
                { roundNumber: 3, games: ["t-tournament-003-r3-0"], byeUserId: null }
            ],
            trophy: { title: "Winter Championship Cup" },
            winnerId: u1.userId,
            createdBy: u1.userId
        }
    ]);
    console.log("Created tournaments.");

    await Comment.create([
        { userId: u2.userId,  gameId: games[0].gameId,              text: "Great game! That last round was intense." },
        { userId: u3.userId,  gameId: games[0].gameId,              text: "PokerKing showing off again haha" },
        { userId: u1.userId,  gameId: games[1].gameId,              text: "DiceWitch is on fire this season!" },
        { userId: u7.userId,  gameId: games[4].gameId,              text: "Clean sweep, felt good." },
        { userId: u6.userId,  gameId: games[5].gameId,              text: "Tough loss, rematch incoming." },
        { userId: u9.userId,  gameId: games[6].gameId,              text: "That best of 7 really tests your patience." },
        { userId: u5.userId,  tournamentId: tournaments[0].tournamentId, text: "Can't wait for this tournament to start!" },
        { userId: u4.userId,  tournamentId: tournaments[1].tournamentId, text: "Nordic Masters is always the best event of the year." },
        { userId: u12.userId, tournamentId: tournaments[0].tournamentId, text: "First tournament for me, excited!" }
    ]);
    console.log("Created comments.");

    console.log("\nSeed complete! Ready to test.");
    await disconnectDB();
}

seed().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
