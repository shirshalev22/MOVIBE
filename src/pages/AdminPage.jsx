import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { 
  collection, getDocs, addDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, GeoPoint 
} from 'firebase/firestore';

export default function AdminPage({ user }) {
  // --- States לניהול הרשימות בטבלאות ---
  const [usersList, setUsersList] = useState([]); // רשימת משתמשים מהאתר
  const [cinemasList, setCinemasList] = useState([]); // רשימת בתי קולנוע
  const [loading, setLoading] = useState(true);
  
  // --- States לטופס הוספת קולנוע חדש ---
  const [cinemaName, setCinemaName] = useState("");
  const [cinemaLat, setCinemaLat] = useState("");
  const [cinemaLng, setCinemaLng] = useState("");
  const [cinemaAddress, setCinemaAddress] = useState(""); // כתובת שמתקבלת מה-API או הקלדה

  // פונקציה חכמה: הופכת קואורדינטות (Lat/Lng) לכתובת רחוב אמיתית
  const fetchAddress = async () => {
    if (!cinemaLat || !cinemaLng) return;
    try {
      // פנייה ל-API חיצוני של OpenStreetMap
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${cinemaLat}&lon=${cinemaLng}`);
      const data = await res.json();
      if (data.display_name) {
        setCinemaAddress(data.display_name); // עדכון ה-State של הכתובת באופן אוטומטי
      }
    } catch (e) {
      console.log("Could not fetch address automatically");
    }
  };

  useEffect(() => {
    // 1. משיכת כל המשתמשים מה-Database (קריאה חד פעמית)
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsersList(users);
      } catch (e) { }
    };

    // 2. האזנה בזמן אמת לבתי הקולנוע (onSnapshot)
    // כל שינוי ב-DB יעדכן את הטבלה מיד ללא רענון
    const unsubCinemas = onSnapshot(collection(db, "cinemas"), (snapshot) => {
      const cinemas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCinemasList(cinemas);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubCinemas(); // ניקוי המאזין כשהמנהל יוצא מהדף
  }, []);

  // פונקציה להוספת קולנוע חדש ל-Firestore
  const handleAddCinema = async (e) => {
    e.preventDefault(); // מניעת רענון הטופס
    try {
      await addDoc(collection(db, "cinemas"), {
        name: cinemaName,
        address: cinemaAddress,
        // שימוש ב-GeoPoint כדי לשמור מיקום גאוגרפי תקין
        location: new GeoPoint(parseFloat(cinemaLat), parseFloat(cinemaLng)),
        createdAt: serverTimestamp() // זמן שרת
      });
      // איפוס הטופס לאחר ההוספה
      setCinemaName(""); setCinemaLat(""); setCinemaLng(""); setCinemaAddress("");
    } catch (e) { alert("Error adding cinema"); }
  };

  // פונקציה למחיקת קולנוע
  const handleDeleteCinema = async (id) => {
    if (window.confirm("Are you sure you want to delete this cinema?")) {
      try {
        // מחיקה לפי ID ייחודי של המסמך
        await deleteDoc(doc(db, "cinemas", id));
      } catch (e) { alert("Error deleting cinema"); }
    }
  };

  // --- אבטחה: אם המשתמש אינו אדמין, הוא נחסם כאן ---
  if (user?.role !== 'admin') {
    return (
      <div className="container page-narrow" style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        <h1>Access Denied</h1>
        <p>Admin permissions required.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ color: "white" }}>
      <h1 className="text-center my-4" style={{ color: "#e50914" }}>System Management</h1>

      {/* טופס הוספה - UI מעוצב */}
      <section className="card bg-dark text-white p-4 mb-5 border-secondary shadow-lg">
        <h3 className="mb-4 h5 text-center opacity-75">Add New Cinema Location</h3>
        <form onSubmit={handleAddCinema} className="row g-3 justify-content-center">
          <div className="col-md-3">
            <input type="text" className="form-control bg-secondary text-white border-0" placeholder="Cinema Name" value={cinemaName} onChange={(e) => setCinemaName(e.target.value)} required />
          </div>
          <div className="col-md-2">
            {/* onBlur: כשיוצאים מהשדה, המערכת מנסה להביא כתובת אוטומטית */}
            <input type="number" step="any" className="form-control bg-secondary text-white border-0" placeholder="Lat" value={cinemaLat} onChange={(e) => setCinemaLat(e.target.value)} onBlur={fetchAddress} required />
          </div>
          <div className="col-md-2">
            <input type="number" step="any" className="form-control bg-secondary text-white border-0" placeholder="Lng" value={cinemaLng} onChange={(e) => setCinemaLng(e.target.value)} onBlur={fetchAddress} required />
          </div>
          <div className="col-md-3">
            <input type="text" className="form-control bg-secondary text-white border-0" placeholder="Address" value={cinemaAddress} onChange={(e) => setCinemaAddress(e.target.value)} required />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-danger w-100 fw-bold" disabled={loading}>
              {loading ? "..." : "Add"}
            </button>
          </div>
        </form>
      </section>

      {/* טבלת ניהול בתי קולנוע */}
      <section className="mb-5">
        <h2 className="mb-4 h4 text-center opacity-75">Manage Cinemas</h2>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle shadow-sm">
            <thead>
              <tr className="text-muted" style={{ fontSize: "0.85rem" }}>
                <th>Cinema Name</th>
                <th>Address</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cinemasList.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.address || "N/A"}</td>
                  {/* הצגת הקואורדינטות בעיגול של 3 ספרות אחרי הנקודה */}
                  <td>{c.location.latitude.toFixed(3)}, {c.location.longitude.toFixed(3)}</td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteCinema(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* טבלת משתמשים רשומים */}
      <section className="mt-5">
        <h2 className="mb-4 h4 text-center opacity-75">Registered Users</h2>
        <div className="table-responsive">
          <table className="table table-dark table-hover shadow-sm">
            <thead>
              <tr className="text-muted" style={{ fontSize: "0.85rem" }}>
                <th>Name</th>
                <th>Email</th>
                <th>Access Level</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName || "No Name"}</td>
                  <td className="text-white-50">{u.email}</td>
                  <td>
                    {/* צביעת התגית בהתאם לתפקיד המשתמש */}
                    <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                      {u.role?.toUpperCase() || 'USER'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}