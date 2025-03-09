const axios = require('axios');

const fetchRepoDetails = async (owner, name) => {
    try {
        const token = process.env.GITHUB_TOKEN;
        const headers = token ? { Authorization: `token ${token}` } : {};

        const [repoData, contributors] = await Promise.all([
            axios.get(`https://api.github.com/repos/${owner}/${name}`, { headers }),
            axios.get(`https://api.github.com/repos/${owner}/${name}/contributors`, { headers })
        ]);

        return {
            name,
            owner,
            url: repoData.data.html_url,
            description: repoData.data.description || "No description",
            stars: repoData.data.stargazers_count,
            forks: repoData.data.forks_count,
            contributors: contributors.data.length,
            creator: repoData.data.owner.login,
            created_at: repoData.data.created_at,
            last_updated: repoData.data.updated_at,
            language: repoData.data.language,
        };
    } catch (error) {
        console.error(`❌ Failed to fetch details for ${name}: ${error.message}`);
        return null;
    }
};

module.exports = fetchRepoDetails;
