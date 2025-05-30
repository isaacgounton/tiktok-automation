const express = require('express');
const bodyParser = require('body-parser');
const { IgApiClient } = require('instagram-private-api');
const rp = require('request-promise');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const ig = new IgApiClient();

async function postToInsta(username, password, caption, videoUrl, coverImageUrl) {
    // Configure device and location info
    ig.state.generateDevice(username);
    ig.state.deviceString = 'android-30/11.0.3';
    ig.state.timezoneOffset = -14400; // Toronto timezone offset in seconds
    ig.state.language = 'en_CA';
    ig.state.locale = 'en_CA';
    ig.state.radio_type = 'wifi-none';
    ig.state.userAgent = 'Instagram 219.0.0.12.117 Android (30/11.0.3; 420dpi; 1080x2400; samsung; SM-G991U1; o1s; exynos2100; en_CA; 346138365)';
    
    try {
        // Simplified login flow
        const loggedInUser = await ig.account.login(username, password);
        
        // Handle checkpoint challenge if needed
        if (ig.state.checkpoint) {
            await ig.challenge.auto(true); // Auto-complete challenge
            await ig.challenge.sendSecurityCode(ig.state.checkpoint.challenge.params.choice);
        }

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
