// ====== SET YOUR TMDB KEY HERE ======
const TMDB_API_KEY = "08b92e5716a4598e8675669f4bf48c04"; // Get a (v3) Read Access Key from your TMDB account
// ====================================

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

const $ = (id) => document.getElementById(id);
const form = $("searchForm");
const input = $("searchInput");
const results = $("results");
const statusBox = $("status");
const categorySelect = $("categorySelect");
const modal = $("movieModal");
const modalBody = $("modalBody");
const closeModal = document.querySelector(".close");

function setStatus(text, show = true) {
  statusBox.textContent = text;
  statusBox.hidden = !show;
}

function movieCard(m) {
  const poster = m.poster_path ? `${IMG_BASE}${m.poster_path}` : "";
  const vote = (m.vote_average ?? 0).toFixed(1);
  const year = (m.release_date || "").slice(0, 4) || "—";
  const overview = (m.overview || "").trim();
  return `
    <article class="card" data-id="${m.id}">
      <div class="poster">
        ${
          poster
            ? `<img loading="lazy" src="${poster}" alt="${m.title || "Poster"}" />`
            : `<div class="noimg">No Image</div>`
        }
      </div>
      <div class="info">
        <h3 title="${m.title || ""}">${m.title || "Untitled"}</h3>
        <p class="meta">⭐ ${vote} · ${year}</p>
        <p class="overview">${overview || "No overview available."}</p>
      </div>
    </article>
  `;
}

async function fetchMoviesByCategory(category) {
  setStatus("Loading...");
  results.innerHTML = "";

  const url =
    `https://api.themoviedb.org/3/movie/${category}?api_key=${encodeURIComponent(TMDB_API_KEY)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.results) ? data.results : [];

    if (!list.length) {
      setStatus("No movies found for this category.");
      return;
    }

    results.innerHTML = list.slice(0, 24).map(movieCard).join("");
    setStatus(`Showing ${Math.min(list.length, 24)} of ${list.length} movies`);
  } catch (err) {
    console.error(err);
    setStatus("Failed to fetch movies. Check your API key or try again.");
  }
}

async function searchMovies(query) {
  setStatus("Searching…");
  results.innerHTML = "";

  const url =
    "https://api.themoviedb.org/3/search/movie" +
    `?api_key=${encodeURIComponent(TMDB_API_KEY)}` +
    `&query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.results) ? data.results : [];

    if (!list.length) {
      setStatus("No results. Try another title.");
      return;
    }

    results.innerHTML = list.slice(0, 24).map(movieCard).join("");
    setStatus(`Showing ${Math.min(list.length, 24)} of ${list.length} results`);
  } catch (err) {
    console.error(err);
    setStatus("Failed to fetch from TMDB. Check your API key or try again.");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  searchMovies(q);
});

categorySelect.addEventListener("change", () => {
  fetchMoviesByCategory(categorySelect.value);
});

// Add this new function to show movie details
async function showMovieDetails(movieId) {
  setStatus("Loading movie details...");
  modal.style.display = "flex";
  
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${encodeURIComponent(TMDB_API_KEY)}&append_to_response=credits`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const movie = await res.json();
    
    const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : "";
    const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : "";
    const vote = (movie.vote_average ?? 0).toFixed(1);
    const year = (movie.release_date || "").slice(0, 4) || "—";
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "—";
    
    // Get director if available
    let director = "—";
    if (movie.credits && movie.credits.crew) {
      const directorInfo = movie.credits.crew.find(person => person.job === "Director");
      if (directorInfo) director = directorInfo.name;
    }
    
    // Get top 5 cast members
    let cast = "—";
    if (movie.credits && movie.credits.cast && movie.credits.cast.length) {
      cast = movie.credits.cast.slice(0, 5).map(person => person.name).join(", ");
    }
    
    modalBody.innerHTML = `
      <div class="movie-details" style="${backdrop ? `background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${backdrop}'); background-size: cover; background-position: center; padding: 20px; border-radius: 8px;` : ''}">
        <div class="poster">
          ${poster ? `<img src="${poster}" alt="${movie.title || 'Poster'}" />` : '<div class="noimg">No Image</div>'}
        </div>
        <div class="info">
          <h2>${movie.title || "Untitled"} <span class="year">(${year})</span></h2>
          ${movie.tagline ? `<p class="tagline">"${movie.tagline}"</p>` : ''}
          
          <div class="meta">
            <span>⭐ ${vote}</span>
            <span>${runtime}</span>
            ${movie.genres && movie.genres.length ? `<span>${movie.genres.map(g => g.name).join(', ')}</span>` : ''}
          </div>
          
          <h3>Overview</h3>
          <p>${movie.overview || "No overview available."}</p>
          
          <div class="additional-info">
            ${director !== "—" ? `<p><strong>Director:</strong> ${director}</p>` : ''}
            ${cast !== "—" ? `<p><strong>Cast:</strong> ${cast}</p>` : ''}
            ${movie.production_companies && movie.production_companies.length ? `<p><strong>Production:</strong> ${movie.production_companies.map(c => c.name).join(', ')}</p>` : ''}
          </div>
          
          ${movie.homepage ? `<p><a href="${movie.homepage}" target="_blank" rel="noopener">Official Website</a></p>` : ''}
        </div>
      </div>
    `;
    
    setStatus("", false);
  } catch (err) {
    console.error(err);
    modalBody.innerHTML = `<p>Failed to load movie details. Please try again.</p>`;
    setStatus("Failed to load movie details", true);
  }
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

results.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) {
    const movieId = card.dataset.id;
    if (movieId) showMovieDetails(movieId);
  }
});

modal.style.display = "none";

// Load default category on page load
fetchMoviesByCategory("popular");