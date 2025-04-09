const express = require('express');
const bodyParser = require('body-parser');
const { IgApiClient } = require('instagram-private-api');
const rp = require('request-promise');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const ig = new IgApiClient();

async function postToInsta(username, password, caption, videoUrl, coverImageUrl) {
    ig.state.generateDevice(username);
    await ig.account.login(username, password);

    const [videoBuffer, coverImageBuffer] = await Promise.all([
        downloadContent(videoUrl),
        downloadContent(coverImageUrl),
    ]);

    await ig.publish.video({
        video: videoBuffer,
        coverImage: coverImageBuffer,
        caption: caption,
    });
}

const downloadContent = async (url) => {
    const options = {
        uri: url,
        encoding: null, // This will ensure the response is returned as a Buffer
    };
    return rp(options);
};

// API endpoint to post a video to Instagram
app.post('/postToInstagram', async (req, res) => {
    const { username, password, caption, videoUrl, coverImageUrl } = req.body;

    // Validate the required fields
    if (!username || !password || !caption || !videoUrl || !coverImageUrl) {
        return res.status(400).send('Missing required fields: username, password, caption, videoUrl, coverImageUrl');
    }

    try {
        await postToInsta(username, password, caption, videoUrl, coverImageUrl);
        res.send('Video posted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to post video');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
