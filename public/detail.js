document.addEventListener("DOMContentLoaded", () => {
  const movieId = new URLSearchParams(window.location.search).get("id");
  if (movieId) {
    fetchMovieDetails(movieId);
  } else {
    document.getElementById("movie-detail-container").innerHTML =
      "<h1>Movie not found.</h1>";
  }
});

/**
 * Fetches details for a specific movie from our API.
 * @param {string} movieId
 */
async function fetchMovieDetails(movieId) {
  const url = `/api/getMovies?movieId=${movieId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch movie details");
    const movie = await response.json();
    displayMovieDetails(movie);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Populates the detail page with movie data.
 * @param {object} movie
 */
function displayMovieDetails(movie) {
  const IMG_BASE_URL = "https://image.tmdb.org/t/p/";

  // Set background
  const container = document.getElementById("movie-detail-container");
  if (movie.backdrop_path) {
    container.style.backgroundImage = `url(${IMG_BASE_URL}original${movie.backdrop_path})`;
  }

  // Populate details
  document.getElementById(
    "detail-poster-img"
  ).src = `${IMG_BASE_URL}w500${movie.poster_path}`;
  document.getElementById("detail-title").textContent = movie.title;
  document.getElementById(
    "detail-rating"
  ).textContent = `⭐ ${movie.vote_average.toFixed(1)}`;
  document.getElementById(
    "detail-release-date"
  ).textContent = `Released: ${movie.release_date}`;
  document.getElementById("detail-overview").textContent = movie.overview;

  // Populate genres
  const genresContainer = document.getElementById("detail-genres");
  genresContainer.innerHTML = "";
  movie.genres.forEach((genre) => {
    const genrePill = document.createElement("span");
    genrePill.classList.add("genre-pill");
    genrePill.textContent = genre.name;
    genresContainer.appendChild(genrePill);
  });

  // Handle Watchlist Button
  const watchlistBtn = document.getElementById("watchlist-btn");
  updateWatchlistButton(watchlistBtn, movie.id);

  watchlistBtn.addEventListener("click", () => {
    toggleWatchlist(movie); // Pass the whole movie object
    updateWatchlistButton(watchlistBtn, movie.id);
  });
}

// --- WATCHLIST LOGIC ---

/**
 * Gets the watchlist from localStorage.
 * @returns {Array}
 */
function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist") || "[]");
}

/**
 * Saves the watchlist to localStorage.
 * @param {Array} watchlist
 */
function saveWatchlist(watchlist) {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

/**
 * Adds or removes a movie from the watchlist.
 * @param {object} movie - The full movie object.
 */
function toggleWatchlist(movie) {
  let watchlist = getWatchlist();
  const movieIndex = watchlist.findIndex((item) => item.id === movie.id);

  if (movieIndex > -1) {
    // Movie is in watchlist, remove it
    watchlist.splice(movieIndex, 1);
  } else {
    // Movie is not in watchlist, add it
    watchlist.push(movie);
  }
  saveWatchlist(watchlist);
}

/**
 * Updates the button text and style based on watchlist status.
 * @param {HTMLElement} button
 * @param {number} movieId
 */
function updateWatchlistButton(button, movieId) {
  const watchlist = getWatchlist();
  const isInWatchlist = watchlist.some((item) => item.id === movieId);
  if (isInWatchlist) {
    button.textContent = "Added to Watchlist";
    button.classList.add("added");
  } else {
    button.textContent = "Add to Watchlist";
    button.classList.remove("added");
  }
}
