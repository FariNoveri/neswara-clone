import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const searchDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch search suggestions
  const fetchSearchSuggestions = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    try {
      const lowerQuery = searchQuery.toLowerCase();
      const q = query(
        collection(db, "news"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const newsItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filteredNews = newsItems.filter(news => {
        const titleMatch = news.judul?.toLowerCase().includes(lowerQuery);
        const contentMatch = news.konten?.toLowerCase().includes(lowerQuery);
        const categoryMatch = news.kategori?.toLowerCase().includes(lowerQuery);
        return titleMatch || contentMatch || categoryMatch;
      }).slice(0, 5);

      setSearchSuggestions(filteredNews);
      setIsSearchDropdownOpen(filteredNews.length > 0);
    } catch (error) {
      console.error("Error fetching search suggestions:", {
        message: error.message || "Unknown error",
        code: error.code || "No code",
        stack: error.stack || "No stack trace",
      });
      setSearchSuggestions([]);
      setIsSearchDropdownOpen(false);
    }
  };

  // Auto-search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSearchSuggestions();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/search", { state: { query: searchQuery.trim() } });
      setIsSearchDropdownOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSearchDropdownOpen(false);
    setIsMobileSearchOpen(false);
    navigate("/");
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestionClick = (news) => {
    navigate(`/berita/${news.id}`);
    setSearchQuery("");
    setIsSearchDropdownOpen(false);
    setIsMobileSearchOpen(false);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    } else {
      clearSearch();
    }
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="search-highlight">{part}</span>
      ) : (
        part
      )
    );
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="mobile-search-overlay bg-white p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <form onSubmit={handleSearch} className="flex-1 search-input-container">
                <div className="relative">
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Cari berita..."
                    className="w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="clear-button"
                    >
                      <FaTimesCircle />
                    </button>
                  )}
                </div>
              </form>
              <button
                onClick={toggleMobileSearch}
                className="text-gray-600 hover:text-blue-500 text-xl p-2"
              >
                <FaTimes />
              </button>
            </div>

            {/* Mobile Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-100 max-h-80 overflow-y-auto">
                {searchSuggestions.map((news) => (
                  <div
                    key={news.id}
                    onClick={() => handleSuggestionClick(news)}
                    className="p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {news.gambar && (
                        <img
                          src={news.gambar}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {highlightText(news.judul, searchQuery)}
                        </h4>
                        <p className="text-xs text-gray-500">{news.kategori || "Umum"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Search */}
      <div className="relative hidden sm:block" ref={searchDropdownRef}>
        <form onSubmit={handleSearch}>
          <div className="relative search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Cari berita..."
              className="w-64 pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Cari berita"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="clear-button"
              >
                <FaTimesCircle />
              </button>
            )}
          </div>
        </form>

        {/* Desktop Search Suggestions */}
        {isSearchDropdownOpen && searchSuggestions.length > 0 && (
          <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-lg border border-gray-100 z-50">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Saran Pencarian</p>
            </div>
            {searchSuggestions.map((news) => (
              <div
                key={news.id}
                onClick={() => handleSuggestionClick(news)}
                className="search-suggestion p-3 border-b border-gray-50 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  {news.gambar && (
                    <img
                      src={news.gambar}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {highlightText(news.judul, searchQuery)}
                    </h4>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{news.kategori || "Umum"}</p>
                      <p className="text-xs text-gray-400">
                        {news.createdAt?.toDate().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {searchQuery.trim() && (
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={handleSearch}
                  className="w-full text-left text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Lihat semua hasil untuk "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Button */}
      <button
        onClick={toggleMobileSearch}
        className="sm:hidden text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 p-1"
        aria-label="Cari"
      >
        <FaSearch />
      </button>
    </>
  );
};

export default SearchBar;