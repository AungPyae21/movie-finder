export default async function handler(request, response) {
  const apiKey = process.env.TMDB_API_KEY;
  const baseUrl = "https://api.themoviedb.org/3";
  const { search, genre, page, popular, movieId } = request.query;
  let url;

  // Handle request for a single movie's details
  if (movieId) {
    url = `${baseUrl}/movie/${movieId}?api_key=${apiKey}`;
  } else if (search) {
    url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
      search
    )}&page=${page || 1}`;
  } else if (genre) {
    url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genre}&page=${
      page || 1
    }`;
  } else {
    url = `${baseUrl}/movie/popular?api_key=${apiKey}&page=${page || 1}`;
  }

  try {
    const tmdbResponse = await fetch(url);
    if (!tmdbResponse.ok) {
      throw new Error(`TMDB API error: ${tmdbResponse.status}`);
    }
    const data = await tmdbResponse.json();
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "s-maxage=86400");
    response.status(200).json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch data from TMDB" });
  }
}
