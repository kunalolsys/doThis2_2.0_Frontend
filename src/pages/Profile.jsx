import React, { useState } from 'react';
import { Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    // UI State only (for password toggle visual)
    const [showPassword, setShowPassword] = useState(false);

    // Static Dummy Data for UI Preview
    const user = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 234 567 890",
        telegramUsername: "@johndoe_dev",
        department: "Engineering",
        role: "Senior Developer",
        altemail: "john.secondary@example.com",
        isMailReceive: true,
        isActive: true,
        createdAt: "2023-01-15T00:00:00.000Z",
        updatedAt: "2023-11-20T00:00:00.000Z"
    };

    return (
        <div className="px-6 py-8 w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
            </div>

            {/* Main Card */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 shadow-sm overflow-hidden p-6">
                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* LEFT COLUMN - Editable Fields */}
                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Full Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={user.name}
                                    className="w-full px-4 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none"
                                    placeholder="Enter full name"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none"
                                        placeholder="Leave blank to keep current"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Telegram */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Telegram Username
                                </label>
                                <input
                                    type="text"
                                    defaultValue={user.telegramUsername}
                                    className="w-full px-4 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none"
                                    placeholder="@username"
                                />
                            </div>

                            {/* Email (Disabled) */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Read-only Information */}
                        <div className="space-y-5">
                            {/* Phone */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={user.phone}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Alt Email */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Alternative Email
                                </label>
                                <input
                                    type="email"
                                    value={user.altemail}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={user.department}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={user.role}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed capitalize"
                                />
                            </div>

                            {/* Save Button Area (Aligned to bottom right of this column) */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    className="flex items-center justify-center bg-green-500 px-6 py-2.5 rounded-lg text-white hover:bg-green-600 font-semibold shadow-sm transition active:scale-95"
                                >
                                    <Save className="mr-2" size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section - Read-only */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Notification Preferences</h3>
                        
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Receive Email Notifications
                                </label>
                                <p className="text-sm text-gray-500">Get important updates via email</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isMailReceive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.isMailReceive ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Use Alternative Email
                                </label>
                                <p className="text-sm text-gray-500">Receive notifications on alternative email</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.altemail ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.altemail ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    {/* Status Information (Read-only) */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                                <span className={`inline-flex px-2 py-1 rounded-md text-sm font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Member Since</label>
                                <p className="text-gray-900 font-medium">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Last Updated</label>
                                <p className="text-gray-900 font-medium">
                                    {new Date(user.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Back to Dashboard Link */}
            <div className="mt-6 text-center">
                <Link to="/dashboard" className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Profile;