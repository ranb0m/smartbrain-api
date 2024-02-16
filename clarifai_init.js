function initializeClarifaiRequestOptions(detectUrl) {
    // Your PAT (Personal Access Token) can be found in the portal under Authentification
    const PAT = '1ee20e56315b4a268cbbf3580e3829a7';
    // Specify the correct user_id/app_id pairings
    // Since you're making inferences outside your app's scope
    const USER_ID = 'ranbom';       
    const APP_ID = 'my-first-application-sc6qdt';
    // Change these to whatever model and image URL you want to use
    const MODEL_ID = 'face-detection';
    const IMAGE_URL = detectUrl;

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };
    
    return requestOptions
};

module.exports = {
    initializeClarifaiRequestOptions
}