import {Route, Routes} from "react-router";
import MainLayout from "@/Layout/MainLayout/MainLayout";
import AdminLayout from "@/Layout/AdminLayout/AdminLayout";
import NotFoundPage from "@/pages/Static/NotFoundPage/NotFoundPage";
import GamePage from "@/pages/Game/GamePage/GamePage";
import PrivacyPage from "@/pages/Static/PrivacyPage/PrivacyPage";
import HomePage from "@/pages/HomePage/HomePage";
import LobbyPage from "@/pages/LobbyPage/LobbyPage";
import TermsPage from "@/pages/Static/TermsPage/TermsPage";
import ProfilePage from "@/pages/ProfilePage/ProfilePage";
import CreateGamePage from "@/pages/Game/CreateGamePage/CreateGamePage";
import TournamentList from "@/pages/Tournament/TournamentList/TournamentList";
import CreateTournamentPage from "@/pages/Tournament/CreateTournament/CreateTournament";
import LeaderboardPage from "@/pages/LeaderboardPage/LeaderboardPage";
import AdminDashBoard from "@/pages/Admin/AdminDashboard/AdminDashBoard";
import AboutPage from "@/pages/Static/AboutPage/AboutPage";
import Login from "@/pages/Auth/Login/Login";
import Register from "@/pages/Auth/Register/Register";
import ForgotPwd from "@/pages/Auth/ForgotPwd/ForgotPwd";
import TournamentDetail from "@/pages/Tournament/TournamentDetail/TournamentDetail";
import VerifyUser from "@/pages/Auth/VerifyUser/VerifyUser";
export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout/>}>
                <Route path="/" element={<HomePage/>} />
                <Route path="/lobby" element={<LobbyPage/>} />
                <Route path="/about" element={<AboutPage/>} />
                <Route path="/create-game" element={<CreateGamePage/>} />
                <Route path="/game/:gameid" element={<GamePage/>} />
                <Route path="/tournament" element={<TournamentList/>} />
                <Route path="/tournament/:tournamentid" element={<TournamentDetail/>} />
                <Route path="/profile" element={<ProfilePage/>} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPwd />} />
                <Route path="/verify-email" element={<VerifyUser />} />
            </Route>
            <Route element={<AdminLayout/>}>
                <Route path="/admin" element={<AdminDashBoard/>} />
                <Route path="/admin/tournament/new" element={<CreateTournamentPage/>} />
                <Route path="/admin/tournament/:tournamentid/edit" element={<CreateTournamentPage/>} />
            </Route>
            {/* This should always be the last route */ } 
            <Route element={<MainLayout/>}>
                 <Route path="*" element={<NotFoundPage/>} />
            </Route>
        </Routes>
    );
}