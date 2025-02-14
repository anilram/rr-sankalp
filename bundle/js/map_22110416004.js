// Mapbox initialization
mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';
  
const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');
const walkthroughContainer = document.getElementById('walkthrough-container');

const orthoCenter = [81.6250933, 21.2518064];
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
    map.addSource('local-tiles', {
        type: 'raster',
        tiles: ['http://localhost:8080/data/22110416004/{z}/{x}/{y}.png'],
        tileSize: 256
    });

    map.addLayer({
        id: 'local-layer',
        type: 'raster',
        source: 'local-tiles'
    });
    // Load and add GeoJSON layers
    loadGeoJSONLayers();
  });
}

// Load GeoJSON data and create polygon and line layers
function loadGeoJSONLayers() {
  axios.get('/bundle/assets/22110416004_features.geojson').then((response) => {
    const data = response.data;
    let polygonColorIndex = 0;
    let lineColorIndex = 0;
    document.querySelector('.section-title').textContent = data.schoolname_code;
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
    const response = await axios.get('/bundle/assets/22110416004_spaces.geojson');
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
    'Block1 Floor1': [
      { name: 'Class 3A', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=55&play=1&sr=-2.86,1.43' },
      { name: 'Class 4A', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=43&sr=-2.19,1.05' },
      { name: 'Class 3B', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=39&sr=-2.96,-.73' },
      { name: 'Class 1A', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=32&sr=' },
      { name: 'HM Room', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=3&sr=' },
      { name: 'Kitchen Room', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=10&sr=-2.32,1.24' },
      { name: 'Toilets', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=24&sr=-1.68,-1.32' }
    ],
    'Block1 Floor2': [
      { name: 'Library', url: 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=17&sr=-3.02,-.29' },
      { name: 'Store Room', url: 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=13&sr=-3.14' },
      { name: 'Class 2A', url: 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=24&sr=-.2,-.08' },
      { name: 'Class 5B', url: 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=3&sr=-3.14' },
      { name: 'Girls Toilets', url: 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=24&sr=-1.68,-1.32' }
      
    ],
    'Block1 Floor3': [
      { name: 'Seminar Hall', url: 'https://my.matterport.com/show/?m=KKsNGzHP2M6&cloudEdit=1&ss=6&sr=-.11,.94' }
    ]
  };
  return subButtons[floor] || [];
}


// New function to handle 3D model viewing for specific areas
function openModelViewerForFloor(area){ 
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = ensureModelOverlay();
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');



  if (!modelViewer || !modelOverlay || !modelFrame || !floorPlanFrame) {
    console.error('Required elements are missing from the DOM.');
    return;
  }
  

  const deepLink = getDeepLinkForArea(area);
  
  if (deepLink) {
    const enhancedDeepLink = `${deepLink}&application=sdk&title=0&qs=1`;
    modelFrame.src = enhancedDeepLink;
    floorPlanFrame.src = enhancedDeepLink;
  } else {
    console.error('No deep link available for this area.');
    return;
  }
  
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.add('shifted');
  modelViewer.classList.add('active');
  modelOverlay.classList.add('active');
  
  modelFrame.addEventListener('load', async () => {
    try {
      const sdks = await initializeMatterportSdk(deepLink);
      if (sdks) {
        window.modelSdk = sdks.modelSdk;
        window.floorPlanSdk = sdks.floorPlanSdk;
        console.log('Both SDKs connected and synchronized');
      }
    } catch (error) {
      console.error('Error initializing SDKs:', error);
    }
  });
}

async function initializeMatterportSdk(deepLink) {
    const iframe = document.getElementById('modelFrame');
    
    return new Promise((resolve, reject) => {
        iframe.addEventListener('load', async () => {
            try {
                setTimeout(async () => {
                    try {
                        const sdk = await iframe.contentWindow.MP_SDK.connect(
                            iframe,
                            'h8m1gx75u1bezk7yaw7yggzwb',
                            ''
                        );
                        
                        // Initialize floor plan SDK
                        const floorPlanIframe = document.getElementById('floorPlanFrame');
                        const floorPlanSdk = await floorPlanIframe.contentWindow.MP_SDK.connect(
                            floorPlanIframe,
                            'h8m1gx75u1bezk7yaw7yggzwb',
                            ''
                        );

                        // Create and setup position marker
                        const marker = createFloorPlanMarker();
                        setupSynchronization(sdk, floorPlanSdk, marker);
                        
                        console.log('Successfully connected to both SDKs');
                        resolve({ modelSdk: sdk, floorPlanSdk: floorPlanSdk });
                    } catch (err) {
                        console.error('Error connecting to SDKs:', err);
                        reject(err);
                    }
                }, 2000);
            } catch (error) {
                console.error('Error in SDK initialization:', error);
                reject(error);
            }
        });
    });
}

// Create a marker for position tracking
function createFloorPlanMarker() {
    const marker = document.createElement('div');
    marker.className = 'position-marker';
    marker.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: #ff0000;
        border: 2px solid #ffffff;
        border-radius: 50%;
        position: absolute;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
    `;
    
    const container = document.querySelector('.model-viewer');
    container.appendChild(marker);
    return marker;
}

// Setup synchronization between 3D view and floor plan
function setupSynchronization(modelSdk, floorPlanSdk, marker) {
    // Ensure floor plan mode
    ensureFloorPlanMode(floorPlanSdk);
    
    // Track position changes in 3D view
    modelSdk.Camera.pose.subscribe(function(pose) {
        updateMarkerPosition(pose, marker, floorPlanSdk);
    });
}

// Update marker position based on camera movement
async function updateMarkerPosition(pose, marker, floorPlanSdk) {
    try {
        // Get current position from 3D view
        const position = pose.position;
        
        // Get floor plan bounds for proper scaling
        const bounds = await floorPlanSdk.Floor.getBounds();
        
        // Convert 3D coordinates to floor plan coordinates
        const coords = convertToFloorPlanCoordinates(position, bounds);
        
        // Update marker position
        marker.style.left = `${coords.x}px`;
        marker.style.top = `${coords.y}px`;
        
        console.log('Updated marker position:', coords);
    } catch (error) {
        console.error('Error updating marker position:', error);
    }
}

// Convert 3D coordinates to floor plan coordinates
function convertToFloorPlanCoordinates(position, bounds) {
    // Get the floor plan container dimensions
    const container = document.getElementById('floorPlanFrame');
    const containerRect = container.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = containerRect.width / (bounds.max.x - bounds.min.x);
    const scaleZ = containerRect.height / (bounds.max.z - bounds.min.z);
    
    // Convert coordinates
    const x = ((position.x - bounds.min.x) * scaleX) + containerRect.left;
    const y = ((position.z - bounds.min.z) * scaleZ) + containerRect.top;
    
    return { x, y };
}

// Ensure floor plan is in proper mode
async function ensureFloorPlanMode(sdk) {
    try {
        await sdk.Mode.moveTo(sdk.Mode.Mode.floorplan);
        console.log('Switched to floor plan mode');
    } catch (error) {
        console.error('Error switching to floor plan mode:', error);
    }
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

// Toggle layer visibility
function toggleLayerVisibility(layerName) {
  const isVisible = !polygonVisibility[layerName];
  polygonVisibility[layerName] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';

  map.setLayoutProperty(`${layerName}Fill`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Line`, 'visibility', visibility);
}

let currentFloor = null; 
let currentMarkers = []; 
let currentLabelLayers = []; 

function handleFloorSelection(floor) {
  if (currentFloor !== null) {
      currentMarkers.forEach(marker => marker.remove());
      
      currentLabelLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
              map.removeSource(layerId);
          }
      });

      currentMarkers = [];
      currentLabelLayers = [];
  }

  currentFloor = floor;
  const filteredFeatures = geojsonData.features.filter(
      feature => feature.properties.Floor === floor
  );

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
      el.addEventListener('click', () => {
            openModelViewerForFloor(feature.properties.Space)
      });
      const labelLayerId = `${feature.properties.Space}-label`;

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

      map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: labelLayerId,
          layout: {
              'text-field': ['get', 'space'], 
              'text-size': 16,
              'text-anchor': 'top',
          },
          paint: {
              'text-color': '#000000',
              'text-halo-color': '#ffffff',
              'text-halo-width': 3,
          },
      });

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
  background-color: #4CAF50;  
}

.marker[data-floor="BlockUN Ground"] {
  background-color: #2196F3;  
}

.marker[data-floor="Block3 Ground"] {
  background-color: #FF9800;  
}

.marker[data-floor="Block4 Ground"] {
  background-color:rgb(243, 33, 166);  
}

.marker[data-floor="Block4 First"] {
  background-color:rgb(251, 23, 31);  
}

`;

// Function to get the deep link based on the area
function getDeepLinkForArea(area) {
    const deepLinks = {
      'Class 3A': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=55&play=1&sr=-2.86,1.43',
      'Class 4A': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=43&play=1&sr=-2.19,1.05',
      'Class 3B': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=39&play=1&sr=-2.96,-.73',
      'Class 1A': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=32&play=1&sr=',
      'HM Room': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=3&play=1&sr=',
      'Kitchen Room': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&play=1&ss=10&sr=-2.32,1.24',
      'Toilets': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=24&play=1&sr=-1.68,-1.32',
      'Library': 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=17&play=1&sr=-3.02,-.29',
      'Store Room': 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=13&play=1&sr=-3.14',
      'Class 2A': 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=24&play=1&sr=-.2,-.08',
      'Class 5B': 'https://my.matterport.com/show/?m=CPpHn54PdoV&cloudEdit=1&ss=3&play=1&sr=-3.14',
      'Girls Toilets': 'https://my.matterport.com/show/?m=zUqyeDKr71d&cloudEdit=1&ss=24&play=1&sr=-1.68,-1.32',
      'Seminar Hall': 'https://my.matterport.com/show/?m=KKsNGzHP2M6&cloudEdit=1&play=1&ss=6&sr=-.11,.94'
      
    };
    return deepLinks[area] || '';
  }
// Initialize Matterport SDK for 3D view
async function initializeMatterportSdk(deepLink) {
  const iframe = document.getElementById('modelFrame');
  const maxRetries = 3;
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    const tryConnect = async () => {
      try {
        if (!iframe.contentWindow || !iframe.contentWindow.MP_SDK) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retry attempt ${retryCount} for Model SDK`);
            setTimeout(tryConnect, 2000);
            return;
          }
          throw new Error('MP_SDK not available');
        }

        const sdk = await iframe.contentWindow.MP_SDK.connect(
          iframe,
          'h8m1gx75u1bezk7yaw7yggzwb',
          ''
        );
        console.log('Model SDK connected successfully');
        resolve(sdk);
      } catch (err) {
        console.error('Error connecting to Model SDK:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} for Model SDK`);
          setTimeout(tryConnect, 2000);
        } else {
          reject(err);
        }
      }
    };

    iframe.addEventListener('load', tryConnect);
  });
}

// Initialize Floor Plan SDK
async function initializeFloorPlanSdk(deepLink) {
  const iframe = document.getElementById('floorPlanFrame');
  const maxRetries = 3;
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    const tryConnect = async () => {
      try {
        if (!iframe.contentWindow || !iframe.contentWindow.MP_SDK) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retry attempt ${retryCount} for Floor Plan SDK`);
            setTimeout(tryConnect, 2000);
            return;
          }
          throw new Error('MP_SDK not available');
        }

        const sdk = await iframe.contentWindow.MP_SDK.connect(
          iframe,
          'h8m1gx75u1bezk7yaw7yggzwb',
          ''
        );
        await ensureFloorPlanMode(sdk);
        console.log('Floor Plan SDK connected successfully');
        resolve(sdk);
      } catch (err) {
        console.error('Error connecting to Floor Plan SDK:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} for Floor Plan SDK`);
          setTimeout(tryConnect, 2000);
        } else {
          reject(err);
        }
      }
    };

    iframe.addEventListener('load', tryConnect);
  });
}

// Create marker for position tracking
function createFloorPlanMarker() {
  const marker = document.createElement('div');
  marker.className = 'position-marker';
  
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const container = floorPlanFrame.parentElement;
  container.appendChild(marker);
  
  return marker;
}

// Setup synchronization between 3D view and floor plan
function setupSynchronization(modelSdk, floorPlanSdk, marker) {
  modelSdk.Camera.pose.subscribe(function(pose) {
    updateMarkerPosition(pose, marker, floorPlanSdk);
  });
}

// Update marker position based on camera movement
async function updateMarkerPosition(pose, marker, floorPlanSdk) {
  try {
    const bounds = await floorPlanSdk.Floor.getBounds();
    const coords = convertToFloorPlanCoordinates(pose.position, bounds);
    
    marker.style.left = `${coords.x}px`;
    marker.style.top = `${coords.y}px`;
  } catch (error) {
    console.error('Error updating marker position:', error);
  }
}

// Convert 3D coordinates to floor plan coordinates
function convertToFloorPlanCoordinates(position, bounds) {
  const container = document.getElementById('floorPlanFrame');
  const rect = container.getBoundingClientRect();
  
  // Calculate scale factors
  const scaleX = rect.width / (bounds.max.x - bounds.min.x);
  const scaleZ = rect.height / (bounds.max.z - bounds.min.z);
  
  // Convert coordinates
  const x = ((position.x - bounds.min.x) * scaleX);
  const y = ((position.z - bounds.min.z) * scaleZ);
  
  return { x, y };
}

// Ensure floor plan is in proper mode
async function ensureFloorPlanMode(sdk) {
  try {
    await sdk.Mode.moveTo(sdk.Mode.Mode.floorplan);
    await sdk.Camera.setRotation({ x: -90, y: 0, z: 0 });
    console.log('Switched to floor plan mode');
  } catch (error) {
    console.error('Error switching to floor plan mode:', error);
  }
}

// Close model viewer function
function closeModelViewer() {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const mapContainer = document.getElementById('map-container');
  
  mapContainer.classList.remove('shifted');
  modelViewer.classList.remove('active');
  modelOverlay.classList.remove('active');
  
  // Clear iframes
  modelFrame.src = '';
  floorPlanFrame.src = '';
  
  // Remove marker if it exists
  const marker = document.querySelector('.position-marker');
  if (marker) {
    marker.remove();
  }
}

// Add model overlay to the DOM if it doesn't exist
function ensureModelOverlay() {
  let modelOverlay = document.querySelector('.model-overlay');
  if (!modelOverlay) {
    modelOverlay = document.createElement('div');
    modelOverlay.className = 'model-overlay';
    document.body.appendChild(modelOverlay);
  }
  return modelOverlay;
}

const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);

document.querySelector('.close-button').addEventListener('click', () => {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.remove('shifted'); 
  modelViewer.classList.remove('active');
  modelOverlay.classList.remove('active');
  modelFrame.src = '';
  floorPlanFrame.src = '';
});

initializeMap();