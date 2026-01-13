import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Info from "./pages/Info";
import Header from "./components/Header";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Favorites from "./pages/Favorites";
import Map from "./pages/Map";
import AdminPage from "./pages/AdminPage";
import useFavorites from "./hooks/useFavorites";

/**
 * מנהלת את מערכת הניתוב (Routing) ואת המבנה הכללי של דפי האתר.
 */
function App() {
  // שליפת המשתמש המחובר (כולל ה-role שלו) כדי לנהל הרשאות גישה
  const { user } = useFavorites();

  return (
    <div className="app-shell">
      {/* ה-Header מופיע בכל הדפים */}
      <Header />
      
      <div className="container py-4">
        <Routes>
          {/* דף הבית - תצוגת הסרטים המרכזית */}
          <Route path="/" element={<Home />} />
          
          {/* דף מידע מורחב - משתמש ב-ID כפרמטר דינמי */}
          <Route path="/info/:id" element={<Info />} />
          
          {/* מערכת ניהול חשבון */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* דפים אישיים וכלים */}
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/map" element={<Map />} />

          
          {/* דף מנהל מערכת - מקבל את אובייקט המשתמש לבדיקת הרשאות Admin */}
          <Route path="/admin" element={<AdminPage user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;