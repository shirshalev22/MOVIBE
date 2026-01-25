import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import confetti from 'canvas-confetti'; // ספרייה חיצונית ליצירת אנימציית קונפטי

const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

export default function LuckyModal({ isOpen, onClose }) {
  const navigate = useNavigate(); 
  const [isSpinning, setIsSpinning] = useState(false); // סטייט לניהול מצב הטעינה (אנימציית הבחירה)
  const [luckyMovie, setLuckyMovie] = useState(null); // שמירת נתוני הסרט שנבחר רנדומלית

  // הפונקציה המרכזית שבוחרת סרט רנדומלי
  const handleSurpriseMe = async () => {
    setIsSpinning(true); // מתחילים את מצב ה"טעינה" הוויזואלי
    setLuckyMovie(null); // מאפסים סרט קודם אם היה
    
    try {
      //  משיכת כל ה-IDs הקיימים באוסף הסרטים ב-Firebase
      const querySnapshot = await getDocs(collection(db, "movies"));
      const allIds = querySnapshot.docs.map(d => d.id); // יצירת מערך של מזהי ה-IMDB בלבד
      
      // בדיקת בטיחות: אם ה-DB ריק, נעצור ונחזיר שגיאה למשתמש
      if (allIds.length === 0) {
        setIsSpinning(false);
        alert("No movies found in your database!");
        return;
      }

      //  הגרלת מזהה אחד מתוך המערך בעזרת פונקציית רנדום
      const finalId = allIds[Math.floor(Math.random() * allIds.length)];
      
      //  פנייה ל-API של OMDb כדי להביא את הנתונים המלאים על הסרט שהוגרל
      const res = await fetch(`https://www.omdbapi.com/?i=${finalId}&apikey=${API_KEY}`);
      const data = await res.json();

      setTimeout(() => {
        setLuckyMovie(data); // שמירת נתוני הסרט בסטייט
        setIsSpinning(false); // סיום מצב הטעינה
        triggerConfetti(); 
      }, 1500); 

    } catch (e) {
      console.error("Lucky Error:", e);
      setIsSpinning(false);
    }
  };

  // פונקציה ליצירת אפקט קונפטי מצדדי המסך
  const triggerConfetti = () => {
    const duration = 2 * 1000; // משך האפקט: 2 שניות
    const end = Date.now() + duration;

    // פונקציית פריים שמריצה את האנימציה בכל רגע נתון עד לסיום הזמן
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, zIndex: 3000, colors: ['#e50914', '#ffffff'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, zIndex: 3000, colors: ['#e50914', '#ffffff'] });
      
      // אם לא עברו 2 שניות, המשך לבקש פריים חדש של אנימציה
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  // useEffect שדואג להפעיל את ההגרלה אוטומטית בכל פעם שהמודאל נפתח
  useEffect(() => {
    if (isOpen) handleSurpriseMe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal show d-block lucky-modal-overlay">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-white p-4 text-center lucky-modal-content">
          
          {/* כפתור סגירה - X */}
          <button onClick={onClose} className="lucky-close-btn">&times;</button>
          
          {/* רינדור מותנה: אם אנחנו במצב טעינה/ספינינג */}
          {isSpinning ? (
            <div className="py-5">
              <div className="spinner-border text-danger mb-3" role="status"></div>
              <h2 className="lucky-title">Choosing your movie...</h2>
            </div>
          ) : luckyMovie ? (
            /* רינדור מותנה: הצגת הסרט שנבחר בהצלחה */
            <>
              <h2 className="mb-4 lucky-title">Pick of the Night! 🎉</h2>
              
              <div className="d-flex flex-column align-items-center mb-4">
                {/* הצגת פוסטר הסרט עם Placeholder למקרה שאין תמונה */}
                <img 
                  src={luckyMovie.Poster !== "N/A" ? luckyMovie.Poster : "https://via.placeholder.com/300x450?text=No+Poster"} 
                  alt={luckyMovie.Title} 
                  className="lucky-poster finished img-fluid"
                  style={{ maxHeight: '400px', borderRadius: '10px' }}
                />
                <h3 className="mt-3 lucky-movie-name">{luckyMovie.Title}</h3>
              </div>

              {/* כפתורי פעולה בתוך המודאל */}
              <div className="d-flex justify-content-center gap-2 mt-2">
                {/* כפתור הגרלה מחדש */}
                <button className="btn-lucky-secondary" onClick={handleSurpriseMe}>
                  Not my vibe 👎
                </button>
                {/* כפתור מעבר לדף המידע המלא - סגירת המודאל וניווט לפי ה-ID */}
                <button className="btn-lucky-main" onClick={() => { onClose(); navigate(`/info/${luckyMovie.imdbID}`); }}>
                  Yasss! Show me the details 🔥
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}