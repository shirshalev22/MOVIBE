import React, { useEffect, useState } from 'react';
import { 
  MapContainer, // הלוח עליו מצויר המפה
  TileLayer, // שכבת המפה עצמה
  Marker, // ה"נעץ" שמצביע על מיקום ספציפי
  Popup // הבועה הקטנה שנפתחת כשלוחצים על הנעץ
} from 'react-leaflet';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import L from 'leaflet';
import useFavorites from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

// ייבוא תמונות המרקרים ישירות כדי לפתור באג בנתיבי התמונות של Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// הגדרת האייקון ברירת המחדל של המפה (תיקון ויזואלי הכרחי ב-React)
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41], // גודל האייקון בפיקסלים
    iconAnchor: [12, 41] // הנקודה באייקון שמוצבת בדיוק על הקואורדינטה
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Map() {
  const [cinemas, setCinemas] = useState([]);
  const { user } = useFavorites(); // שימוש ב-Hook כדי לבדוק אם המשתמש מחובר
  const navigate = useNavigate();

  // מאזין בזמן אמת לנתוני בתי הקולנוע ב-Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cinemas"), (snapshot) => {
      const cinemaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCinemas(cinemaData);
    });

    // ניקוי המאזין כשהמשתמש עוזב את הדף
    return () => unsubscribe();
  }, []);

  // הגנת פרטיות: רק משתמשים מחוברים יכולים לראות את המפה
  if (!user) {
    return (
      <div className="container page-narrow" style={{ color: "white" }}>
        <h1>Map</h1>
        <p style={{ textAlign: "center" }}>To see the map, log in to your account.</p>
        <div className="center">
          <button className="vod-btn logout-inline" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='container text-white text-center mt-4'>
      <h1 style={{ color: "#e50914", margin: "18px 0 16px" }}>Cinema Map</h1>
      <h3 className="mb-4 h5" style={{ opacity: 0.8 }}>Find your favorite cinema near you</h3>
      <div style={{ borderRadius: "15px", overflow: "hidden", border: "2px solid #333",boxShadow: "0 10px 30px rgba(0,0,0,0.5)" 
      }}>
        <MapContainer
          center={[32.0853, 34.7818]} // נקודת המרכז של המפה בטעינה ראשונה (תל אביב/מרכז ישראל)
          zoom={9} // רמת זום התחלתית (9 מאפשר לראות את רוב הארץ)
          scrollWheelZoom={true} // מאפשר זום באמצעות גלגלת העכבר
          style={{ height: "500px", width: "100%" }}
        >
          {/* שכבת ה-Tiles: התמונות הגרפיות של המפה מגיעות משרתי OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* 3. לוגיקת הצגת המרקרים: מעבר על כל בתי הקולנוע מה-DB */}
          {cinemas.map((cinema) => (
            <Marker 
              key={cinema.id} 
              // מיקום המרקר נלקח ישירות מאובייקט ה-GeoPoint (Latitude & Longitude)
              position={[cinema.location.latitude, cinema.location.longitude]}
            >
              {/* הפופ-אפ שנפתח בלחיצה על המרקר */}
              <Popup>
                <div style={{ color: "black", textAlign: "center" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{cinema.name}</strong><br />
                  <span style={{ color: "#666" }}>{cinema.address}</span><br />
                  <p className="mt-2 mb-0">🍿 Enjoy the movie!</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}