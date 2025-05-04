function startScan() {
    const urlInput = document.getElementById('urlInput').value.trim();

    const loader = document.getElementById('loader');
    const scanButton = document.querySelector('.scan-button');

    if (urlInput === "") {
        alert("Please enter a URL first!");
        return;
    }

    console.log('Starting scan for URL:', urlInput);  // Add this line to debug

    loader.style.display = "block"; // Show loader
    scanButton.disabled = true; // Disable the button during scan

    // Send the URL to the Flask backend
    fetch('http://127.0.0.1:5000/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlInput })
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = "none"; // Hide loader
        scanButton.disabled = false; // Enable the button after scan
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);  // Show the scan result message
        }
    })
    .catch(error => {
        loader.style.display = "none";
        scanButton.disabled = false;
        alert("Error occurred: " + error);
    });
}
