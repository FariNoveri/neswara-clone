import React from 'react';

const FilterBar = ({
  filterEmail,
  filterDate,
  filterRole,
  filterDateFrom,
  filterDateTo,
  onFilterChange,
  dateOptions = [],
  roleOptions = []
}) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
      <input
        type="text"
        placeholder="Cari Pengguna (Email/Nama)"
        value={filterEmail}
        onChange={(e) => onFilterChange('email', e.target.value)}
        className="px-3 py-2 border rounded-lg"
      />
      <select
        value={filterDate}
        onChange={(e) => onFilterChange('date', e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">Pilih Tanggal Register</option>
        {dateOptions.map(option => (
          <option key={option} value={option}>{option === 'all' ? 'Semua' : option === 'last7days' ? '7 Hari Terakhir' : option === 'last30days' ? '30 Hari Terakhir' : 'Kustom'}</option>
        ))}
      </select>
      {filterDate === 'custom' && (
        <>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </>
      )}
      <select
        value={filterRole}
        onChange={(e) => onFilterChange('role', e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">Pilih Role</option>
        {roleOptions.map(option => (
          <option key={option} value={option}>{option === 'all' ? 'Semua' : option === 'admin' ? 'Admin' : 'User'}</option>
        ))}
      </select>
    </div>
  );
};

export default FilterBar;
