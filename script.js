

let currentPage = 1;
let currentGenre = "";
let currentSearch = "";
const API_URL = "https://graphql.anilist.co";
const animeContainer = document.getElementById("animeContainer");
const loader = document.getElementById("loader");
let currentPage = 1;

// GraphQL Query
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
      description
      episodes
      genres
      averageScore
      coverImage { large }
    }
  }
}
`;


async function fetchAnime(page = 1, search = "", genre = "") {
  loader.classList.remove("d-none");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: animeQuery,
      variables: { page, search, genre }
    })
  });

  const data = await response.json();
  loader.classList.add("d-none");

  return data.data.Page.media;
}

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
          <button class="btn btn-sm btn-outline-warning" onclick="addFavorite(event, ${anime.id})">❤️</button>
        </div>
      </div>
    `;

    animeContainer.appendChild(col);
  });
}
async function filterByGenre(genre) {
  currentGenre = genre;
  currentSearch = "";
  currentPage = 1;

  setActiveButton(genre);

  const data = await fetchAnime(currentPage, "", currentGenre);
  displayAnime(data);
}
async function showDetails(id) {
  const anime = await fetchAnime(1);
  const selected = anime.find(a => a.id === id);

  document.getElementById("modalContent").innerHTML = `
    <h3>${selected.title.romaji}</h3>
    <img src="${selected.coverImage.large}" class="img-fluid mb-3">
    <p>${selected.description || "No description available."}</p>
    <p><strong>Episodes:</strong> ${selected.episodes || "N/A"}</p>
    <p><strong>Genres:</strong> ${selected.genres.join(", ")}</p>
    <p><strong>Score:</strong> ⭐ ${selected.averageScore || "N/A"}</p>
  `;

  new bootstrap.Modal(document.getElementById("animeModal")).show();
}
function setActiveButton(selectedGenre) {
  const buttons = document.querySelectorAll("#categoryButtons button");

  buttons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.textContent === selectedGenre || 
        (selectedGenre === "" && btn.textContent === "All")) {
      btn.classList.add("active");
    }
  });
}

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  currentPage = 1;
  currentSearch = document.getElementById("searchInput").value;

  const data = await fetchAnime(currentPage, currentSearch, currentGenre);
  displayAnime(data);
});

function showFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favorites.length) return alert("No favorites yet!");

  fetchAnime().then(data => {
    const favAnime = data.filter(anime => favorites.includes(anime.id));
    displayAnime(favAnime);
  });
}

function loadMore() {
  currentPage++;
  fetchAnime(currentPage).then(data => {
    displayAnime(data, true);
  });
}

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  currentPage = 1;
  const search = document.getElementById("searchInput").value;
  const data = await fetchAnime(currentPage, search);
  displayAnime(data);
});

window.onload = async () => {
  const data = await fetchAnime(currentPage);
  displayAnime(data);
};
