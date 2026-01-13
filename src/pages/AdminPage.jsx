import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp, 
  GeoPoint 
} from 'firebase/firestore';

export default function AdminPage({ user }) {
  const [usersList, setUsersList] = useState([]);
  const [cinemasList, setCinemasList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [cinemaName, setCinemaName] = useState("");
  const [cinemaLat, setCinemaLat] = useState("");
  const [cinemaLng, setCinemaLng] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsersList(users);
      } catch (e) { }
    };

    const unsubCinemas = onSnapshot(collection(db, "cinemas"), (snapshot) => {
      const cinemas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCinemasList(cinemas);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubCinemas();
  }, []);

  const handleAddCinema = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "cinemas"), {
        name: cinemaName,
        location: new GeoPoint(parseFloat(cinemaLat), parseFloat(cinemaLng)),
        createdAt: serverTimestamp()
      });
      setCinemaName(""); setCinemaLat(""); setCinemaLng("");
    } catch (e) { alert("Error adding cinema"); }
  };

  const handleDeleteCinema = async (id) => {
    if (window.confirm("Are you sure you want to delete this cinema?")) {
      try {
        await deleteDoc(doc(db, "cinemas", id));
      } catch (e) { alert("Error deleting cinema"); }
    }
  };

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
      <h1 style={{ color: "#e50914", textAlign: "center", margin: "18px 0 16px" }}>
        System Management
      </h1>

      {/* חלק א': טופס הוספה */}
      <section className="card bg-dark text-white p-4 mb-5 border-secondary shadow-lg">
        <h3 className="mb-4 h5 text-center" style={{ color: "#ffffff", opacity: 0.7 }}>
          Add New Cinema Location
        </h3>
        <form onSubmit={handleAddCinema} className="row g-3 justify-content-center">
          <div className="col-md-4">
            <input type="text" className="form-control bg-secondary text-white border-0" placeholder="Cinema Name" value={cinemaName} onChange={(e) => setCinemaName(e.target.value)} required />
          </div>
          <div className="col-md-3">
            <input type="number" step="any" className="form-control bg-secondary text-white border-0" placeholder="Latitude" value={cinemaLat} onChange={(e) => setCinemaLat(e.target.value)} required />
          </div>
          <div className="col-md-3">
            <input type="number" step="any" className="form-control bg-secondary text-white border-0" placeholder="Longitude" value={cinemaLng} onChange={(e) => setCinemaLng(e.target.value)} required />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-danger w-100 fw-bold">Add</button>
          </div>
        </form>
      </section>

      {/* חלק ב': ניהול בתי קולנוע */}
      <section className="mb-5">
        <h2 className="mb-4 h4 text-center" style={{ color: "#ffffff", opacity: 0.7, fontWeight: "normal" }}>
          Manage Cinemas
        </h2>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle shadow-sm">
            <thead>
              <tr className="text-muted text-uppercase" style={{ fontSize: "0.85rem" }}>
                <th>Cinema Name</th>
                <th>Location (Lat, Lng)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cinemasList.map((c) => (
                <tr key={c.id} className="border-bottom border-secondary">
                  <td>{c.name}</td>
                  <td>{c.location.latitude.toFixed(3)}, {c.location.longitude.toFixed(3)}</td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm px-3" onClick={() => handleDeleteCinema(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="my-5 opacity-25" />

      {/* חלק ג': טבלת משתמשים */}
      <section className="mt-5">
        <h2 className="mb-4 h4 text-center" style={{ color: "#ffffff", opacity: 0.7, fontWeight: "normal" }}>
          Registered Platform Users
        </h2>
        <div className="table-responsive">
          <table className="table table-dark table-hover shadow-sm">
            <thead>
              <tr className="text-muted text-uppercase" style={{ fontSize: "0.85rem" }}>
                <th>Name</th>
                <th>Email</th>
                <th>Access Level</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} className="border-bottom border-secondary">
                  <td className="py-3">{u.displayName || "No Name"}</td>
                  <td className="py-3 text-white-50">{u.email}</td>
                  <td className="py-3">
                    <span className={`badge px-3 py-2 ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`} style={{ minWidth: "80px" }}>
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