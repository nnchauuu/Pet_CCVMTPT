import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserManagement = () => {
  const BACKEND_URL = "http://localhost:8080/api/v1";

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const getAuthHeaders = () => {
    const userStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const token = userStorage?.token || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/users`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || result || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải người dùng");
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/roles`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        setRoles(result.data || result || []);
      }
    } catch (error) {
      toast.error("Lỗi tải roles");
    }
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    let currentRoleId = user.role?._id || user.role?.id || "";
    setSelectedRoleId(currentRoleId);
    setShowModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedRoleId) return toast.warning("Chọn role trước!");

    try {
      const userId = selectedUser._id || selectedUser.id;
      const response = await fetch(`${BACKEND_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Cập nhật role thành công");
        setShowModal(false);
        fetchUsers();
      } else {
        toast.error(result.message || "Thất bại");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", padding: "40px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* HEADER */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ color: "#212529", fontWeight: 700 }}>User Management</h2>
        <p style={{ color: "#6c757d", marginBottom: 0 }}>
          Manage system users & permissions
        </p>
      </div>

      {/* CARD TABLE */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f1f3f5" }}>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id || user.id} style={rowStyle}>
                  <td style={tdStyle}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={avatarStyle}>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.username}</div>
                        <small style={{ color: "#6c757d" }}>{user.email}</small>
                      </div>
                    </div>
                  </td>

                  <td style={tdStyle}>{user.email}</td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          user.role?.name === "ADMIN" ? "#fde2e1" : "#e7f1ff",
                        color:
                          user.role?.name === "ADMIN" ? "#d93025" : "#0d6efd",
                      }}
                    >
                      {user.role?.name || "No role"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      onClick={() => handleOpenModal(user)}
                      style={btnStyle}
                    >
                      Change
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && selectedUser && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ marginBottom: 20 }}>Update Role</h4>

            <p>
              <strong>{selectedUser.username}</strong>
            </p>

            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 20 }}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role._id || role.id} value={role._id || role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button onClick={() => setShowModal(false)} style={cancelBtn}>
                Cancel
              </button>
              <button onClick={handleSaveRole} style={btnStyle}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: "14px 20px",
  textAlign: "left",
  fontSize: 13,
  color: "#6c757d",
};

const tdStyle = {
  padding: "16px 20px",
  borderTop: "1px solid #dee2e6",
};

const rowStyle = {
  transition: "0.2s",
};

const avatarStyle = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#0d6efd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: 600,
};

const btnStyle = {
  background: "#0d6efd",
  color: "white",
  border: "none",
  padding: "6px 16px",
  borderRadius: 6,
  cursor: "pointer",
};

const cancelBtn = {
  background: "#e9ecef",
  border: "none",
  padding: "6px 16px",
  borderRadius: 6,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBox = {
  background: "white",
  padding: 30,
  borderRadius: 10,
  width: 320,
};

export default UserManagement;
