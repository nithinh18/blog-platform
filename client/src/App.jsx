import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import KeyboardShortcuts from './components/KeyboardShortcuts.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Onboarding from './pages/Onboarding.jsx';
import CreatePost from './pages/CreatePost.jsx';
import EditPost from './pages/EditPost.jsx';
import SinglePost from './pages/SinglePost.jsx';
import Profile from './pages/Profile.jsx';
import AuthorProfile from './pages/AuthorProfile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import { AllTags, TagPosts } from './pages/TagBrowse.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <KeyboardShortcuts />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/posts/:id"
            element={
              <PrivateRoute>
                <SinglePost />
              </PrivateRoute>
            }
          />
          <Route
            path="/authors/:id"
            element={
              <PrivateRoute>
                <AuthorProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/tags"
            element={
              <PrivateRoute>
                <AllTags />
              </PrivateRoute>
            }
          />
          <Route
            path="/tags/:tag"
            element={
              <PrivateRoute>
                <TagPosts />
              </PrivateRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <PrivateRoute>
                <Leaderboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-post"
            element={
              <PrivateRoute>
                <CreatePost />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-post/:id"
            element={
              <PrivateRoute>
                <EditPost />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <PrivateRoute>
                <Bookmarks />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}

export default App;
