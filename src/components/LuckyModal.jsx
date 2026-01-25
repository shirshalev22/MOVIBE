import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import confetti from 'canvas-confetti';

const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

export default function LuckyModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false); // האם כרגע יש "סיבוב" של הרולטה
  const [luckyMovie, setLuckyMovie] = useState(null); // הסרט שנבחר בסוף
  const [rollingPoster, setRollingPoster] = useState(""); // הפוסטרים שמתחלפים בזמן ההגרלה

  // הפונקציה שמבצעת את ההגרלה
  const handleSurpriseMe = async () => {
    setIsSpinning(true);
    setLuckyMovie({ Title: "Choosing..." });
    
    try {
      // 1. ניגשים ל-Firebase ומביאים את רשימת כל ה-IDs של הסרטים שיש לנו
      const querySnapshot = await getDocs(collection(db, "movies"));
      const allIds = querySnapshot.docs.map(d => d.id);
      if (allIds.length === 0) return;

      // 2. לוגיקת הרולטה: החלפת פוסטרים מהירה למשך כמה שניות
      let count = 0;
      const interval = setInterval(() => {
        const randomTempId = allIds[Math.floor(Math.random() * allIds.length)];
        setRollingPoster(`https://img.omdbapi.com/?i=${randomTempId}&apikey=${API_KEY}`);
        count++;
        if (count >= 5) clearInterval(interval); // מפסיק אחרי 5 החלפות
      }, 100);

      // 3. בחירת ה-ID הסופי ופנייה ל-API
      const finalId = allIds[Math.floor(Math.random() * allIds.length)];
      const res = await fetch(`https://www.omdbapi.com/?i=${finalId}&apikey=${API_KEY}`);
      const data = await res.json();

      // 4. השהיה קלה לסיום האנימציה והצגת התוצאה
      setTimeout(() => {
        setLuckyMovie(data);
        setRollingPoster(data.Poster);
        setIsSpinning(false);
        triggerConfetti(); // הפעלת חגיגת הקונפטי
      }, 1800);
    } catch (e) {
      setIsSpinning(false);
      setLuckyMovie(null);
    }
  };

  // פונקציית הקונפטי - משתמשת ב-requestAnimationFrame כדי ליצור אנימציה חלקה
  const triggerConfetti = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      // ירי קונפטי מזוויות שונות
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, zIndex: 3000, colors: ['#e50914', '#ffffff'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, zIndex: 3000, colors: ['#e50914', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  // הפעלה אוטומטית של ההגרלה ברגע שהמודאל נפתח
  useEffect(() => {
    if (isOpen) handleSurpriseMe();
  }, [isOpen]);

  if (!isOpen || !luckyMovie) return null;

  return (
    <div className="modal show d-block lucky-modal-overlay">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-white p-4 text-center lucky-modal-content">
          
          <button onClick={onClose} className="lucky-close-btn">&times;</button>
          
          <h2 className="mb-4 lucky-title">
            {isSpinning ? "🎰 SHUFFLING..." : "Pick of the Night! 🎉"}
          </h2>
          
          <div className="d-flex flex-column align-items-center mb-4">
            <img 
              src={rollingPoster && rollingPoster !== "N/A" ? rollingPoster : "https://via.placeholder.com/300x450?text=Picking..."} 
              alt="Poster" 
              // האנימציה 'spinning' מוגדרת ב-CSS וגורמת לפוסטר לרעוד או להסתובב
              className={`lucky-poster ${isSpinning ? 'spinning' : 'finished'}`}
            />
            {!isSpinning && <h3 className="mt-3 lucky-movie-name">{luckyMovie.Title}</h3>}
          </div>

          {!isSpinning && (
            <div className="d-flex justify-content-center gap-2 mt-2">
              <button className="btn-lucky-secondary" onClick={handleSurpriseMe}>
                Not my vibe 👎
              </button>
              <button className="btn-lucky-main" onClick={() => { onClose(); navigate(`/info/${luckyMovie.imdbID}`); }}>
                Yasss! Show me the details 🔥
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}