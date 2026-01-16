import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import L from 'leaflet';
import useFavorites from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * דף המפה - מציג את כל בתי הקולנוע המוגדרים במערכת.
 * משתמש ב-OpenStreetMap ובנתוני ה-Geopoint מה-Firestore.
 */
export default function Map() {
  const [cinemas, setCinemas] = useState([]);
  const { user } = useFavorites();
  const navigate = useNavigate();


  useEffect(() => {
    // האזנה בזמן אמת לאוסף בתי הקולנוע. 
    const unsubscribe = onSnapshot(collection(db, "cinemas"), (snapshot) => {
      const cinemaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCinemas(cinemaData);
    });

    return () => unsubscribe();
  }, []);

    // כאשר אין משתמש מחובר-לא מראים את המפה
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
      
      <div style={{ 
        borderRadius: "15px", 
        overflow: "hidden", 
        border: "2px solid #333",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)" 
      }}>
        <MapContainer
          center={[32.0853, 34.7818]} // נקודת המרכז הראשונית (ישראל)
          zoom={9}
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
        >
          {/* שכבת המפה הגרפית מ-OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* מעבר על מערך בתי הקולנוע ויצירת Marker לכל אחד */}
          {cinemas.map((cinema) => (
            <Marker 
              key={cinema.id} 
              // שליפת הקואורדינטות מתוך ה-GeoPoint של Firebase
              position={[cinema.location.latitude, cinema.location.longitude]}
            >
              <Popup>
                <div style={{ color: "black", textAlign: "center" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{cinema.name}</strong><br />
                  <span style={{ color: "#666" }}>Cinema Location</span><br />
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