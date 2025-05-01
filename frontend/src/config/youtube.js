import axios from "axios";

const KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

const youtube = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3",
    params: {
        part: "snippet",
        maxResults: 5,
        key: KEY,
        type: "video"
    }
});

export default youtube; 