import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api/user";

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cccd: '',
    address: '',
    phone: '',
    payment_card: '',
    date_of_birth: '',
    gender: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // State for loader
  const { navigate, isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserData = async () => {
      try {
        const response = await getProfile();
        console.log(response);
        setUser(response.data.data);
        setFormData({
          name: response.data.data.name || '',
          cccd: response.data.data.cccd || '',
          address: response.data.data.address || '',
          phone: response.data.data.phone || '',
          payment_card: response.data.data.payment_card || '',
          date_of_birth: response.data.data.date_of_birth ? new Date(response.data.data.date_of_birth).toISOString().split('T')[0] : '',
          gender: response.data.data.gender || ''
        });
      } catch (error) {
        toast.error("Failed to load profile. Please log in again.", {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      const updateData = {
        ...formData,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null
      };
      const response = await updateProfile(updateData);
      toast.success("Profile updated successfully", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setUser(response.data);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (!user)
    return (
      <div className="text-center text-black font-semibold mt-20">
        Đang tải thông tin tài khoản...
      </div>
    );

  return (
    <div className="flex items-center justify-center py-10  px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl montserrat-regular text-[#8B4513] flex items-center gap-2 mb-6 border-b pb-4">
          <FaUser className="text-black" /> Thông tin tài khoản
        </h2>

        {!isEditing ? (
          <div className="space-y-6">
            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Họ và tên</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.name}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Email</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.email}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">CCCD</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.cccd || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Địa chỉ</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.address || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Số điện thoại</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.phone || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Thẻ thanh toán</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.payment_card || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Ngày sinh</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Chưa cập nhật'}
              </span>
            </div>

            <div className="text-lg font-medium flex flex-col">
              <span className="text-[#8B4513]">Giới tính</span>
              <span className="text-[#8B4513] bg-gray-100 font-normal p-2 rounded-md">
                {user.gender || 'Chưa cập nhật'}
              </span>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-8 w-full bg-[#8B4513] text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-[#2C1810] transition-all duration-200 shadow-md"
            >
              <FaEdit /> Chỉnh sửa thông tin
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">CCCD</label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Thẻ thanh toán</label>
              <input
                type="text"
                name="payment_card"
                value={formData.payment_card}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Ngày sinh</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8B4513] font-medium mb-1">Giới tính</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-1 focus:ring-blue-700 outline-none"
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
              >
                Cập nhật
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* <button
          onClick={() => setIsModalOpen(true)}
          className="mt-8 w-full bg-[#8B4513] text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-[#2C1810] transition-all duration-200 shadow-md"
        >
          <FaTrash /> Xóa tài khoản
        </button> */}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Bạn có chắc chắn muốn xóa tài khoản?</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tài khoản? Thao tác này không thể được hoàn tác.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>Đang xóa...</>
                ) : (
                  <>
                    <FaTrash />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
