// ====== SET YOUR TMDB KEY HERE ======
const TMDB_API_KEY = "08b92e5716a4598e8675669f4bf48c04"; // Get a (v3) Read Access Key from your TMDB account
// ====================================

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

const $ = (id) => document.getElementById(id);
const form = $("searchForm");
const input = $("searchInput");
const results = $("results");
const statusBox = $("status");

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
    <article class="card">
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

async function searchMovies(query) {
  setStatus("Searching…");
  results.innerHTML = "";

  const url =
    "https://api.themoviedb.org/3/search/movie" +
    `?api_key=${encodeURIComponent(TMDB_API_KEY)}` +
    `&query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB HTTP ${res.status}`);
    }
    const data = await res.json();
    const list = Array.isArray(data.results) ? data.results : [];

    if (list.length === 0) {
      setStatus("No results. Try another title.");
      return;
    }

    const html = list
      .slice(0, 24) // limit grid size
      .map(movieCard)
      .join("");
    results.innerHTML = html;
    setStatus(`Showing ${Math.min(list.length, 24)} of ${list.length} results`, true);
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
