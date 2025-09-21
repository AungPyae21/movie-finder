// --- DOM ELEMENTS ---
const movieContainer = document.getElementById("movie-container");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsHeading = document.getElementById("results-heading");
const loadMoreContainer = document.getElementById("load-more-container");
const genreButtons = document.querySelectorAll(".genre-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const body = document.body;
const searchNavBtn = document.getElementById("search-nav-btn");
const searchBanner = document.getElementById("search-banner");
const watchlistNavBtn = document.getElementById("watchlist-nav-btn");

// --- GLOBAL STATE ---
const API_BASE_URL = "/api/getMovies";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";
let currentPage = 1;
let totalPages = 0;
let currentMode = "popular";
let currentSearchTerm = "";
let currentGenre = "";
let isLoading = false;

// --- THEME SWITCHER LOGIC ---
function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light-mode");
  } else {
    body.classList.remove("light-mode");
  }
}
function toggleTheme() {
  const newTheme = body.classList.contains("light-mode") ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
}
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// --- WATCHLIST HELPER FUNCTIONS ---
function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist") || "[]");
}

function saveWatchlist(watchlist) {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

function toggleWatchlist(movie) {
  let watchlist = getWatchlist();
  const movieIndex = watchlist.findIndex((item) => item.id === movie.id);
  if (movieIndex > -1) {
    watchlist.splice(movieIndex, 1);
  } else {
    watchlist.push(movie);
  }
  saveWatchlist(watchlist);
}

// --- CORE MOVIE FETCHING AND DISPLAY LOGIC ---
async function fetchAndDisplayMovies(mode, params = {}, append = false) {
  if (isLoading) return;
  isLoading = true;
  if (!append) {
    movieContainer.innerHTML = '<div class="loader"></div>';
  }
  loadMoreContainer.innerHTML = "";

  let url = `${API_BASE_URL}?`;
  const queryParams = new URLSearchParams(params);
  if (mode === "popular") queryParams.set("popular", "true");
  else if (mode === "genre") queryParams.set("genre", params.genre);
  else if (mode === "search") queryParams.set("search", params.search);
  url += queryParams.toString();

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    if (!append) {
      movieContainer.innerHTML = "";
    }

    // Pass the full data results to displayMovies
    displayMovies(data.results);

    currentPage = data.page;
    totalPages = data.total_pages > 500 ? 500 : data.total_pages;

    displayLoadMoreButton();
  } catch (error) {
    console.error("Failed to fetch movies:", error);
    movieContainer.innerHTML = `<p class="error-message">Could not load movies.</p>`;
  } finally {
    isLoading = false;
  }
}

/**
 * Renders movie cards to the container. (MODIFIED)
 * @param {Array} movies
 */
function displayMovies(movies) {
  if (movies.length === 0 && movieContainer.innerHTML === "") {
    movieContainer.innerHTML = `<p>No movies found.</p>`;
    return;
  }

  const watchlist = getWatchlist();

  movies.forEach((movie) => {
    if (!movie.poster_path) return;

    const isInWatchlist = watchlist.some((item) => item.id === movie.id);
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.dataset.movieId = movie.id; // Set movie ID for event delegation

    const ratingClass =
      movie.vote_average >= 7
        ? "good"
        : movie.vote_average >= 5
        ? "mid"
        : "bad";
    const overview =
      movie.overview.length > 150
        ? movie.overview.substring(0, 150) + "..."
        : movie.overview;

    movieCard.innerHTML = `
      <div class="watchlist-icon ${
        isInWatchlist ? "in-watchlist" : ""
      }" title="Add to Watchlist">★</div>
      <img src="${IMG_BASE_URL}${movie.poster_path}" alt="${movie.title}">
      <div class="rating ${ratingClass}"><span class="star-icon">⭐</span>${movie.vote_average.toFixed(
      1
    )}</div>
      <div class="movie-details-overlay"><h3>${
        movie.title
      }</h3><p>${overview}</p></div>`;

    movieContainer.appendChild(movieCard);
  });

  // Set up event listeners using event delegation
  setupCardEventListeners(movies);
}

//reates and shows the 'Load More' button if needed.

function displayLoadMoreButton() {
  if (currentPage < totalPages) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.textContent = "Load More";
    loadMoreBtn.classList.add("load-more-btn");
    loadMoreBtn.addEventListener("click", handleLoadMoreClick);
    loadMoreContainer.innerHTML = "";
    loadMoreContainer.appendChild(loadMoreBtn);
  } else {
    loadMoreContainer.innerHTML = "<p>No more results</p>";
  }
}

// --- EVENT HANDLERS ---

/**
 * NEW: Uses a single event listener on the container for all card interactions.
 * @param {Array} movies - The array of movie objects currently displayed.
 */
function setupCardEventListeners(movies) {
  movieContainer.onclick = function (event) {
    const target = event.target;

    // Handle watchlist icon clicks
    if (target.classList.contains("watchlist-icon")) {
      const card = target.closest(".movie-card");
      const movieId = parseInt(card.dataset.movieId);
      const movie = movies.find((m) => m.id === movieId);
      if (movie) {
        toggleWatchlist(movie);
        target.classList.toggle("in-watchlist");
      }
      return;
    }
    const card = target.closest(".movie-card");
    if (card) {
      const movieId = card.dataset.movieId;
      window.location.href = `./detail.html?id=${movieId}`;
    }
  };
}

function handleLoadMoreClick() {
  const nextPage = currentPage + 1;
  const params = { page: nextPage };
  if (currentMode === "search") params.search = currentSearchTerm;
  if (currentMode === "genre") params.genre = currentGenre;
  fetchAndDisplayMovies(currentMode, params, true);
}

// --- EVENT LISTENERS ---

searchNavBtn.addEventListener("click", () => {
  searchBanner.scrollIntoView({ behavior: "smooth" });
});

themeToggleBtn.addEventListener("click", toggleTheme);

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    currentMode = "search";
    currentSearchTerm = searchTerm;
    resultsHeading.textContent = `Search Results for "${searchTerm}"`;
    fetchAndDisplayMovies("search", { search: searchTerm, page: 1 }, false);
    searchInput.value = "";
  }
});

genreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Note: The watchlist button is handled separately now
    if (button.id === "watchlist-nav-btn") return;

    genreButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const genre = button.dataset.genre;
    const genreName = button.textContent;

    if (genre === "popular") {
      currentMode = "popular";
      resultsHeading.textContent = `Popular Movies`;
      fetchAndDisplayMovies("popular", { page: 1 }, false);
    } else {
      currentMode = "genre";
      currentGenre = genre;
      resultsHeading.textContent = `${genreName} Movies`;
      fetchAndDisplayMovies("genre", { genre: genre, page: 1 }, false);
    }
  });
});

watchlistNavBtn.addEventListener("click", () => {
  genreButtons.forEach((btn) => btn.classList.remove("active"));
  watchlistNavBtn.classList.add("active");

  currentMode = "watchlist";
  resultsHeading.textContent = "My Watchlist";
  movieContainer.innerHTML = "";
  const watchlist = getWatchlist();
  displayMovies(watchlist);

  // Hide 'Load More' button when viewing watchlist
  loadMoreContainer.innerHTML = "";
});

// --- INITIAL LOAD ---
document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayMovies("popular", { page: 1 }, false);
});
