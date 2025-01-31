// Mapbox initialization
mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';
  
const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');
const walkthroughContainer = document.getElementById('walkthrough-container');


const orthoCenter = [81.6146, 21.2336];
const orthoZoom = 18.75;

const polygonColors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#8A2BE2'];
const lineColors = ['#FF4500', '#1E90FF', '#32CD32', '#FF1493', '#00FA9A'];

let geojsonData = null;
let floorMarkers = [];
let polygonVisibility = {};
let selectedLocation = null;

// Initialize Mapbox map
function initializeMap() {
  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: orthoCenter,
    zoom: orthoZoom,
    attributionControl:false
  });

  map.on('load', () => {
    // Add raster tileset layer
    map.addSource('orthoTileset', {
      type: 'raster',
      url: 'mapbox://rayapati49.9uxo2nuz',
    });
    map.addLayer({
      id: 'orthoTilesetLayer',
      source: 'orthoTileset',
      type: 'raster',
      layout: { visibility: 'visible' },
    });

    // Load and add GeoJSON layers
    loadGeoJSONLayers();

    
  });
}

// Load GeoJSON data and create polygon and line layers
function loadGeoJSONLayers() {
  axios.get('/bundle/assets/22110429807_features.geojson').then((response) => {
    const data = response.data;
    let polygonColorIndex = 0;
    let lineColorIndex = 0;

    data.features.map((feature, index) => {
      const layerName = feature.properties.layer || `Layer ${index + 1}`;
      let color;

        color = polygonColors[polygonColorIndex % polygonColors.length];
        color = lineColors[lineColorIndex % lineColors.length];    
        addLayer(layerName, feature, color);
        polygonColorIndex++;
        lineColorIndex++;
        addLabelLayer(layerName, feature);
        addLayerCheckbox(layerName, color);
        
      polygonVisibility[layerName] = true;
      
    });
  });
}


// Function to add the text label layer (block no)
function addLabelLayer(layerName, feature) {
  if(layerName!=='School'){
  const labelLayerId = `${layerName}-label`;
  console.log(labelLayerId)
  // Add a new GeoJSON source for the labels
  map.addSource(labelLayerId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: feature.geometry,
          properties: { name: layerName },
        },
      ],
    },
  });

  // Add a symbol layer for the labels
  map.addLayer({
    id: labelLayerId,
    type: 'symbol',
    source: labelLayerId,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 23,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#000000', // Black text
      'text-halo-color': '#ffffff', // White halo for visibility
      'text-halo-width': 3,
    },
  });
 }
}


// Add GeoJSON layer to the map
function addLayer(layerName, feature, color) {
  map.addSource(layerName, {
    type: 'geojson',
    data: feature,
  });  
  console.log(layerName)
  if(layerName!=='School'){
    map.addLayer({
      id: `${layerName}Fill`,
      type: 'fill',
      source: layerName,
      paint: { 'fill-color': color, 'fill-opacity': 0.5 },
      layout: { visibility: 'visible' },
    });
  }
    map.addLayer({
      id: `${layerName}Line`,
      type: 'line',
      source: layerName,
      paint: { 'line-color': color, 'line-width': 4 },
      layout: { visibility: 'visible' },
    });
  }

// Load GeoJSON data and create markers
async function loadGeoJSONMarkers() {
  try {
    const response = await axios.get('/bundle/assets/22110429807_spaces.geojson');
    geojsonData = response.data;

    // Call the function to create the floor panel and return it
    const floorPanel = addPannel(geojsonData);
    return floorPanel;
  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
  }
}

// Modified addPannel function
function addPannel(geojsonData) {
  console.log(geojsonData);
  const floorPanel = document.createElement('div');
  floorPanel.className = 'floor-panel';
  floorPanel.style.boxShadow = '0 0 10px #888888';
  floorPanel.style.marginTop = '20px';
  floorPanel.style.paddingLeft = '4px';
  floorPanel.style.paddingTop = '10px';
  floorPanel.style.paddingRight = '5px';
  floorPanel.style.paddingBottom = '5px';
  floorPanel.style.color = 'black';

  const ul = document.createElement('ul');
  ul.style.paddingLeft = '5px';
  ul.style.margin = '5px';

  geojsonData.floors.forEach((floor, index) => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    

    const button = document.createElement('p');
    button.className = 'floors';
    button.textContent = floor;
    button.style.marginTop = '7px';
    
    button.onclick = () => handleFloorSelection(floor);

    // Create a nested list for sub-buttons
    const subUl = document.createElement('ul');
    subUl.style.paddingLeft = '10px'; // Indent sub-buttons

    // Example sub-buttons for each floor
    const subButtons = getSubButtonsForFloor(floor); // Function to get sub-buttons based on the floor

    subButtons.forEach(subButton => {
      const subLi = document.createElement('li');
      subLi.style.listStyle = 'none';
      
      subLi.style.marginTop = '7px';
      

      const modelButton = document.createElement('p');
      modelButton.className = 'model-button';
      modelButton.textContent = subButton.name;

      // Check if the subButton has a URL or modelId
      if (subButton.url) {
        
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      } else {
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      }

      subLi.appendChild(modelButton); // Append the model button to the sub-list item
      subUl.appendChild(subLi);
     
      //async handleFloorSelection(floor);

    });

    li.appendChild(button);
    li.appendChild(subUl); // Append the sub-button list to the floor button
    ul.appendChild(li);
  });

  floorPanel.appendChild(ul);
  return floorPanel;
}

// Function to get sub-buttons based on the floor
function getSubButtonsForFloor(floor) {
  const subButtons = {
    'Block1 Ground': [
      { name: 'Office', url: 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=25&sr=-.49,.95' },
      { name: 'Class 5A', url: '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48' },
      { name: 'Class 1A', url: 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=14&sr=3.11,-1.15' },
      { name: 'HM Room', url: '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48' },
      { name: 'Toilet Room', url: 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=18&sr=-1.45,1.35'}
    ],
    'Block2 Ground': [
      { name: 'Outside', url: 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=17&sr=-2.9,.8' },
      { name: 'Class Room1', url: 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=24&sr=,1' },
      { name: 'Class Room2', url: 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=17&sr=-2.9,.8' }
    ]
  };
  return subButtons[floor] || [];
}

// New function to handle 3D model viewing for specific areas
function openModelViewerForFloor(area){ 
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');

  if (!modelViewer || !modelOverlay || !modelFrame || !floorPlanFrame) {
    console.error('Required elements are missing from the DOM.');
    return;
  }

  const deepLink = getDeepLinkForArea(area);
  
  if (deepLink) {
    modelFrame.src = deepLink;
    floorPlanFrame.src = deepLink;
  } else {
    console.error('No deep link available for this area.');
    return;
  }
  
  modelViewer.classList.add('active');
  modelOverlay.classList.add('active');
  
  modelFrame.addEventListener('load', async () => {
    try {
      const modelSdk = await modelFrame.contentWindow.MP_SDK.connect(modelFrame.contentWindow);
      console.log('Connected to 3D Model SDK:', modelSdk);

      const floorPlan = document.getElementById('floor-plan');
      const marker = createFloorPlanMarker(floorPlan);
      listenForPositionChanges(modelSdk, marker);

      setTimeout(async () => {
        await ensureFloorPlanMode(modelSdk);
      }, 1000);
    } catch (error) {
      console.error('Error connecting to 3D Model SDK:', error);
    }
  });
}

async function ensureFloorPlanMode(sdk) {
  try {
    if (!sdk) {
      console.error("SDK is not initialized.");
      return;
    }

    console.log("Current Mode:", await sdk.Mode.getCurrentMode());
    console.log("Switching to FLOORPLAN mode...");

    await new Promise(resolve => setTimeout(resolve, 1000));

    await sdk.Mode.moveTo(sdk.Mode.Mode.FLOORPLAN, {
      transition: sdk.Mode.TransitionType.FLY
    });

    await sdk.Floor.showAll();
    await sdk.Camera.setRotation({
      x: -85,
      y: 0,
      z: 0
    });
    console.log("Successfully switched to FLOORPLAN mode.");
  } catch (error) {
    console.error("Error ensuring FLOORPLAN mode:", error);
  }
}

// Function to extract position from the deep link
function extractPositionFromDeepLink(deepLink) {
  // Implement logic to parse the deep link and return the position
  // For example, if the deep link contains coordinates in the URL, extract them
  // This is a placeholder implementation; adjust based on your deep link format
  return { x: 0, y: 0, z: 0 }; // Replace with actual logic
}

// Function to get the deep link based on the area
function getDeepLinkForArea(area) {
  const deepLinks = {
   'Office':'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=25&sr=-.49,.95',
    'Class 5A': '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48',
    'Class 1A': 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=14&sr=3.11,-1.15',
    'HM Room' : '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48',
    'Toilet Room': 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&ss=18&sr=-1.45,1.35',
    'Outside': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=17&sr=-2.9,.8',
    'Class Room1': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=24&sr=,1',
    'Class Room2': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&ss=17&sr=-2.9,.8'
 
  };
  return deepLinks[area] || '';
}

// Add checkbox for toggling layer visibility
async function addLayerCheckbox(layerName, color) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const colorBox = document.createElement('div');
  colorBox.style.backgroundColor = color;
  colorBox.className = 'layer-color-box';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  checkbox.addEventListener('change', () => toggleLayerVisibility(layerName));

  const label = document.createElement('label');
  label.textContent = layerName;
  container.appendChild(checkbox);
  container.appendChild(colorBox);
  container.appendChild(label);

  // Check if layerName is 'School' and fetch the floor panel
  if (layerName === 'School'){
    console.log(layerName);
    
    // Wait for the GeoJSON markers and floor panel to be loaded
    const floorPanel = await loadGeoJSONMarkers();
    if (floorPanel) {
      container.appendChild(floorPanel);  // Append the floor panel to the container
    }
  }

  layerContainer.appendChild(container);
}

// Ensure Floor Plan Mode
async function ensureFloorPlanMode(sdk) {
  try {
    if (!sdk) {
      console.error("SDK is not initialized.");
      return;
    }

    console.log("Current Mode:", await sdk.Mode.getCurrentMode());
    console.log("Switching to FLOORPLAN mode...");

    // Introduce a delay before switching modes
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

    await sdk.Mode.moveTo(sdk.Mode.Mode.FLOORPLAN, {
      transition: sdk.Mode.TransitionType.FLY
    });

    await sdk.Floor.showAll();
    await sdk.Camera.setRotation({
      x: -85,
      y: 0,
      z: 0
    });
    console.log("Successfully switched to FLOORPLAN mode.");
  } catch (error) {
    console.error("Error ensuring FLOORPLAN mode:", error);
  }
}

// Initialize Matterport SDK for 3D view with deeplink
async function initializeMatterportSdk(deepLink) {
  const iframe = document.getElementById('modelFrame');
  try {
    const sdk = await window.MP_SDK.connect(iframe);
    console.log('Connected to Matterport SDK:', sdk);
    return sdk;
  } catch (error) {
    console.error('Error connecting to Matterport SDK:', error);
    return null;
  }
}

// Create a marker on the floor plan
function createFloorPlanMarker(floorPlan) {
  const marker = document.createElement('div');
  marker.id = 'location-marker';
  marker.style.position = 'absolute';
  marker.style.width = '10px';
  marker.style.height = '10px';
  marker.style.backgroundColor = 'red';
  marker.style.borderRadius = '50%'; // Make it circular
  floorPlan.appendChild(marker);
  return marker;
}

// Listen for position changes in the 3D view
function listenForPositionChanges(sdk, marker) {
  if (!sdk) {
    console.error('SDK not initialized. Cannot listen for position changes.');
    return;
  }
  sdk.Camera.pose.subscribe((pose) => {
    const position = pose.position;
    updateMarkerPosition(position, marker);
  });
}

// Function to update marker position
function updateMarkerPosition(position, marker) {
  // Convert 3D position to 2D floor plan coordinates
  const floorPlanPosition = convertToFloorPlanCoordinates(position);
  marker.style.left = `${floorPlanPosition.x}px`;
  marker.style.top = `${floorPlanPosition.y}px`;
}

// Function to convert 3D coordinates to 2D floor plan coordinates
function convertToFloorPlanCoordinates(position) {
  // Implement your logic here to map 3D coordinates to 2D
  // This is a placeholder; you'll need to adjust based on your floor plan
  return {
    x: position.x * scaleFactor, // Scale factor based on your floor plan
    y: position.y * scaleFactor
  };
}

// Toggle layer visibility
function toggleLayerVisibility(layerName) {
  const isVisible = !polygonVisibility[layerName];
  polygonVisibility[layerName] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';

  map.setLayoutProperty(`${layerName}Fill`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Line`, 'visibility', visibility);
}

let currentFloor = null; // This will store the currently selected floor
let currentMarkers = []; // This will store the markers for the current floor
let currentLabelLayers = []; // This will store the label layers for the current floor

function handleFloorSelection(floor) {
  // If a floor is already selected, remove its markers and labels
  console.log(floor)
  if (currentFloor !== null) {
      // Remove the markers associated with the previous floor
      currentMarkers.forEach(marker => marker.remove());
      
      // Remove the label layers associated with the previous floor
      currentLabelLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
              map.removeSource(layerId);
          }
      });

      // Clear the previous floor's marker and label arrays
      currentMarkers = [];
      currentLabelLayers = [];
  }

  // Store the new selected floor
  currentFloor = floor;
  const filteredFeatures = geojsonData.features.filter(
      feature => feature.properties.Floor === floor
  );

  // Now add markers and labels for the new selected floor
  filteredFeatures.forEach(feature => {
    if (feature.properties.Floor === currentFloor) {
      const el = document.createElement('div');
      el.className = 'marker';
      el.setAttribute('data-floor', feature.properties.Floor);

      const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
          offset: [0, 0],
          clickTolerance: 3
      })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);

      // Create a label layer ID specific to the feature
      const labelLayerId = `${feature.properties.Space}-label`;

      // Add a new GeoJSON source for the labels
      map.addSource(labelLayerId, {
          type: 'geojson',
          data: {
              type: 'FeatureCollection',
              features: [
                  {
                      type: 'Feature',
                      geometry: feature.geometry,
                      properties: { space: feature.properties.Space },
                  },
              ],
          },
      });

      // Add a symbol layer for the labels
      map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: labelLayerId,
          layout: {
              'text-field': ['get', 'space'], // Use the space property to label the marker
              'text-size': 16,
              'text-anchor': 'bottom',
          },
          paint: {
              'text-color': '#000000',
              'text-halo-color': '#ffffff',
              'text-halo-width': 3,
          },
      });

      // Store the markers and label layers
      currentMarkers.push(marker);
      currentLabelLayers.push(labelLayerId);
    }
  });
}

const markerStyles = `
.marker {
  width: 10px;
  height: 10px;
  background-color: #4CAF50;
  border: 2px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  cursor: pointer !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.marker::after {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.marker:hover {
  transform: rotate(-45deg) scale(1.1);
  background-color: #45a049;
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.marker[data-floor="Block1 Ground"] {
  background-color: #4CAF50;  /* Green */
}

.marker[data-floor="BlockUN Ground"] {
  background-color: #2196F3;  /* Blue */
}

.marker[data-floor="Block3 Ground"] {
  background-color: #FF9800;  /* Orange */
}

.marker[data-floor="Block4 Ground"] {
  background-color:rgb(243, 33, 166);  /* Blue */
}

.marker[data-floor="Block4 First"] {
  background-color:rgb(251, 23, 31);  /* Orange */
}

}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);

document.querySelector('.close-button').addEventListener('click', () => {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  document.getElementById('map-container').classList.add('shifted'); // Shift the map
  modelViewer.classList.remove('active');
  modelOverlay.classList.remove('active');
  modelFrame.src = '';
  floorPlanFrame.src = '';
});

function openModelViewerForFloor(area) {
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  
  const deepLink = getDeepLinkForArea(area);
  
  if (deepLink) {
    modelFrame.src = deepLink;
    floorPlanFrame.src = deepLink;
  } else {
    console.error('No deep link available for this area.');
    return;
  }
  
  modelViewer.classList.add('active');
  modelOverlay.classList.add('active');
  
  modelFrame.addEventListener('load', async () => {
    try {
      const sdk = await initializeMatterportSdk(deepLink);
      console.log('Connected to 3D Model SDK:', sdk);

      const floorPlan = document.getElementById('floor-plan');
      const marker = createFloorPlanMarker(floorPlan);
      listenForPositionChanges(sdk, marker);

      setTimeout(async () => {
        await ensureFloorPlanMode(sdk);
      }, 1000);
    } catch (error) {
      console.error('Error connecting to 3D Model SDK:', error);
    }
  });
}

async function initializeMatterportSdk(deepLink) {
  const iframe = document.getElementById('modelFrame');
  try {
    const sdk = await window.MP_SDK.connect(iframe);
    console.log('Connected to Matterport SDK:', sdk);
    return sdk;
  } catch (error) {
    console.error('Error connecting to Matterport SDK:', error);
    return null;
  }
}

function createFloorPlanMarker(floorPlan) {
  const marker = document.createElement('div');
  marker.id = 'location-marker';
  marker.style.position = 'absolute';
  marker.style.width = '10px';
  marker.style.height = '10px';
  marker.style.backgroundColor = 'red';
  marker.style.borderRadius = '50%';
  floorPlan.appendChild(marker);
  return marker;
}

function listenForPositionChanges(sdk, marker) {
  if (!sdk) {
    console.error('SDK not initialized. Cannot listen for position changes.');
    return;
  }
  sdk.Camera.pose.subscribe((pose) => {
    const position = pose.position;
    updateMarkerPosition(position, marker);
  });
}

function updateMarkerPosition(position, marker) {
  const floorPlanPosition = convertToFloorPlanCoordinates(position);
  marker.style.left = `${floorPlanPosition.x}px`;
  marker.style.top = `${floorPlanPosition.y}px`;
}

function convertToFloorPlanCoordinates(position) {
  return {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor
  };
}

async function ensureFloorPlanMode(sdk) {
  try {
    if (!sdk) {
      console.error("SDK is not initialized.");
      return;
    }

    console.log("Current Mode:", await sdk.Mode.getCurrentMode());
    console.log("Switching to FLOORPLAN mode...");

    await new Promise(resolve => setTimeout(resolve, 1000));

    await sdk.Mode.moveTo(sdk.Mode.Mode.FLOORPLAN, {
      transition: sdk.Mode.TransitionType.FLY
    });

    await sdk.Floor.showAll();
    await sdk.Camera.setRotation({
      x: -85,
      y: 0,
      z: 0
    });
    console.log("Successfully switched to FLOORPLAN mode.");
  } catch (error) {
    console.error("Error ensuring FLOORPLAN mode:", error);
  }
}

function getDeepLinkForArea(area) {
  const deepLinks = {
   'Office':'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&play=1&qs=1&ss=25&sr=-.49,.95',
    'Class 5A': '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48',
    'Class 1A': 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&play=1&qs=1&ss=14&sr=3.11,-1.15',
    'HM Room' : '3eb46242aad791aefa762d89a01f631aa5c09f1c73c3bae55df33bcaaa769c33caeea5adbc48',
    'Toilet Room': 'https://my.matterport.com/show/?m=YLH6dFWsLfQ&cloudEdit=1&play=1&qs=1&ss=18&sr=-1.45,1.35',
    'Outside': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&play=1&qs=1&ss=17&sr=-2.9,.8',
    'Class Room1': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&play=1&qs=1&ss=24&sr=,1',
    'Class Room2': 'https://my.matterport.com/show/?m=MCHGhtpKu2H&cloudEdit=1&play=1&qs=1&ss=17&sr=-2.9,.8'

  };
  return deepLinks[area] || '';
}

initializeMap();