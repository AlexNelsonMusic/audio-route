// canvas settings

const canvas = new fabric.Canvas('canvas', {
    // backgroundColor: 'red'
    selection: true
});

function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.renderAll();
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);

// get mouse position

let pointerPosition = { x: 0, y: 0 };

canvas.on('mouse:move', (event) => {
    const pointer = canvas.getPointer(event.e);
    pointerPosition.x = pointer.x;
    pointerPosition.y = pointer.y;
});

// layer logic

document.addEventListener('keydown', (e) => {
    const activeObject = canvas.getActiveObject();

    if (!activeObject) return; // Ensure an object is selected

    switch (e.code) {
        case 'KeyF':
            if (e.shiftKey) {
                // Shift + F: Bring to Front
                canvas.bringToFront(activeObject);
            } else {
                // F: Bring Forward
                canvas.bringForward(activeObject);
            }
            break;

        case 'KeyB':
            if (e.shiftKey) {
                // Shift + B: Send to Back
                canvas.sendToBack(activeObject);
            } else {
                // B: Send Backward
                canvas.sendBackwards(activeObject);
            }
            break;
    }

    canvas.renderAll(); // Re-render to reflect changes
});

// retain true layer position when object is selected
canvas.preserveObjectStacking = true;

// object creation/deletion, hotkeys/shortcuts

let isSearchBarActive = false;


document.addEventListener('keydown', (e) => {
    if (isSearchBarActive) {
        return;
    }

    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
        e.preventDefault();
        document.getElementById('controls-window').style.visibility = 'visible';
    }

    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
        e.preventDefault();
        saveCanvasAsPDF();
    }

    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        e.preventDefault();

        const allObjects = canvas.getObjects();
        if (allObjects.length > 0) {
            const selection = new fabric.ActiveSelection(allObjects, {
                canvas: canvas,
            });
            canvas.setActiveObject(selection);
            canvas.renderAll();
        }
    }

    const activeObject = canvas.getActiveObject();

    // prevent hotkeys from activating while editing textbox
    if ((activeObject && (activeObject.type === 'note' || activeObject.type === 'personal') && activeObject.isEditing) || (e.metaKey || e.ctrlKey)) {
        return;
    }

    if (e.code === "KeyG") {
        e.preventDefault(); // stop g from being typed into the search bar
        gearListContainer.style.display = "block";

        gearListContainer.style.position = "absolute";
        gearListContainer.style.left = `${pointerPosition.x}px`;
        gearListContainer.style.top = `${pointerPosition.y}px`;
        
        searchBar.value = ""; // clear search bar
        searchResults.innerHTML = ""; // clear search results
        searchBar.focus();
        isSearchBarActive = true;
    }

    if (e.code === "Backspace" || e.code === "Delete") {
        const activeObjects = canvas.getActiveObjects();

        // allow group deletion
        if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => {
                canvas.remove(obj); // remove each object
            });
            canvas.discardActiveObject(); // clear selection
            canvas.renderAll();

            compileGearInventory();
        }
    }

    if (e.code === "KeyN") {
        const note = new fabric.Textbox('Note', {
            width: 75,
            left: pointerPosition.x,
            top: pointerPosition.y,
            type: 'note', // Custom property
        });
        canvas.add(note);
    }

    if (e.code === "KeyP") {
        const personalGear = new fabric.Textbox('Custom Gear', {
            width: 75,
            left: pointerPosition.x,
            top: pointerPosition.y,
            type: 'personal', // Custom property
        });
        canvas.add(personalGear);
    }

    if (e.code === "KeyR") {
        const rectangle = new fabric.Rect({
            width: 100,
            height: 60,
            fill: '#000000',
            left: pointerPosition.x,
            top: pointerPosition.y
        });
        canvas.add(rectangle);
    } 

    if (e.code === "KeyS") {
        const square = new fabric.Rect({
            width: 80,
            height: 80,
            fill: '#000000',
            left: pointerPosition.x,
            top: pointerPosition.y
        });
        canvas.add(square);
    } 

    if (e.code === "KeyC") {
        const circle = new fabric.Circle({
            radius: 50,
            fill: '#000000',
            left: pointerPosition.x,
            top: pointerPosition.y
        });
        canvas.add(circle);
    }

    if (e.code === 'KeyI') {
        const gearInventory = compileGearInventory();
        alert('Gear Inventory:\n' + gearInventory.join('\n')); 
    }
});

// object duplication

let isAltPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
        isAltPressed = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        isAltPressed = false;
    }
});

canvas.on('object:moving', (e) => {
    if (isAltPressed && e.target) {
        const activeObject = e.target;

        // prevent multiple clones during a single drag
        if (!activeObject.isCloned) {
            activeObject.isCloned = true;

            // clone active object
            activeObject.clone((cloned) => {
                cloned.set({
                    evented: true
                });

                // Reset `isCloned` so this object can be cloned again
                cloned.isCloned = false;

                canvas.add(cloned);

                canvas.setActiveObject(activeObject);

                compileGearInventory();
            });
        }
    }
});

// Reset `isCloned` flag when drag ends
canvas.on('mouse:up', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.isCloned = false;
    }
});

// object nudging

document.addEventListener('keydown', (e) => {
    const activeObject = canvas.getActiveObject();

    if (!activeObject) return; // Do nothing if no object is selected

    const isShiftPressed = e.shiftKey;
    let step;
    if (isShiftPressed) {
        step = 10;
    } else {
        step = 1;
    }

    switch (e.code) {
        case 'ArrowUp':
            activeObject.top -= step;
            break;
        case 'ArrowDown':
            activeObject.top += step;
            break;
        case 'ArrowLeft':
            activeObject.left -= step;
            break;
        case 'ArrowRight':
            activeObject.left += step;
            break;
        default:
            return; // ignore other keys
    }

    activeObject.setCoords(); // update object position
    canvas.renderAll();

    colorPicker.style.display = 'none';
});

// re-show color picker after nudging
document.addEventListener('keyup', (e) => {
    if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
    ) {
        movePicker();
    }
});

// color picker

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.id = 'color-picker';
document.body.appendChild(colorPicker);

// move color picker to new object

function movePicker() {
    const activeObject = canvas.getActiveObject();

    // hide picker if no objects selected
    if (!activeObject || !(activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'note'|| activeObject.type === 'personal')) {
        colorPicker.style.display = 'none';
        return;
    }

    const canvasRect = canvas.getElement().getBoundingClientRect(); // get canvas position

    // position picker on left edge of object
    const objectLeft = (activeObject.left - 30) * canvas.getZoom();
    const objectTop = activeObject.top * canvas.getZoom();

    colorPicker.style.left = `${canvasRect.left + objectLeft}px`;
    colorPicker.style.top = `${canvasRect.top + objectTop}px`;
    colorPicker.style.display = 'block';

    // update color picker value
    const color = rgbToHex(activeObject.fill || '#000000');
    colorPicker.value = color;

    // re-add to DOM (force refresh)
    const parent = colorPicker.parentElement;
    parent.removeChild(colorPicker);
    parent.appendChild(colorPicker);
}

function rgbToHex(color) {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color; // return if already in hex

    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        return `#${match.slice(1, 4)
            .map(num => parseInt(num).toString(16).padStart(2, '0'))
            .join('')}`;
    }

    console.warn('Unexpected color format:', color);
    return '#000000';
}

// move color picker to new object
canvas.on('selection:created', movePicker);
canvas.on('selection:updated', movePicker);

// hide color picker on unselect
canvas.on('selection:cleared', () => {
    colorPicker.style.display = 'none';
});
// hide color picker on object drag
canvas.on('object:moving', () => {
    colorPicker.style.display = 'none';
});

// re-show color picker after dragging
canvas.on('object:modified', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        movePicker();
    }
});

// update object color
colorPicker.addEventListener('input', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'note'|| activeObject.type === 'personal')) {
        activeObject.set('fill', colorPicker.value);
        canvas.renderAll();
    }
});

// Gear images

let gearList = [];

fetch('javascript/gearList.json')
    .then(response => response.json())
    .then(data => {
        gearList = data;
        // console.log('Gear List:', gearList);
    })
    .catch(error => {
        console.error('Error loading gear list:', error);
    });

const gearListContainer = document.getElementById('gear-list-container');
const searchBar = document.getElementById('search-bar');
const searchResults = document.getElementById('search-results');

document.addEventListener('click', (e) => {
    if (!gearListContainer.contains(e.target)) {
        gearListContainer.style.display = "none";
        isSearchBarActive = false;
        searchResults.innerHTML = "";
        searchResults.style.border = "none";
    }
});

searchBar.addEventListener('input', () => {
    const searchQuery = searchBar.value.toLowerCase();
    const filteredGear = gearList.filter(item => item.name.toLowerCase().includes(searchQuery));

    searchResults.innerHTML = "";

    if (filteredGear.length > 0) {
        searchResults.style.border = "1px solid #ccc";
        filteredGear.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.name;
            div.style.cursor = "pointer";
            div.style.padding = "5px";
            div.style.borderBottom = "1px solid #ccc";
            div.addEventListener('click', () => addGearToCanvas(item.url));
            searchResults.appendChild(div);
        });
    } else {
        searchResults.style.border = "none";
    }
});

function addGearToCanvas(url) {
    fabric.Image.fromURL(url, (img) => {

        const scaleX = 150 / img.width;
        const scaleY = 150 / img.width;
        const scale = Math.min(scaleX, scaleY);

        img.set({
            left: pointerPosition.x,
            top: pointerPosition.y,
            scaleX: scale,
            scaleY: scale
        });
        canvas.add(img);
        gearListContainer.style.display = "none"; 
        isSearchBarActive = false;

        compileGearInventory();
    });
}

// Gear Inventory

function compileGearInventory() {
    const gearInventoryMap = new Map(); // To keep track of item counts
   
    canvas.getObjects().forEach(obj => {
        if (obj.type === 'image' && obj._element) {
            const url = obj._element.src;
    
            // extract file pathname from image url
            const parsedUrl = new URL(url);
            const relativeUrl = parsedUrl.pathname;
    
            const matchingGear = gearList.find(item => relativeUrl.endsWith(item.url));
    
            if (matchingGear) {
                const gearName = matchingGear.name;
                // increment item number or add it to map
                if (gearInventoryMap.has(gearName)) {
                    gearInventoryMap.set(gearName, gearInventoryMap.get(gearName) + 1);
                } else {
                    gearInventoryMap.set(gearName, 1);
                }
            } else {
                console.log('No matching gear found for:', url);
            }
        } else if (obj.type === 'personal') {
            const text = obj.text.trim();
            // increment item number or add it to map
            if (gearInventoryMap.has(text)) {
                gearInventoryMap.set(text, gearInventoryMap.get(text) + 1);
            } else {
                gearInventoryMap.set(text, 1);
            }
        }
    });

    // convert map to 
    const gearInventory = Array.from(gearInventoryMap.entries()).map(([name, count]) => {
        if (count > 1) {
            return `${name} (x${count})`;
        } else {
            return name;
        }
    });

    console.log('Session List:', gearInventory);
    return gearInventory;
}

function saveCanvasAsPDF() {
    const { jsPDF } = window.jspdf;

    // Prompt user for file name
    const fileName = prompt('Enter a name for your PDF file:', 'My Setup');
    if (!fileName) {
        alert('File name cannot be empty. PDF download canceled.');
        return; // exit if user cancels or enters nothing
    }

    canvas.renderAll();

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 }); // multiplier = quality

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);

    pdf.save(`${fileName}.pdf`);
}

function saveCanvasState() {
    const canvasState = canvas.toJSON();
    localStorage.setItem('canvasState', JSON.stringify(canvasState));
    console.log('Canvas state saved.');
}

canvas.on('object:modified', saveCanvasState);
canvas.on('object:added', saveCanvasState);
canvas.on('object:removed', saveCanvasState);

window.addEventListener('load', () => {
    const savedCanvasState = localStorage.getItem('canvasState');
    if (savedCanvasState) {
        canvas.loadFromJSON(savedCanvasState, () => {
            canvas.renderAll();
            console.log('Canvas state restored.');
        });
    }
});

// controls window

document.getElementById('close-window').addEventListener('click', () => {
    document.getElementById('controls-window').style.visibility = 'hidden';
} )
