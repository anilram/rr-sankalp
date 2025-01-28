// Your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the map container
    style: 'mapbox://styles/mapbox/streets-v11', // Map style
    center: [78.4867, 18.0750], // Initial coordinates [lng, lat]
    zoom: 4, // Initial zoom level
});

// Example GeoJSON data with 11 features
const geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [81.6092, 21.2235] // Sankalp School, Raipur
            },
            "properties": {
                "title": "sankalp",
                "url": "https://en.wikipedia.org/wiki/Hyderabad"
            }
        }
    ]
};

// Add markers with hover popups
geojson.features.forEach((feature) => {
    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;
    console.log(properties.title)
    // Add a default Mapbox marker
    const marker = new mapboxgl.Marker()
        .setLngLat([lng, lat]) // Set marker position
        .addTo(map);

    // Create the popup without the close button
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`<p>${properties.title}</p>`); // Popup content

    // Show the popup on hover
    const markerElement = marker.getElement();
    popup.setLngLat([lng, lat]).addTo(map); // Add popup to the map


    // Redirect to map.html and pass the title on click
    markerElement.addEventListener('click', () => {
        window.location.href = `/map.html?title=${encodeURIComponent(properties.title)}`;
    });
});

// Array to store the bounds for all markers
const bounds = new mapboxgl.LngLatBounds();

// Add markers to the map and update bounds
geojson.features.forEach((marker) => {
    const { geometry, properties } = marker;
    const [lng, lat] = geometry.coordinates;

    // Extend the bounds to include the marker's coordinates
    bounds.extend([lng, lat]);
});

// Fit the map to the bounds of all markers
map.fitBounds(bounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 }, // Optional padding
    maxZoom: 8, // Optional: Limit the zoom level
    duration: 1000 // Smooth animation for zooming and centering
});