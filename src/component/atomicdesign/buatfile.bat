@echo off
cd /d D:\KULIAH\MAGANG\NESWARA\neswara-clone\src\component\atomicdesign

:: Membuat folder utama navbar jika belum ada
if not exist navbar mkdir navbar
cd navbar

:: Membuat subfolder atoms, molecules, organisms jika belum ada
if not exist atoms mkdir atoms
if not exist molecules mkdir molecules
if not exist organisms mkdir organisms

:: Membuat file dalam folder atoms
echo. > atoms\Button.jsx
echo. > atoms\Icon.jsx
echo. > atoms\Logo.jsx
echo. > atoms\NavLink.jsx

:: Membuat file dalam folder molecules
echo. > molecules\SearchBar.jsx
echo. > molecules\UserMenu.jsx
echo. > molecules\MobileMenuButton.jsx

:: Membuat file dalam folder organisms
echo. > organisms\NavbarAtomicDesign.jsx

:: Membuat file index.js
echo. > index.js

echo Struktur folder dan file navbar telah berhasil dibuat!
pause
