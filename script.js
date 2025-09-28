// CONFIG: put your real values here
const SUPABASE_URL = "https://ejtmutknriolqazimwlh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdG11dGtucmlvbHFhemltd2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMjQsImV4cCI6MjA3NDU4NzMyNH0.Geo1Z5zFc-aUKQ3iPQZwalG56SPnVB_dTZwzEnrqMck";

// Grab Supabase createClient from the CDN
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let movies = [];
const K = 30;
let movieA, movieB;

// Load movies from Supabase
async function loadMovies() {
    const { data, error } = await supabaseClient.from("movies").select("*");
    if (error) {
        console.error("Error loading movies:", error);
        return;
    }
    movies = data;
    console.log(movies);
    if (movies.length > 1) {
        randomMatchup();
        updateLeaderboard();
    }
}

// Pick two random movies
function randomMatchup() {
    if (movies.length < 2) return;

    movieA = movies[Math.floor(Math.random() * movies.length)];
    do {
        movieB = movies[Math.floor(Math.random() * movies.length)];
    } while (movieB.id === movieA.id);

    document.getElementById("movieA").textContent = `${movieA.Name} (${Math.round(movieA.Rating)})`;
    document.getElementById("movieB").textContent = `${movieB.Name} (${Math.round(movieB.Rating)})`;
}


// Elo calculation
function eloUpdate(winner, loser) {
    let expectedWinner = 1 / (1 + Math.pow(10, (loser.Rating - winner.Rating) / 400));
    let expectedLoser = 1 / (1 + Math.pow(10, (winner.Rating - loser.Rating) / 400));
    winner.Rating += K * (1 - expectedWinner);
    loser.Rating += K * (0 - expectedLoser);
}

// Save Ratings back to Supabase
async function saveRatings() {
    // Update only existing rows by id
    for (const m of [movieA, movieB]) {
        const { error } = await supabaseClient
            .from("movies")
            .update({ Rating: m.Rating })
            .eq("id", m.id);
        if (error) console.error("Error saving:", error);
    }
}

// Update leaderboard
function updateLeaderboard() {
    let sortedMovies = [...movies].sort((a, b) => b.Rating - a.Rating);
    let RatingsHTML = sortedMovies.map(m => `<li>${m.Name}: ${Math.round(m.Rating)}</li>`).join("");
    document.getElementById("ratings").innerHTML = RatingsHTML;
}

// Event listeners
document.getElementById("movieA").addEventListener("click", async () => {
    eloUpdate(movieA, movieB);
    await saveRatings();
    updateLeaderboard();
    randomMatchup();
});

document.getElementById("movieB").addEventListener("click", async () => {
    eloUpdate(movieB, movieA);
    await saveRatings();
    updateLeaderboard();
    randomMatchup();
});

// Initialize
loadMovies();
