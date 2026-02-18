
const API_URL = "https://graphql.anilist.co";

const animeContainer = document.getElementById("animeContainer");
const loader = document.getElementById("loader");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

let currentPage = 1;
let currentGenre = "";
let currentSearch = "";

/* =========================
   GRAPHQL QUERIES
========================= */

// Main List Query
const animeQuery = `
query ($page: Int, $search: String, $genre: String) {
  Page(page: $page, perPage: 12) {
    media(
      search: $search,
      genre: $genre,
      sort: TRENDING_DESC,
      type: ANIME
    ) {
      id
      title { romaji }
      description(asHtml: false)
      episodes
      genres
      averageScore
      coverImage { large }
    }
  }
}
`;

// Single Anime Detail Query (Better than previous version)
const detailQuery = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    description(asHtml: false)
    episodes
    genres
    averageScore
    coverImage { large }
  }
}
`;

/* =========================
   FETCH FUNCTIONS
========================= */

async function fetchAnime(page = 1, search = "", genre = "") {
  loader.classList.remove("d-none");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: animeQuery,
        variables: { page, search, genre }
      })
    });

    const data = await response.json();
    return data.data.Page.media;
  } catch (error) {
    console.error("Error fetching anime:", error);
    return [];
  } finally {
    loader.classList.add("d-none");
  }
}

async function fetchAnimeById(id) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: detailQuery,
        variables: { id }
      })
    });

    const data = await response.json();
    return data.data.Media;
  } catch (error) {
    console.error("Error fetching details:", error);
  }
}

/* =========================
   DISPLAY FUNCTIONS
========================= */

function displayAnime(animeList, append = false) {
  if (!append) animeContainer.innerHTML = "";

  animeList.forEach(anime => {
    const col = document.createElement("div");
    col.className = "col-md-3 mb-4";

    col.innerHTML = `
      <div class="card text-light" onclick="showDetails(${anime.id})">
        <img src="${anime.coverImage.large}" class="card-img-top">
        <div class="card-body">
          <h6>${anime.title.romaji}</h6>
          <p>⭐ ${anime.averageScore || "N/A"}</p>
          <button 
            class="btn btn-sm btn-outline-warning"
            onclick="addFavorite(event, ${anime.id})">
            ❤️
          </button>
        </div>
      </div>
    `;

    animeContainer.appendChild(col);
  });
}

/* =========================
   MODAL DETAILS
========================= */

async function showDetails(id) {
  const anime = await fetchAnimeById(id);

  document.getElementById("modalContent").innerHTML = `
    <h3>${anime.title.romaji}</h3>
    <img src="${anime.coverImage.large}" class="img-fluid mb-3">
    <p>${anime.description || "No description available."}</p>
    <p><strong>Episodes:</strong> ${anime.episodes || "N/A"}</p>
    <p><strong>Genres:</strong> ${anime.genres.join(", ")}</p>
    <p><strong>Score:</strong> ⭐ ${anime.averageScore || "N/A"}</p>
  `;

  new bootstrap.Modal(document.getElementById("animeModal")).show();
}

/* =========================
   FAVORITES
========================= */

function addFavorite(event, id) {
  event.stopPropagation();

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!favorites.includes(id)) {
    favorites.push(id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert("Added to favorites!");
  }
}

async function showFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!favorites.length) {
    alert("No favorites yet!");
    return;
  }

  const animeData = await Promise.all(
    favorites.map(id => fetchAnimeById(id))
  );

  displayAnime(animeData);
}

/* =========================
   CATEGORY FILTER
========================= */

async function filterByGenre(genre) {
  currentGenre = genre;
  currentSearch = "";
  currentPage = 1;

  setActiveButton(genre);

  const data = await fetchAnime(currentPage, "", currentGenre);
  displayAnime(data);
}

function setActiveButton(selectedGenre) {
  const buttons = document.querySelectorAll("#categoryButtons button");

  buttons.forEach(btn => {
    btn.classList.remove("active");

    if (
      btn.textContent === selectedGenre ||
      (selectedGenre === "" && btn.textContent === "All")
    ) {
      btn.classList.add("active");
    }
  });
}

/* =========================
   PAGINATION
========================= */

function loadMore() {
  currentPage++;

  fetchAnime(currentPage, currentSearch, currentGenre)
    .then(data => displayAnime(data, true));
}

/* =========================
   SEARCH
========================= */

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  currentPage = 1;
  currentSearch = searchInput.value;

  const data = await fetchAnime(currentPage, currentSearch, currentGenre);
  displayAnime(data);
});

/* =========================
   INITIAL LOAD
========================= */

window.onload = async () => {
  const data = await fetchAnime(currentPage, "", "");
  displayAnime(data);
};
