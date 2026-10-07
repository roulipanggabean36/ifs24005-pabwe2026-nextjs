"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  asyncGetProfile,
  asyncChangeProfile,
  asyncChangeProfilePhoto,
  asyncChangeProfilePassword,
} from "../states/action";
import useInput from "@/hooks/useInput";
import { IconUser, IconCamera, IconLock } from "@tabler/icons-react";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const {
    profile,
    isProfile,
    isChangeProfile,
    isChangeProfilePhoto,
    isChangeProfilePassword,
  } = useAppSelector((state) => state.users);

  const [name, onNameChange, setName] = useInput("");
  const [email, onEmailChange, setEmail] = useInput("");
  const [password, onPasswordChange, , resetPassword] = useInput("");
  const [newPassword, onNewPasswordChange, , resetNewPassword] = useInput("");
  const [confirmPassword, onConfirmPasswordChange, , resetConfirm] =
    useInput("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoSrc = photoPreview || profile?.photo;

  useEffect(() => {
    dispatch(asyncGetProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
    }
  }, [profile, setName, setEmail]);

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    await dispatch(asyncChangeProfile({ name, email }));
    dispatch(asyncGetProfile());
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    await dispatch(asyncChangeProfilePhoto(file));
    dispatch(asyncGetProfile());
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(
      asyncChangeProfilePassword({
        password,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
    );
    if (asyncChangeProfilePassword.fulfilled.match(result)) {
      resetPassword();
      resetNewPassword();
      resetConfirm();
    }
  }

  if (isProfile && !profile) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Memuat profil...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <IconUser size={24} aria-hidden="true" className="text-teal-700" />
          Profil Saya
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola informasi akun Anda
        </p>
      </div>

      {/* Photo */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Foto Profil</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-teal-100 overflow-hidden">
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                alt="Foto profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-teal-700 text-2xl font-semibold">
                {profile?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50 transition">
            <IconCamera size={18} aria-hidden="true" />
            {isChangeProfilePhoto ? "Mengunggah..." : "Ganti Foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isChangeProfilePhoto}
            />
          </label>
        </div>
      </div>

      {/* Profile form */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4"
      >
        <h2 className="font-semibold text-slate-800">Informasi Profil</h2>
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Nama
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={onNameChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label
            htmlFor="profile-email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={onEmailChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={isChangeProfile}
          className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-60"
        >
          {isChangeProfile ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      {/* Password */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4"
      >
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <IconLock size={18} aria-hidden="true" />
          Ubah Kata Sandi
        </h2>
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Kata Sandi Saat Ini
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={onPasswordChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Kata Sandi Baru
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={onNewPasswordChange}
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-new-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Konfirmasi Kata Sandi Baru
          </label>
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={isChangeProfilePassword}
          className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-60"
        >
          {isChangeProfilePassword ? "Menyimpan..." : "Ubah Kata Sandi"}
        </button>
      </form>
    </div>
  );
}