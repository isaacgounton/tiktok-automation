const express = require('express');
const bodyParser = require('body-parser');
const { IgApiClient } = require('instagram-private-api');
const rp = require('request-promise');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const ig = new IgApiClient();

async function postToInsta(username, password, caption, videoUrl, coverImageUrl) {
    // Set a consistent device and location
    const deviceId = `android-${Math.random().toString(36).slice(2, 10)}`;
    ig.state.deviceId = deviceId;
    ig.state.deviceString = 'android-30/11.0.3';
    ig.state.phoneId = deviceId;
    ig.state.uuid = deviceId;
    ig.state.adid = deviceId;
    ig.state.build = 'Samsung Galaxy S21';
    
    // Set location to Canada
    ig.state.proxyUrl = '';
    ig.state.cookieStore.state.location = {
        latitude: 43.6532, // Toronto coordinates
        longitude: -79.3832,
        city: 'Toronto',
        country: 'Canada',
        timezone: 'America/Toronto',
        language: 'en_CA'
    };
    
    try {
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(username, password);
        
        // Handle checkpoint challenge if needed
        if (ig.state.checkpoint) {
            await ig.challenge.auto(true); // Auto-complete challenge
            await ig.challenge.sendSecurityCode(ig.state.checkpoint.challenge.params.choice);
        }
        
        // Process session
        await ig.simulate.postLoginFlow();

        const [videoBuffer, coverImageBuffer] = await Promise.all([
            downloadContent(videoUrl),
            downloadContent(coverImageUrl),
        ]);

        await ig.publish.video({
            video: videoBuffer,
            coverImage: coverImageBuffer,
            caption: caption,
        });
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
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
        console.error('Error details:', error);
        if (error.name === 'IgCheckpointError') {
            res.status(400).json({
                error: 'Instagram security checkpoint required',
                message: 'Please log in to Instagram directly and verify your account'
            });
            return;
        }
        res.status(500).send('Failed to post video');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
